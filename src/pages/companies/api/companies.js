import { candidateFetch } from "@/shared/api/candidate-session";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function decode(response) {
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.detail || "Không thể tải dữ liệu doanh nghiệp. Vui lòng thử lại.");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function get(path, signal) {
  const response = await fetch(`${base}/api/${path}`, { signal, credentials: "omit" });
  return decode(response);
}

export const companiesApi = {
  list: (params, signal) => get(`companies?${params}`, signal),
  metadata: signal => get("companies/filters", signal),
  featured: signal => get("companies/featured", signal),
  jobs: (id, page, signal) => get(`jobs?companyId=${encodeURIComponent(id)}&page=${page}&pageSize=10`, signal),
  followed: async () => decode(await candidateFetch("followed-companies")),
  follow: async (id, followed) => decode(await candidateFetch(`followed-companies/${encodeURIComponent(id)}`, { method: followed ? "PUT" : "DELETE" })),
};
