import {
    collection,
    getDocs,
    orderBy,
    query,
    QueryConstraint,
    Timestamp,
    where,
    type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase/config";


export type SubmissionStatus = "pending" | "approved" | "rejected" | "paid";

export interface Submission {
    id: string;
    campaignId: string;
    creatorId: string;
    tiktokUrl: string;
    status: SubmissionStatus;
    createdAt: Date;
}

interface submissionFilters {
    status?: Submission["status"] | "all";
    campaignId?: string;
}

const isSubmissionStatus = (value: string): value is SubmissionStatus =>
    value === "pending"
    || value === "approved"
    || value === "rejected"
    || value === "paid";

const parseSubmission = (
    id: string,
    data: DocumentData,
): Submission => {
    if (
        typeof data.campaignId !== "string"
        || typeof data.creatorId !== "string"
        || typeof data.tiktokUrl !== "string"
        || !isSubmissionStatus(data.status)
        || !(data.createdAt instanceof Timestamp)
    ) {
        throw new Error(`Invalid submission document: ${id}`);
    }

    return {
        id,
        campaignId: data.campaignId,
        creatorId: data.creatorId,
        tiktokUrl: data.tiktokUrl,
        status: data.status,
        createdAt: data.createdAt.toDate(),
    };
};

export const getReviewQueue = async (filters: submissionFilters = {}): Promise<Submission[]> => {
    const constraint: QueryConstraint[] = [];

    if (filters.status && filters.status !== "all") {
        constraint.push(where("status", "==", filters.status));
    }

    if (filters.campaignId) {
        constraint.push(where("campaignId", "==", filters.campaignId));
    }

    constraint.push(orderBy("createdAt", "desc"));
    
    const q = query(collection(db, "submissions"), ...constraint);

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => parseSubmission(doc.id, doc.data()));
};

export const getSubmissionByCreatorId = async (creatorId: string): Promise<Submission[]> => {
    const q = query(
        collection(db, "submissions"),
        where("creatorId", "==", creatorId),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => parseSubmission(doc.id, doc.data()));
}