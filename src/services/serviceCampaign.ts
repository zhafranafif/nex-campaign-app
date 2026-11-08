import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";


export interface Campaign {
    id: string;
    title: string;
    status: "open" | "closed";
    ratePerVideoTBH: number;
}

export const getCampaigns = async (): Promise<Campaign[]> => {
    const q = query(collection(db, "campaigns"), where("status", "==", "open"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        status: doc.data().status,
        ratePerVideoTBH: doc.data().ratePerVideoTBH,
    }));
}