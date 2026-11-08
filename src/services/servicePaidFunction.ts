import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";


type PaidRequest = {
    id: string;
}

type PaidResponse = {
    message: string;
}

const markPaidFunction = httpsCallable<PaidRequest, PaidResponse>(functions, "markPaid");

export const markPaid = async (id: string): Promise<PaidResponse> => {
    const response = await markPaidFunction({ id });
    return response.data;
}