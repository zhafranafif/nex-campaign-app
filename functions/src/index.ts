import { createHash } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Firestore,
  getFirestore,
} from "firebase-admin/firestore";
import {
  HttpsError,
  onCall,
  CallableRequest,
} from "firebase-functions/v2/https";

initializeApp();

type ReviewData = {
  id: string;
  decision: "approved" | "rejected";
  reason?: string;
};

type PaymentData = {
  id: string;
};

type SubmissionStatus = "pending" | "approved" | "rejected" | "paid";

export function auditLogId(submissionId: string, action: string): string {
  return createHash("sha256")
    .update(`${submissionId}:${action}`)
    .digest("hex");
}

export function reviewTargetStatus(
  decision: "approved" | "rejected",
  reason: string | undefined,
): "approved" | "rejected" {

  if (decision !== "approved" && decision !== "rejected") {
    throw new HttpsError(
      "invalid-argument",
      "Decision must be 'approved' or 'rejected'.",
    );
  }

  if (
    decision === "rejected" &&
    (typeof reason !== "string" || reason.trim().length === 0)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "A reason is required when rejecting a submission.",
    );
  }

  return decision;
}

function requireOps(
  request: CallableRequest<ReviewData | PaymentData>,
  operation: string,
): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  if (request.auth.token.role !== "ops") {
    throw new HttpsError(
      "permission-denied",
      `Only users with the 'ops' role can ${operation}.`,
    );
  }
}

function requireSubmissionId(id: string): string {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new HttpsError("invalid-argument", "A submission id is required.");
  }

  return id;
}

export async function transitionSubmission(
  db: Firestore,
  submissionId: string,
  expectedStatus: SubmissionStatus,
  targetStatus: Exclude<SubmissionStatus, "pending">,
  auditAction: string,
  actorId: string,
  auditFields: Record<string, unknown> = {},
): Promise<{ changed: boolean }> {
  return db.runTransaction(async (transaction) => {
    const submissionRef = db.collection("submissions").doc(submissionId);
    const submission = await transaction.get(submissionRef);

    if (!submission.exists) {
      throw new HttpsError(
        "not-found",
        `Submission with ID ${submissionId} does not exist.`,
      );
    }

    const currentStatus = submission.data()?.status as SubmissionStatus;
    if (currentStatus === targetStatus) {
      return { changed: false };
    }

    if (currentStatus !== expectedStatus) {
      throw new HttpsError(
        "failed-precondition",
        `Submission with ID ${submissionId} is not in the expected state.`,
      );
    }

    const auditRef = db
      .collection("auditLogs")
      .doc(auditLogId(submissionId, auditAction));

    transaction.update(submissionRef, {
      status: targetStatus,
      ...auditFields,
    });
    transaction.create(auditRef, {
      submissionId,
      action: auditAction,
      fromStatus: expectedStatus,
      toStatus: targetStatus,
      actorId,
      timestamp: FieldValue.serverTimestamp(),
      ...auditFields,
    });

    return { changed: true };
  });
}

export const reviewSubmission = onCall(async (request) => {
  requireOps(request, "submit reviews");

  const data = request.data as ReviewData;
  const submissionId = requireSubmissionId(data.id);
  const targetStatus = reviewTargetStatus(data.decision, data.reason);
  const reason =
    typeof data.reason === "string" ? data.reason.trim() : undefined;

  const result = await transitionSubmission(
    getFirestore(),
    submissionId,
    "pending",
    targetStatus,
    `review:${targetStatus}`,
    request.auth!.uid,
    reason === undefined ? {} : { reason },
  );

  return {
    message: result.changed
      ? `Submission ${submissionId} has been ${targetStatus}.`
      : `Submission ${submissionId} was already ${targetStatus}.`,
  };
});

export const markPaid = onCall(async (request) => {
  requireOps(request, "mark payments");

  const data = request.data as PaymentData;
  const submissionId = requireSubmissionId(data.id);

  const result = await transitionSubmission(
    getFirestore(),
    submissionId,
    "approved",
    "paid",
    "payment:paid",
    request.auth!.uid,
  );

  return {
    message: result.changed
      ? `Submission ${submissionId} has been marked as paid.`
      : `Submission ${submissionId} was already paid.`,
  };
});
