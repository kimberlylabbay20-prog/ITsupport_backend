import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { Category } from "../services/categoryService";
import { deleteCategory } from "../services/categoryService";
import { getErrorMessage } from "../services/api";

interface DeleteCategoryModalProps {
  category: Category;
  onClose: () => void;
  notify: (type: "success" | "error", message: string) => void;
  onDeleted: (categoryId: number) => void;
}

export default function DeleteCategoryModal({
  category,
  onClose,
  notify,
  onDeleted,
}: DeleteCategoryModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteCategory(category.category_id);
      notify("success", `Category "${category.name}" deleted.`);
      onDeleted(category.category_id);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to delete category."));
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/50"
        onClick={deleting ? undefined : onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <h3 className="text-[16px] font-bold text-text-dark">
            Delete "{category.name}"?
          </h3>
          <p className="text-[13px] text-text-muted mt-1.5">
            This action cannot be undone. Categories still in use by tickets
            cannot be deleted.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 px-6 py-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}