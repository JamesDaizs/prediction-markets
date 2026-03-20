import { promises as fs } from "fs";
import path from "path";
import type { ApiResponse, ApiError } from "./types";

const BASE_URL =
  process.env.HERMOD_URL || "https://api.stg.ask.surf/gateway";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (process.env.HERMOD_TOKEN) return process.env.HERMOD_TOKEN;

  // Refresh if expired or within 5 min of expiry
  const now = Date.now() / 1000;
  if (cachedToken && tokenExpiry > now + 300) return cachedToken;

  try {
    const sessionPath = path.join(
      process.env.HOME || "~",
      ".surf-core",
      "session.json"
    );
    const raw = await fs.readFile(sessionPath, "utf-8");
    const session = JSON.parse(raw);
    const token = session.hermod_token || session.access_token;

    // Try to refresh if we have a refresh token
    if (session.refresh_token) {
      try {
        const refreshRes = await fetch(
          "https://api.stg.ask.surf/muninn/v2/auth/refresh",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: session.refresh_token }),
          }
        );
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          // Response may be nested: { data: { access_token: "..." } }
          const tokenSource = refreshData.data || refreshData;
          const newToken =
            tokenSource.hermod_token ||
            tokenSource.access_token ||
            tokenSource.token;
          if (newToken) {
            cachedToken = newToken;
            // Update session file
            const updatedSession = {
              ...session,
              hermod_token: newToken,
              access_token: newToken,
            };
            const newRefresh =
              tokenSource.refresh_token || refreshData.refresh_token;
            if (newRefresh) {
              updatedSession.refresh_token = newRefresh;
            }
            await fs.writeFile(
              sessionPath,
              JSON.stringify(updatedSession, null, 2)
            );
            // Parse JWT exp
            try {
              const payload = JSON.parse(
                Buffer.from(newToken.split(".")[1], "base64").toString()
              );
              tokenExpiry = payload.exp || now + 3600;
            } catch {
              tokenExpiry = now + 3600;
            }
            return cachedToken!;
          }
        }
      } catch {
        // Refresh failed, use existing token
      }
    }

    cachedToken = token;
    // Parse JWT exp from existing token
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      tokenExpiry = payload.exp || now + 3600;
    } catch {
      tokenExpiry = now + 3600;
    }
    return cachedToken!;
  } catch {
    throw new Error(
      "No Hermod token found. Set HERMOD_TOKEN env var or run `surf-session login`."
    );
  }
}

interface FetchOptions {
  params?: Record<string, string | number | undefined>;
  revalidate?: number;
}

export async function hermodFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: options.revalidate ?? 300 }, // 5 min cache default
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(
      body?.error?.message || `Hermod API error: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<ApiResponse<T>>;
}

// Helper to extract data array with fallback to empty
export function getData<T>(response: ApiResponse<T>): T[] {
  return response.data ?? [];
}
