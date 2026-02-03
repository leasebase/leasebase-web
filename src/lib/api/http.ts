import axios from "axios";
import { getAppConfig } from "@/lib/config";

const config = getAppConfig();

export const api = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true
});

export function attachDevMockHeader(req: { headers?: Record<string, any> }) {
  const cfg = getAppConfig();
  if (!req.headers) req.headers = {};
  if (cfg.devMockAuth) {
    req.headers["x-lb-dev-mock"] = "true";
  }
  return req;
}

api.interceptors.request.use(req => {
  // In dev mock mode, send a header so the backend can bypass real auth.
  return attachDevMockHeader(req);
});

export type ApiError = {
  message: string;
  status?: number;
};

export function toApiError(err: any): ApiError {
  if (axios.isAxiosError(err)) {
    return {
      message: err.response?.data?.message || err.message || "Request failed",
      status: err.response?.status
    };
  }
  return { message: (err && err.message) || "Unknown error" };
}
