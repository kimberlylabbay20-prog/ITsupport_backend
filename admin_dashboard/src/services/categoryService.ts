import api from "./api";

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await api.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(
  categoryId: number,
  payload: CategoryPayload
): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}
