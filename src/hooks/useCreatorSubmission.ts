import { useCallback, useEffect, useState } from "react";
import { getSubmissionByCreatorId, type Submission } from "../services/serviceSubmission";

type UseCreatorSubmissionResult = {
    creatorSubmissions: Submission[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

export const useCreatorSubmission = (creatorId: string): UseCreatorSubmissionResult => {
    const [creatorSubmissions, setCreatorSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getSubmissionByCreatorId(creatorId);
            setCreatorSubmissions(response);
        } catch (err) {
            console.error("Error fetching submissions:", err);
            setError("Failed to fetch submissions.");
        } finally {
            setLoading(false);
        }
    }, [creatorId]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchSubmissions();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [fetchSubmissions]);

    return {
        creatorSubmissions,
        loading,
        error,
        refetch: fetchSubmissions,
    };
};