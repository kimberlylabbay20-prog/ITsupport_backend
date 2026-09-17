import { AlertCircle, CheckCircle2 } from "lucide-react";

export type ToastState = { type: "success" | "error"; message: string } | null;

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-[70] flex items-center gap-2 pl-3.5 pr-5 py-3 rounded-xl shadow-lg text-[13px] font-medium text-white ${
        toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 size={16} className="flex-shrink-0" />
      ) : (
        <AlertCircle size={16} className="flex-shrink-0" />
      )}
      {toast.message}
    </div>
  );
}