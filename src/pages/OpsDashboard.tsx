import { useMemo, useState } from "react";
import { useSubmission } from "../hooks/useSubmission";
import type { SubmissionStatus } from "../services/serviceSubmission";
import toast from "react-hot-toast";
import { reviewSubmission } from "../services/serviceSubmissionFunction";
import { markPaid } from "../services/servicePaidFunction";

const STATUS_FILTERS: Array<{ value: "all" | SubmissionStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

const statusStyles: Record<SubmissionStatus, string> = {
  pending: "bg-(--secondary)/15 text-(--secondary)",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  paid: "bg-(--tertiary)/15 text-(--tertiary)",
};

const OpsDashboard = () => {
  const { submissions, loading, error, refetch } = useSubmission();
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);

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
        toast.success(`Submission ${submissionId} has been marked as paid.`);
      } else {
        const reason =
          action === "rejected"
            ? prompt("Please provide a reason for rejection:")?.trim()
            : undefined;

        if (action === "rejected" && !reason) {
          toast.error("A reason is required when rejecting a submission.");
          return;
        }

        await reviewSubmission(submissionId, action, reason);
        toast.success(`Submission ${submissionId} has been ${action}.`);
      }

      await refetch();
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error("Failed to update submission. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold text-(--on-surface)">Welcome to the Ops Dashboard</h1>
      <div className="flex flex-wrap justify-end gap-3">
        <label className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
          Status
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | SubmissionStatus)
            }
            className="rounded-xl border border-white/10 bg-(--color-input) px-3 py-2 text-(--on-surface)"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
          Campaign
          <select
            value={campaignFilter}
            onChange={(event) => setCampaignFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-(--color-input) px-3 py-2 text-(--on-surface)"
          >
            <option value="all">All campaigns</option>
            {campaigns.map((campaignId) => (
              <option key={campaignId} value={campaignId}>
                {campaignId}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="bg-(--surface-container-low)">
            <tr className="border-b border-white/[0.07]">
              <th className="p-4 font-medium text-(--color-text-muted)">Campaign</th>
              <th className="p-4 font-medium text-(--color-text-muted)">Creator</th>
              <th className="p-4 font-medium text-(--color-text-muted)">Submission URL</th>
              <th className="p-4 font-medium text-(--color-text-muted)">Submitted</th>
              <th className="p-4 font-medium text-(--color-text-muted)">Status</th>
              <th className="p-4 font-medium text-(--color-text-muted)">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--color-text-muted)">
                  Loading submissions...
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
                    Try again
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--color-text-muted)">
                  No submissions match the selected filters.
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
                      {submission.status}
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
                          {actionId === submission.id ? "Updating..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === submission.id}
                          className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => void handleActions(submission.id, "rejected")}
                        >
                          Reject
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
                        {actionId === submission.id ? "Updating..." : "Mark paid"}
                      </button>
                    )}
                    {(submission.status === "rejected" || submission.status === "paid") && (
                      <span className="text-sm text-(--color-text-muted)">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default OpsDashboard;