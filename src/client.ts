/**
 * MeokClient — sync (Promise-based) client for the MEOK Attestation API.
 *
 * Edge-runtime compatible (Vercel Edge, Cloudflare Workers, Deno):
 *   - Uses global `fetch` (override via options.fetch for testing)
 *   - No Node-only deps
 *   - Tree-shakeable + zero runtime dependencies
 */

import {
  MeokAuthError,
  MeokError,
  MeokNetworkError,
  fromResponse,
} from "./errors.js";
import type {
  Cert,
  ClientOptions,
  HealthResult,
  ProvisionParams,
  ProvisionResult,
  SignParams,
  VerifyResult,
} from "./types.js";

const DEFAULT_BASE_URL = "https://meok-attestation-api.vercel.app";
const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = "meok-sdk-typescript/0.1.0";

function buildHeaders(apiKey: string | undefined, extra?: Record<string, string>): HeadersInit {
  const h: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (apiKey) h["X-API-Key"] = apiKey;
  if (extra) Object.assign(h, extra);
  return h;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { error: await response.text() };
  }
}

async function checkResponse(response: Response): Promise<unknown> {
  const body = await readBody(response);
  if (!response.ok) {
    throw fromResponse(response.status, body);
  }
  return body;
}

function withTimeout(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(new MeokNetworkError(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(t) };
}

export class MeokClient {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(opts: ClientOptions = {}) {
    this.apiKey =
      opts.apiKey ??
      (typeof process !== "undefined" ? process.env?.MEOK_API_KEY : undefined);
    this.baseUrl = (
      opts.baseUrl ??
      (typeof process !== "undefined" ? process.env?.MEOK_API_BASE : undefined) ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetcher = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  // ── Public surface ───────────────────────────────────────────────

  async health(): Promise<HealthResult> {
    return (await this.request("GET", "/health")) as HealthResult;
  }

  async sign(params: SignParams): Promise<Cert> {
    if (!this.apiKey) {
      throw new MeokAuthError(401, "MeokClient.sign requires an apiKey.");
    }
    const body: Record<string, unknown> = {
      api_key: this.apiKey,
      regulation: params.regulation,
      entity: params.entity,
      score: params.score,
    };
    if (params.findings?.length) body.findings = params.findings;
    if (params.articles_audited?.length) body.articles_audited = params.articles_audited;
    if (params.auditor_notes) body.auditor_notes = params.auditor_notes;
    if (params.email) body.email = params.email;

    return (await this.request("POST", "/sign", body)) as Cert;
  }

  async verify(cert: Cert): Promise<VerifyResult> {
    const result = (await this.request("POST", "/verify", cert, /*useAuth*/ false)) as VerifyResult;
    return result;
  }

  async provision(params: ProvisionParams): Promise<ProvisionResult> {
    const headers: Record<string, string> = {};
    if (params.master_key) headers["X-Master-Key"] = params.master_key;
    const body: Record<string, unknown> = {};
    if (params.session_id) body.session_id = params.session_id;
    if (params.email) body.email = params.email;
    return (await this.request("POST", "/provision", body, false, headers)) as ProvisionResult;
  }

  /**
   * One-shot public verification — no client needed, no auth required.
   */
  static async verifyPublic(
    cert: Cert,
    opts: { baseUrl?: string; timeoutMs?: number; fetch?: typeof fetch } = {},
  ): Promise<VerifyResult> {
    const base = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const fetcher = opts.fetch ?? globalThis.fetch.bind(globalThis);
    const { signal, cancel } = withTimeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetcher(`${base}/verify`, {
        method: "POST",
        headers: buildHeaders(undefined),
        body: JSON.stringify(cert),
        signal,
      });
      return (await checkResponse(response)) as VerifyResult;
    } catch (e) {
      if (e instanceof MeokError) throw e;
      throw new MeokNetworkError(String(e), e);
    } finally {
      cancel();
    }
  }

  // ── Internal request ─────────────────────────────────────────────

  private async request(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    useAuth = true,
    extraHeaders?: Record<string, string>,
  ): Promise<unknown> {
    const { signal, cancel } = withTimeout(this.timeoutMs);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        method,
        headers: buildHeaders(useAuth ? this.apiKey : undefined, extraHeaders),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
      return await checkResponse(response);
    } catch (e) {
      if (e instanceof MeokError) throw e;
      throw new MeokNetworkError(String(e), e);
    } finally {
      cancel();
    }
  }
}
