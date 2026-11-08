import { useMemo, useState } from "react";
import { useSubmission } from "../hooks/useSubmission";
import type { SubmissionStatus } from "../services/serviceSubmission";
import toast from "react-hot-toast";
import { reviewSubmission } from "../services/serviceSubmissionFunction";
import { markPaid } from "../services/servicePaidFunction";
import { Calendar, ChevronDown, Download, Upload } from "lucide-react";
import { exportCsv, importCsv, type ImportCsvResponse } from "../services/serviceCsvFunction";
import { useTranslation } from "react-i18next";

const STATUS_FILTERS: Array<{ value: "all" | SubmissionStatus; label: string }> = [
  { value: "all", label: "filterStatus" },
  { value: "pending", label: "pending" },
  { value: "approved", label: "approved" },
  { value: "rejected", label: "rejected" },
  { value: "paid", label: "paid" },
];

const statusStyles: Record<SubmissionStatus, string> = {
  pending: "bg-(--secondary)/15 text-(--secondary)",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  paid: "bg-(--tertiary)/15 text-(--tertiary)",
};

const OpsDashboard = () => {
  const { t } = useTranslation();
  const { submissions, loading, error, refetch } = useSubmission();
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [importedCsvData, setImportedCsvData] = useState<ImportCsvResponse | null>(null);
  const [payoutMonth, setPayoutMonth] = useState<string>("");
  const [exportingCsv, setExportingCsv] = useState(false);

  const campaigns = useMemo(
    () => [...new Set(submissions.map((submission) => submission.campaignId))].sort(),
    [submissions],
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          (statusFilter === "all" || submission.status === statusFilter)
          && (campaignFilter === "all" || submission.campaignId === campaignFilter),
      ),
    [campaignFilter, statusFilter, submissions],
  );

  const handleActions = async (
    submissionId: string,
    action: "approved" | "rejected" | "paid",
  ) => {
    try {
      setActionId(submissionId);

      if (action === "paid") {
        await markPaid(submissionId);
        toast.success(t("ops.paidSuccess", { id: submissionId }));
      } else {
        const reason =
          action === "rejected"
            ? prompt(t("ops.rejectionReason"))?.trim()
            : undefined;

        if (action === "rejected" && !reason) {
          toast.error(t("ops.rejectionReasonRequired"));
          return;
        }

        await reviewSubmission(submissionId, action, reason);
        toast.success(t("ops.reviewSuccess", { id: submissionId, action: t(`submission.status.${action}`) }));
      }

      await refetch();
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error(t("ops.updateError"));
    } finally {
      setActionId(null);
    }
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error(t("ops.noFile"));
      return;
    }

    try {
      const report = await importCsv(file);
      setImportedCsvData(report);
      toast.success(t("ops.importSuccess", { count: report.importedCount }));
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error(t("ops.importError"));
    } finally {
      event.target.value = "";
    }
  }

  const handleExportCsv = async () => {
    if (!payoutMonth) {
      toast.error(t("ops.chooseMonth"));
      return;
    }

    try {
      setExportingCsv(true);
      const csv = await exportCsv(payoutMonth);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payouts_${payoutMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t("ops.exportSuccess", { month: payoutMonth }));
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error(t("ops.exportError"));
    } finally {
      setExportingCsv(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold text-(--on-surface)">{t("ops.title")}</h1>

      <div className="w-full flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap items-end justify-start gap-2">
            <label
              htmlFor="import-csv"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-(--surface-container-low) px-3 text-xs font-medium text-(--on-surface-variant) transition-colors hover:border-(--primary) hover:text-(--on-surface)"
            >
            <input
                type="file"
                id="import-csv"
                accept=".csv"
                className="hidden"
                onChange={handleImportCsv}
            />
            <Upload
              aria-hidden="true"
              className="size-3.5"
            />
            {t("ops.importCsv")}
            </label>

            <label
              htmlFor="payout-month"
              className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-(--surface-container-low) px-3 text-xs font-medium text-(--on-surface-variant) transition-colors focus-within:border-(--primary)"
            >
              <Calendar aria-hidden="true" className="size-3.5 text-(--on-surface-variant)" />
              <span className="sr-only">{t("ops.payoutMonth")}</span>
              <input
                type="month"
                id="payout-month"
                value={payoutMonth}
                onChange={(event) => setPayoutMonth(event.target.value)}
                max={new Date().toISOString().slice(0, 7)}
                aria-label={t("ops.payoutMonth")}
                className="min-w-29.5 bg-transparent text-xs text-(--on-surface) outline-none scheme-dark [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </label>

            <button
                type="button"
                disabled={!payoutMonth || exportingCsv}
                onClick={() => void handleExportCsv()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-(--surface-container-low) px-3 text-xs font-medium text-(--on-surface-variant) transition-colors hover:border-(--primary) hover:text-(--on-surface) disabled:cursor-not-allowed disabled:opacity-40"
                >
                <Download aria-hidden="true" className="size-3.5" />
                {exportingCsv ? t("ops.exporting") : t("ops.exportCsv")}
            </button>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
                <div className="relative">
                <select
                    value={statusFilter}
                    onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | SubmissionStatus)
                    }
                    className="h-10 appearance-none rounded-xl border border-white/10 bg-(--color-input) px-3 pr-10 text-left text-(--primary)"
                >
                    {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.value === "all" ? t("ops.filterStatus") : t(`submission.status.${option.label}`)}
                    </option>
                    ))}
                </select>

                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-(--primary)"
                />
                </div>
                <div className="relative">
                <select
                    value={campaignFilter}
                    onChange={(event) => setCampaignFilter(event.target.value)}
                    className="h-10 appearance-none rounded-xl border border-white/10 bg-(--color-input) px-3 pr-10 text-left text-(--primary)"
                >
                    <option value="all">{t("ops.filterCampaign")}</option>
                    {campaigns.map((campaignId) => (
                    <option key={campaignId} value={campaignId}>
                        {campaignId}
                    </option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-(--primary)"
                />
            </div>
        </div>
      </div>


      <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="bg-(--surface-container-low)">
            <tr className="border-b border-white/[0.07]">
              <th className="p-4 font-medium text-(--color-text-muted)">{t("submission.table.campaign")}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t("ops.creator")}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t("submission.table.url")}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t("submission.table.submitted")}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t("submission.table.status")}</th>
              <th className="p-4 font-medium text-(--color-text-muted)">{t("ops.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--color-text-muted)">
                  {t("ops.loadingSubmissions")}
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--error)">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-3 rounded-full border border-(--outline-variant) px-4 py-2 text-sm text-(--on-surface) hover:border-(--primary)"
                  >
                    {t("common.tryAgain")}
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--color-text-muted)">
                  {t("ops.noMatchingSubmissions")}
                </td>
              </tr>
            )}

            {!loading
              && !error
              && filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-t border-white/[0.07]">
                  <td className="p-4 font-medium text-(--on-surface)">
                    {submission.campaignId}
                  </td>
                  <td className="p-4 text-(--color-text-muted)">
                    {submission.creatorId}
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
                  <td className="p-4">
                    {submission.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actionId === submission.id}
                          className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => void handleActions(submission.id, "approved")}
                        >
                          {actionId === submission.id ? t("ops.updating") : t("ops.approve")}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === submission.id}
                          className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => void handleActions(submission.id, "rejected")}
                        >
                          {t("ops.reject")}
                        </button>
                      </div>
                    )}
                    {submission.status === "approved" && (
                      <button
                        type="button"
                        disabled={actionId === submission.id}
                        className="rounded-full border border-(--secondary)/40 px-4 py-2 text-sm text-(--secondary) hover:bg-(--secondary)/15 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void handleActions(submission.id, "paid")}
                      >
                        {actionId === submission.id ? t("ops.updating") : t("ops.markPaid")}
                      </button>
                    )}
                    {(submission.status === "rejected" || submission.status === "paid") && (
                      <span className="text-sm text-(--color-text-muted)">{t("ops.noActions")}</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {importedCsvData && (
        <div className="mt-4 rounded-lg border border-white/[0.07] bg-(--surface-container-low) p-4">
          <h2 className="mb-2 text-lg font-semibold text-(--on-surface)">{t("ops.importReport")}</h2>
          <p>{t("ops.imported")}: {importedCsvData.importedCount}</p>
          <p>{t("ops.rejected")}: {importedCsvData.rejectedCount}</p>
          <ul>
            {importedCsvData.errors.map((error) => (
              <li key={`${error.row}-${error.reason}`} className="text-sm text-(--color-text-muted)">
                {t("ops.line")} {error.row}: {error.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default OpsDashboard;