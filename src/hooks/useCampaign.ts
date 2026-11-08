import { useCallback, useEffect, useState } from "react";
import { getCampaigns, type Campaign } from "../services/serviceCampaign";

type UseCampaignResult = {
    campaign: Campaign[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

export const useCampaign = (): UseCampaignResult => {
    const [campaign, setCampaign] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaign = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getCampaigns();
            setCampaign(response);
        } catch (err) {
            console.error("Error fetching campaigns:", err);
            setError("Failed to fetch campaigns.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchCampaign();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [fetchCampaign]);

    return {
        campaign,
        loading,
        error,
        refetch: fetchCampaign,
    };
};