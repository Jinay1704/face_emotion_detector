import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Plain axios instance — token is attached per-request via the hook below
export const api = axios.create({
  baseURL:  BASE_URL,
  timeout:  30000,
});

/**
 * useApi — returns an axios instance that automatically attaches
 * the Clerk session token to every request.
 *
 * Usage inside any React component or hook:
 *   const api = useApi();
 *   const res = await api.get("/user/me");
 */
export function useApi() {
  const { getToken } = useAuth();

  const instance = axios.create({ baseURL: BASE_URL, timeout: 30000 });

  instance.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = "Bearer " + token;
    return config;
  });

  return instance;
}

export default api;