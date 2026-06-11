/**
 * @meok/sdk — Official TypeScript SDK for the MEOK Attestation API.
 *
 * @example
 *   import { MeokClient } from "@meok/sdk";
 *
 *   const client = new MeokClient({ apiKey: process.env.MEOK_API_KEY });
 *   const cert = await client.sign({
 *     regulation: "EU_AI_ACT_ANNEX_III",
 *     entity: "ACME Haulage Ltd",
 *     score: 82,
 *     findings: ["Tachograph data exported", "OCRS forecast GREEN"],
 *   });
 *
 *   // …and anyone can verify, no API key needed:
 *   const result = await MeokClient.verifyPublic(cert);
 *   console.log(result.valid, result.message);
 */

export { MeokClient } from "./client.js";
export {
  MeokError,
  MeokAPIError,
  MeokAuthError,
  MeokNetworkError,
  MeokValidationError,
  MeokPaymentError,
} from "./errors.js";
export type {
  Assessment,
  Cert,
  ClientOptions,
  HealthResult,
  ProvisionParams,
  ProvisionResult,
  SignParams,
  Tier,
  VerifyResult,
} from "./types.js";

// ── CSOAI sub-module re-exports ────────────────────────────────────
export { CSOAIClient } from "./csoai/client.js";
export {
  CSOAIError,
  CSOAINetworkError,
  CSOAIAPIError,
  CSOAIAuthError,
  CSOAIValidationError,
} from "./csoai/errors.js";
export type {
  Region,
  ComplianceMap,
  Framework,
  CrosswalkRow,
  Crosswalk,
  DOMEStatus,
  CouncilVote,
  CouncilVotes,
  SigilVerification,
  CSOAIClientOptions,
} from "./csoai/types.js";

export const VERSION = "0.1.0";
