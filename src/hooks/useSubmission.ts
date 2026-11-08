import { useCallback, useEffect, useState } from "react";
import { getReviewQueue, type Submission } from "../services/serviceSubmission";

type UseSubmissionResult = {
    submissions: Submission[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

export const useSubmission = (): UseSubmissionResult => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getReviewQueue();
            setSubmissions(response);
        } catch (err) {
            console.error("Error fetching submissions:", err);
            setError("Failed to fetch submissions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchSubmissions();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [fetchSubmissions]);

    return {
        submissions,
        loading,
        error,
        refetch: fetchSubmissions,
    };
};