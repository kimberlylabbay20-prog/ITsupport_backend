import { useState } from "react";
import { X, Loader2, FolderCog } from "lucide-react";
import type { Category } from "../services/categoryService";
import { updateCategory } from "../services/categoryService";
import { getErrorMessage } from "../services/api";

interface EditCategoryModalProps {
  category: Category;
  onClose: () => void;
  notify: (type: "success" | "error", message: string) => void;
  onUpdated: (category: Category) => void;
}

const inputClass =
  "w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300";

export default function EditCategoryModal({
  category,
  onClose,
  notify,
  onUpdated,
}: EditCategoryModalProps) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const updated = await updateCategory(category.category_id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      notify("success", `Category "${updated.name}" updated.`);
      onUpdated(updated);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update category."));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <FolderCog size={18} className="text-primary-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-dark">
                Edit Category
              </h3>
              <p className="text-[13px] text-text-muted mt-0.5">
                Category #{category.category_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-dark hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <Field label="Category Name *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}