import { candidateFetch } from "@/shared/api/candidate-session";
async function request(path, options = {}) {
  const response = await candidateFetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.detail || Object.values(data?.errors || {}).flat().join(" ") || "Không thể tải hoặc lưu hồ sơ. Vui lòng thử lại.");
    error.status = response.status;
    throw error;
  }
  return data;
}
async function mutate(method, body) {
  const multipart = body instanceof FormData;
  return request(`profile${multipart ? "/cvs" : ""}`, {
    method, headers: { ...(!multipart && { "Content-Type": "application/json" }) },
    body: multipart ? body : JSON.stringify({ ...body, birthDate: body.birthDate || null }),
  });
}
export const profileApi = { get: () => request("profile"), save: data => mutate("PUT", data), upload: file => { const body = new FormData(); body.append("file", file); return mutate("POST", body); } };

export async function downloadCv(cv) {
  const response = await candidateFetch(`profile/cvs/${cv.id}`);
  if (!response.ok) throw new Error("Không thể tải CV. Vui lòng thử lại.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = cv.title;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
