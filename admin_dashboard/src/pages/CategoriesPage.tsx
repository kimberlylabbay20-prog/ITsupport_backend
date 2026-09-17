import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import Layout from "../layouts/Layout";
import type { Category } from "../services/categoryService";
import { getCategories } from "../services/categoryService";
import AddCategoryModal from "../components/AddCategoryModal";
import EditCategoryModal from "../components/EditCategoryModal";
import DeleteCategoryModal from "../components/DeleteCategoryModal";
import Toast, { type ToastState } from "../components/Toast";

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 3 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 bg-gray-100 rounded animate-pulse"
            style={{ width: i === 2 ? "55%" : "64px" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);

  const notify = useMemo(
    () => (type: "success" | "error", message: string) => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      setToast({ type, message });
      toastTimer.current = window.setTimeout(() => setToast(null), 3500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const loadCategories = (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    return getCategories()
      .then(setCategories)
      .catch(() => setError("Failed to load categories."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buttonClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50";

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">
          Category Management
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <span className="cursor-pointer hover:text-primary-500 transition-colors">
              Categories
            </span>
            <ChevronRight size={12} />
            <span className="text-text-dark font-medium">All Categories</span>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead>
              <TableHeader />
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="text-red-400 mb-2" size={28} />
            <p className="text-[13px] text-text-muted">{error}</p>
            <button
              onClick={() => loadCategories()}
              className="mt-3 px-4 py-2 rounded-lg text-[13px] font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Inbox className="text-gray-300" size={28} />
            </div>
            <p className="text-[14px] font-semibold text-text-dark">
              No categories yet
            </p>
            <p className="text-[13px] text-text-muted mt-1">
              Click "Add Category" to create your first one.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <TableHeader />
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr
                  key={category.category_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-primary-600">
                    #{category.category_id}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-semibold text-primary-700 bg-primary-50">
                      {category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-text-muted max-w-[420px]">
                    {category.description || (
                      <span className="text-gray-300 italic">No description</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(category)}
                        className={`${buttonClass} text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100`}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(category)}
                        className={`${buttonClass} text-red-600 bg-red-50 border border-red-200 hover:bg-red-100`}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddCategoryModal
          onClose={() => setShowAdd(false)}
          notify={notify}
          onCreated={(created) => {
            setCategories((prev) =>
              [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
            );
            setShowAdd(false);
          }}
        />
      )}

      {editing !== null && (
        <EditCategoryModal
          category={editing}
          onClose={() => setEditing(null)}
          notify={notify}
          onUpdated={(updated) => {
            setCategories((prev) =>
              prev
                .map((c) =>
                  c.category_id === updated.category_id ? updated : c
                )
                .sort((a, b) => a.name.localeCompare(b.name))
            );
            setEditing(null);
          }}
        />
      )}

      {deleting !== null && (
        <DeleteCategoryModal
          category={deleting}
          onClose={() => setDeleting(null)}
          notify={notify}
          onDeleted={(categoryId) => {
            setCategories((prev) =>
              prev.filter((c) => c.category_id !== categoryId)
            );
            setDeleting(null);
          }}
        />
      )}

      <Toast toast={toast} />
    </Layout>
  );
}

function TableHeader() {
  return (
    <tr className="border-b border-gray-100 bg-gray-50/60">
      {["Category ID", "Category Name", "Description", "Actions"].map((h) => (
        <th
          key={h}
          className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted"
        >
          {h}
        </th>
      ))}
    </tr>
  );
}