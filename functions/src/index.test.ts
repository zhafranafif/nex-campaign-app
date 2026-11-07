import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { markPaid, reviewSubmission } from "./index";

/*
  These tests call the real onCall handlers with .run().

  Firestore is mocked because these are unit tests. The mock only implements
  the Firestore methods used by index.ts: collection(), runTransaction(),
  transaction.get(), transaction.update(), and transaction.create().
*/
const mockedFirestore = vi.hoisted(() => ({
  database: undefined as Firestore | undefined,
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => "fake-server-timestamp",
  },
  getFirestore: () => mockedFirestore.database,
}));

function createMockFirestore(status: string) {
  let submission = { status };
  const auditLogs: Record<string, Record<string, unknown>> = {};

  const database = {
    collection: (collectionName: string) => ({
      doc: (documentId: string) => ({
        id: documentId,
        path: `${collectionName}/${documentId}`,
      }),
    }),

    runTransaction: async (callback: (transaction: {
      get: () => Promise<{
        exists: boolean;
        data: () => typeof submission;
      }>;
      update: (_reference: unknown, values: { status: string; reason?: string }) => void;
      create: (
        reference: { id: string },
        values: Record<string, unknown>,
      ) => void;
    }) => Promise<unknown>) => {
      let update: { status: string; reason?: string } | undefined;
      let auditLog:
        | { id: string; values: Record<string, unknown> }
        | undefined;

      const result = await callback({
        get: async () => ({
          exists: true,
          data: () => ({ ...submission }),
        }),
        update: (_reference, values) => {
          update = values;
        },
        create: (reference, values) => {
          auditLog = { id: reference.id, values };
        },
      });

      if (update) {
        submission = { ...submission, ...update };
      }
      if (auditLog) {
        auditLogs[auditLog.id] = auditLog.values;
      }

      return result;
    },
  } as unknown as Firestore;

  mockedFirestore.database = database;

  return {
    getSubmission: () => submission,
    getAuditLogCount: () => Object.keys(auditLogs).length,
  };
}

function request(
  data: Record<string, unknown>,
  role?: string,
) {
  return {
    data,
    auth: role
      ? { uid: "ops-user", token: { role } }
      : undefined,
  } as Parameters<typeof reviewSubmission.run>[0];
}

describe("reviewSubmission", () => {
  it("allows an ops user to approve a pending submission", async () => {
    const firestore = createMockFirestore("pending");

    const result = await reviewSubmission.run(
      request({ id: "submission-1", decision: "approved" }, "ops"),
    );

    expect(result.message).toBe("Submission submission-1 has been approved.");
    expect(firestore.getSubmission().status).toBe("approved");
    expect(firestore.getAuditLogCount()).toBe(1);
  });

  it("allows an ops user to reject with a reason", async () => {
    const firestore = createMockFirestore("pending");

    await reviewSubmission.run(
      request(
        {
          id: "submission-1",
          decision: "rejected",
          reason: "The submission is not eligible.",
        },
        "ops",
      ),
    );

    expect(firestore.getSubmission()).toEqual({
      status: "rejected",
      reason: "The submission is not eligible.",
    });
  });

  it("rejects a rejection without a reason", async () => {
    createMockFirestore("pending");

    await expect(
      reviewSubmission.run(
        request(
          { id: "submission-1", decision: "rejected", reason: " " },
          "ops",
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unauthenticated users", async () => {
    createMockFirestore("pending");

    await expect(
      reviewSubmission.run(
        request({ id: "submission-1", decision: "approved" }),
      ),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects users without the ops claim", async () => {
    createMockFirestore("pending");

    await expect(
      reviewSubmission.run(
        request({ id: "submission-1", decision: "approved" }, "creator"),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
});

describe("markPaid", () => {
  it("allows an ops user to mark an approved submission as paid", async () => {
    const firestore = createMockFirestore("approved");

    const result = await markPaid.run(
      request({ id: "submission-1" }, "ops"),
    );

    expect(result.message).toBe(
      "Submission submission-1 has been marked as paid.",
    );
    expect(firestore.getSubmission().status).toBe("paid");
    expect(firestore.getAuditLogCount()).toBe(1);
  });

  it("rejects payment for a pending submission", async () => {
    createMockFirestore("pending");

    await expect(
      markPaid.run(request({ id: "submission-1" }, "ops")),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("is safe to call twice", async () => {
    const firestore = createMockFirestore("approved");
    const paidRequest = request({ id: "submission-1" }, "ops");

    await markPaid.run(paidRequest);
    const secondResult = await markPaid.run(paidRequest);

    expect(secondResult.message).toBe(
      "Submission submission-1 was already paid.",
    );
    expect(firestore.getAuditLogCount()).toBe(1);
  });
});
