import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";


type ReviewRequest = {
    id: string;
    decision: "approved" | "rejected";
    reason?: string | null | undefined;
}

type SubmitRequest = {
    campaignId: string;
    creatorId: string;
    tiktokUrl: string;
}

type SubmissionResponse = {
    message: string;
}

const reviewSubmissionFunction = httpsCallable<ReviewRequest, SubmissionResponse>(functions, "reviewSubmission");
const submitSubmissionFunction = httpsCallable<SubmitRequest, SubmissionResponse>(functions, "submitSubmission");

export const reviewSubmission = async (id: string, decision: "approved" | "rejected", reason?: string | null | undefined): Promise<SubmissionResponse> => {
    const response = await reviewSubmissionFunction({ id, decision, reason });
    return response.data;
}

export const submitSubmission = async (campaignId: string, creatorId: string, tiktokUrl: string): Promise<SubmissionResponse> => {
    const response = await submitSubmissionFunction({ campaignId, creatorId, tiktokUrl });
    return response.data;
}


