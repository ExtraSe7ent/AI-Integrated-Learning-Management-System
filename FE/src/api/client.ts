const TOKEN_KEY = "vju-token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* The session then lasts only until reload. */
  }
}
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; form?: FormData } = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body:
        options.form ??
        (options.body === undefined ? undefined : JSON.stringify(options.body)),
    });
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Vui lòng thử lại.");
  }
  const text = await response.text();
  if (!response.ok) {
    let message = "Máy chủ từ chối yêu cầu.";
    try {
      message = JSON.parse(text).message || message;
    } catch {
      /* Keep the generic message for non-JSON errors. */
    }
    throw new ApiError(response.status, message);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}
