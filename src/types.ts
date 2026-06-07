/**
 * Types matching the MEOK Attestation API OpenAPI 3.1 spec.
 *
 * Source: https://meok-attestation-api.vercel.app/openapi.json
 */

export type Assessment =
  | "COMPLIANT"
  | "PARTIAL"
  | "NON_COMPLIANT"
  | "COMPLIANT (UNVERIFIED — free tier)"
  | "PARTIAL (UNVERIFIED — free tier)"
  | "NON_COMPLIANT (UNVERIFIED — free tier)";

export type Tier = "free" | "starter" | "pro" | "enterprise";

/**
 * A signed attestation — the verifier endpoint accepts these.
 *
 * Forward-compatible: server may ship extra fields on the envelope;
 * use safe access patterns when reading.
 */
export interface Cert {
  cert_id?: string;
  issued_at?: string;
  expires_at?: string;
  regulation?: string;
  entity?: string;
  score?: number;
  assessment?: Assessment;
  findings?: string[];
  articles_audited?: string[];
  auditor_notes?: string;
  tier?: Tier;
  issuer?: string;
  kid?: string;
  verify_url?: string;
  signature_sha256_hmac?: string;
  [extra: string]: unknown;
}

export interface SignParams {
  regulation: string;
  entity: string;
  score: number;
  findings?: string[];
  articles_audited?: string[];
  auditor_notes?: string;
  email?: string;
}

export interface VerifyResult {
  valid: boolean;
  message: string;
  cert_id?: string;
  verify_url?: string;
}

export interface ProvisionParams {
  session_id?: string;
  master_key?: string;
  email?: string;
}

export interface ProvisionResult {
  api_key?: string;
  tier?: Tier;
  email?: string;
}

export interface HealthResult {
  ok?: boolean;
  status?: "ok";
  service?: string;
  kid?: string;
  version?: string;
}

export interface ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  /** Per-request timeout in ms. Default 30_000. */
  timeoutMs?: number;
  /** Override fetch (testing / edge runtime). */
  fetch?: typeof fetch;
}
