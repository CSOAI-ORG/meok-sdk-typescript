/**
 * CSOAIClient — sync (Promise-based) client for the csoai.org public data API.
 *
 * Edge-runtime compatible (Vercel Edge, Cloudflare Workers, Deno):
 *   - Uses global `fetch` (override via options.fetch for testing)
 *   - No Node-only dependencies
 *   - Tree-shakeable + zero runtime dependencies
 */

import {
  CSOAIError,
  CSOAINetworkError,
  fromResponse,
} from "./errors.js";
import type {
  ComplianceMap,
  CouncilVotes,
  Crosswalk,
  CSOAIClientOptions,
  DOMEStatus,
  SigilVerification,
} from "./types.js";

const DEFAULT_BASE_URL = "https://csoai.org";
const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = "meok-sdk-typescript/0.1.0";

function buildHeaders(apiKey: string | undefined): HeadersInit {
  const h: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (apiKey) h["X-API-Key"] = apiKey;
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
  const t = setTimeout(
    () => controller.abort(new CSOAINetworkError(`Timeout after ${timeoutMs}ms`)),
    timeoutMs,
  );
  return { signal: controller.signal, cancel: () => clearTimeout(t) };
}

/**
 * Client for accessing public CSOAI data endpoints.
 *
 * @example
 *   import { CSOAIClient } from "@meok/sdk/csoai";
 *
 *   const client = new CSOAIClient({ apiKey: process.env.CSOAI_API_KEY });
 *   const map = await client.getComplianceMap();
 *   const crosswalk = await client.getCrosswalk();
 */
export class CSOAIClient {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(opts: CSOAIClientOptions = {}) {
    this.apiKey =
      opts.apiKey ??
      (typeof process !== "undefined" ? process.env?.CSOAI_API_KEY : undefined);
    this.baseUrl = (
      opts.baseUrl ??
      (typeof process !== "undefined" ? process.env?.CSOAI_BASE_URL : undefined) ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetcher = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  // ── Public surface ───────────────────────────────────────────────

  /**
   * Fetch the global compliance map.
   *
   * Endpoint: `GET /api/map.json`
   */
  async getComplianceMap(): Promise<ComplianceMap> {
    return (await this.request("GET", "/api/map.json")) as ComplianceMap;
  }

  /**
   * Fetch the framework crosswalk matrix.
   *
   * Endpoint: `GET /api/crosswalk.json`
   */
  async getCrosswalk(): Promise<Crosswalk> {
    return (await this.request("GET", "/api/crosswalk.json")) as Crosswalk;
  }

  /**
   * Fetch the current DOME (Distributed Observability & Monitoring Engine) status.
   *
   * Endpoint: `GET /api/dome/status.json`
   */
  async getDOMEStatus(): Promise<DOMEStatus> {
    return (await this.request("GET", "/api/dome/status.json")) as DOMEStatus;
  }

  /**
   * Fetch council votes.
   *
   * Endpoint: `GET /api/council/votes.json`
   */
  async getCouncilVotes(): Promise<CouncilVotes> {
    return (await this.request("GET", "/api/council/votes.json")) as CouncilVotes;
  }

  /**
   * Verify a sigil (compliance seal) by its identifier.
   *
   * Endpoint: `GET /api/sigil/verify.json?id={sigilId}`
   *
   * @param sigilId — the sigil identifier to verify, e.g. `"WD-2026-001"`
   */
  async verifySigil(sigilId: string): Promise<SigilVerification> {
    const query = new URLSearchParams({ id: sigilId });
    return (await this.request(
      "GET",
      `/api/sigil/verify.json?${query.toString()}`,
    )) as SigilVerification;
  }

  // ── Internal request ─────────────────────────────────────────────

  private async request(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const { signal, cancel } = withTimeout(this.timeoutMs);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        method,
        headers: buildHeaders(this.apiKey),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
      return await checkResponse(response);
    } catch (e) {
      if (e instanceof CSOAIError) throw e;
      throw new CSOAINetworkError(String(e), e);
    } finally {
      cancel();
    }
  }
}
