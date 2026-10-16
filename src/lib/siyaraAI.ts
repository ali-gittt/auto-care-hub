/**
 * SiyaraAI chat API client.
 *
 * In development the Vite dev-server proxies /siyara-api → http://127.0.0.1:8000
 * so CORS is never an issue. In production the VITE_SIYARA_API_URL env var is
 * used (defaults to http://127.0.0.1:8000 when not set).
 *
 * NOTE: this is a plain chat — no vehicle or repair data is ever sent.
 */

const BASE_URL: string =
  import.meta.env.DEV
    ? "/siyara-api"
    : ((import.meta.env["VITE_SIYARA_API_URL"] as string | undefined) ?? "http://127.0.0.1:8000");

export interface SiyaraRequest {
  message: string;
  session_id: string | null;
}

export interface SiyaraResponse {
  session_id: string;
  response: string;
  [key: string]: unknown;
}

export async function sendMessage(req: SiyaraRequest): Promise<SiyaraResponse> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SiyaraAI responded with ${res.status}${text ? ": " + text : ""}`);
  }

  return res.json() as Promise<SiyaraResponse>;
}
