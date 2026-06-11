/**
 * CSOAI (csoai.org) public data API — programmatic access to compliance maps,
 * crosswalks, DOME status, council votes, and sigil verification.
 *
 * @example
 *   import { CSOAIClient } from "@meok/sdk/csoai";
 *
 *   const client = new CSOAIClient({ apiKey: "optional" });
 *
 *   const map      = await client.getComplianceMap();
 *   const crosswalk = await client.getCrosswalk();
 *   const dome     = await client.getDOMEStatus();
 *   const council  = await client.getCouncilVotes();
 *   const cert     = await client.verifySigil("WD-2026-001");
 */

export { CSOAIClient } from "./client.js";
export {
  CSOAIError,
  CSOAINetworkError,
  CSOAIAPIError,
  CSOAIAuthError,
  CSOAIValidationError,
} from "./errors.js";
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
} from "./types.js";
