import React from 'react'
import { useCreatorSubmission } from '../hooks/useCreatorSubmission';
import { useAuth } from '../hooks/useAuth';
import type { SubmissionStatus } from '../services/serviceSubmission';
import { useCampaign } from '../hooks/useCampaign';
import { submitSubmission } from '../services/serviceSubmissionFunction';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Loader from '../components/Loader';

const statusStyles: Record<SubmissionStatus, string> = {
  pending: "bg-(--secondary)/15 text-(--secondary)",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  paid: "bg-(--tertiary)/15 text-(--tertiary)",
};

const CreatorDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { creatorSubmissions, loading, error, refetch } = useCreatorSubmission(user?.uid || '');
    const { campaign, loading: campaignLoading, error: campaignError, refetch: refetchCampaign } = useCampaign();
    const [campaignId, setCampaignId] = React.useState<string>('');
    const [tiktokUrl, setTiktokUrl] = React.useState<string>('');
    const [submitting, setSubmitting] = React.useState<boolean>(false);

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user || !campaignId) {
            toast.error(t('submission.selectCampaignError'));
            return;
        }

        setSubmitting(true);

        try {
            await submitSubmission(campaignId, user.uid, tiktokUrl.trim());
            toast.success(t('submission.submissionSuccess'));
            setCampaignId('');
            setTiktokUrl('');
            await refetch();
        } catch (error) {
            console.error('Error submitting TikTok URL:', error);
            toast.error((error as Error).message || t('submission.submissionError'));
        } finally {
            setSubmitting(false);
        }
    };

    
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold text-(--on-surface)">{t('submission.creatorTitle')}</h1>
      
      <div className="w-full max-w-md rounded-3xl border border-white/[0.07] bg-(--surface-container-low) p-5 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
        <h1
          className="m-0 font-(--font-headline) text-xl leading-8 tracking-[-0.015em] text-(--on-surface) mb-4"
        >
          {t('submission.uploadTitle')}
        </h1>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2.5">
            <label
              htmlFor="campaign"
              className="text-[13px] font-semibold leading-4.5 tracking-[0.02em] text-(--on-surface)"
            >
              {t('submission.campaign')}
            </label>
            <select
              id="campaign"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
              required
              disabled={campaignLoading || Boolean(campaignError) || campaign.length === 0 || submitting}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-(--color-input) px-3 py-2 text-sm leading-5 text-(--on-surface) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:ring-4 focus:ring-(--accent-bg)"
            >
              <option value="" disabled>
                {campaignLoading ? t('submission.loadingCampaigns') : t('submission.selectCampaign')}
              </option>
              {campaign.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {campaignLoading && (
              <Loader
                className="size-4"
                containerClassName="justify-start h-auto text-sm text-(--color-text-muted)"
                text={t('submission.loadingCampaigns')}
              />
            )}
            {campaignError && (
              <div className="flex items-center justify-between gap-3 text-sm text-(--error)">
                <span>{campaignError}</span>
                <button
                  type="button"
                  onClick={() => void refetchCampaign()}
                  className="rounded-full border border-(--outline-variant) px-3 py-1 text-(--on-surface) hover:border-(--primary)"
                >
                  {t('submission.tryAgain')}
                </button>
              </div>
            )}
            {!campaignLoading && !campaignError && campaign.length === 0 && (
              <p className="text-sm text-(--color-text-muted)">
                {t('submission.noOpenCampaigns')}
              </p>
            )}

            <label
              htmlFor="tiktokUrl"
              className="text-[13px] font-semibold leading-4.5 tracking-[0.02em] text-(--on-surface)"
            >
              {t('submission.tiktokUrl')}
            </label>
            <input
              type="url"
              id="tiktokUrl"
              value={tiktokUrl}
              onChange={(event) => setTiktokUrl(event.target.value)}
              placeholder={t('submission.tiktokUrlPlaceholder')}
              autoComplete="url"
              required
              className="min-h-11 w-full rounded-xl border border-white/10 bg-(--color-input) px-3 py-2 text-sm leading-5 text-(--on-surface) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:ring-4 focus:ring-(--accent-bg)"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || campaignLoading || Boolean(campaignError) || !campaignId}
            className="mt-4 w-full rounded-full border-0 bg-linear-to-r from-(--color-primary) to-[#e01e5a] p-2 font-inherit text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(255,46,99,0.35)] transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-(--tertiary) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <Loader
                className="size-4"
                containerClassName="inline-flex h-auto"
                text={t('submission.submitting')}
              />
            )}
            {!submitting && t('submission.submission')}
          </button>
        </form>
      </div>

    <div className="overflow-x-auto rounded-2xl border border-white/[0.07] mt-10">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="bg-(--surface-container-low)">
            <tr className="border-b border-white/[0.07]">
              <th className="p-4 font-medium text-(--color-text-muted)">{t('submission.table.campaign')}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t('submission.table.url')}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t('submission.table.submitted')}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t('submission.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-(--color-text-muted)">
                  <Loader
                    className="size-8"
                    containerClassName="h-20"
                    text={t('submission.loadingSubmissions')}
                  />
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-(--error)">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-3 rounded-full border border-(--outline-variant) px-4 py-2 text-sm text-(--on-surface) hover:border-(--primary)"
                  >
                    {t('submission.tryAgain')}
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && creatorSubmissions.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-(--color-text-muted)">
                  {t('submission.noSubmissions')}
                </td>
              </tr>
            )}

            {!loading
              && !error
              && creatorSubmissions.map((submission) => (
                <tr key={submission.id} className="border-t border-white/[0.07]">
                  <td className="p-4 font-medium text-(--on-surface)">
                    {campaign.find((c) => c.id === submission.campaignId)?.title || submission.campaignId}
                  </td>
                  <td className="p-4">
                    <a
                      href={submission.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--color-primary) hover:underline"
                    >
                      {submission.tiktokUrl}
                    </a>
                  </td>
                  <td className="p-4 text-(--color-text-muted)">
                    {submission.createdAt.toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[submission.status]}`}
                    >
                      {t(`submission.status.${submission.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div> 
    </section>
  )
};

export default CreatorDashboard