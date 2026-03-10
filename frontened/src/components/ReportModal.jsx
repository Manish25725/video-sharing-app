import { useState, useEffect, useRef } from "react";
import { X, Flag, AlertTriangle, ChevronDown } from "lucide-react";
import reportService from "../services/reportService.js";

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Hate speech",
  "Violence",
  "Copyright violation",
  "Other",
];

/**
 * ReportModal — reusable modal for reporting videos or comments.
 *
 * Props:
 *   isOpen      {boolean}        — whether the modal is visible
 *   onClose     {() => void}     — called when the user cancels or closes
 *   onSuccess   {() => void}     — called after a successful submission
 *   targetType  {"video"|"comment"}
 *   targetId    {string}         — videoId or commentId
 */
const ReportModal = ({ isOpen, onClose, onSuccess, targetType = "video", targetId }) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);

  // Reset form whenever the modal opens for a new target
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setDescription("");
      setError("");
      setLoading(false);
    }
  }, [isOpen, targetId]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !loading) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { setError("Please select a reason."); return; }
    if (!targetId) { setError("Missing target ID. Please try again."); return; }

    setLoading(true);
    setError("");
    try {
      if (targetType === "video") {
        await reportService.reportVideo(targetId, reason, description);
      } else {
        await reportService.reportComment(targetId, reason, description);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("already reported") || err?.statusCode === 409) {
        setError("You have already reported this content.");
      } else {
        setError(msg || "Failed to submit report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const label = targetType === "video" ? "video" : "comment";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="report-modal-title"
    >
      {/* Modal panel */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Flag className="w-4 h-4 text-red-600" />
            </div>
            <h2 id="report-modal-title" className="text-base font-semibold text-gray-900 capitalize">
              Report {label}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Reason dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(""); }}
                required
                className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all pr-9"
              >
                <option value="">Select a reason…</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional details
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Tell us more about why you're reporting this ${label}…`}
              rows={3}
              maxLength={500}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{description.length}/500</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" /> Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
