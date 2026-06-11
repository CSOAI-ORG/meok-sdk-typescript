/**
 * Type definitions for the CSOAI (csoai.org) public data API.
 *
 * All interfaces are forward-compatible: servers may ship extra fields;
 * use safe access patterns when reading.
 */

/** A geographic or regulatory region within the compliance map. */
export interface Region {
  /** ISO-3166 country code or custom jurisdiction identifier. */
  code: string;
  /** Human-readable region name. */
  name: string;
  /** Current compliance maturity level for this region. */
  status?: "active" | "pending" | "draft" | "deprecated";
  /** List of active frameworks in this region. */
  frameworks?: string[];
  /** ISO date string of last map update for this region. */
  updated_at?: string;
  [extra: string]: unknown;
}

/** The full compliance map returned by csoai.org/api/map.json. */
export interface ComplianceMap {
  /** Map version or schema revision. */
  version?: string;
  /** ISO date string of when the map was generated. */
  generated_at?: string;
  /** All known regions/jurisdictions. */
  regions: Region[];
  [extra: string]: unknown;
}

/** A single regulatory framework (e.g. EU AI Act, UK AI Bill). */
export interface Framework {
  /** Unique framework identifier. */
  id: string;
  /** Human-readable framework name. */
  name: string;
  /** Jurisdiction or region code this framework belongs to. */
  region_code?: string;
  /** Current lifecycle status. */
  status?: "enforced" | "proposed" | "draft" | "repealed";
  /** URL to official legislation or guidance. */
  url?: string;
  /** ISO date string of last known amendment. */
  updated_at?: string;
  [extra: string]: unknown;
}

/** One row in the crosswalk matrix mapping frameworks to each other. */
export interface CrosswalkRow {
  /** Source framework identifier. */
  source_framework_id: string;
  /** Target framework identifier. */
  target_framework_id: string;
  /** Human-readable description of the mapping. */
  mapping?: string;
  /** Confidence or maturity of the mapping. */
  confidence?: "high" | "medium" | "low";
  /** Specific articles or sections mapped. */
  mapped_articles?: string[];
  [extra: string]: unknown;
}

/** The full crosswalk returned by csoai.org/api/crosswalk.json. */
export interface Crosswalk {
  /** Crosswalk version or schema revision. */
  version?: string;
  /** All frameworks referenced in the crosswalk. */
  frameworks?: Framework[];
  /** Individual mapping rows. */
  rows: CrosswalkRow[];
  [extra: string]: unknown;
}

/** Real-time status of the DOME (Distributed Observability & Monitoring Engine). */
export interface DOMEStatus {
  /** Overall DOME health indicator. */
  status?: "healthy" | "degraded" | "down";
  /** Number of active monitoring nodes. */
  active_nodes?: number;
  /** Total number of configured nodes. */
  total_nodes?: number;
  /** Number of attestations processed in the current window. */
  attestations_processed?: number;
  /** ISO date string of the status snapshot. */
  timestamp?: string;
  /** Human-readable status message. */
  message?: string;
  [extra: string]: unknown;
}

/** A single council vote record. */
export interface CouncilVote {
  /** Unique vote identifier. */
  vote_id: string;
  /** Proposal or motion title. */
  proposal?: string;
  /** Voting outcome. */
  result?: "passed" | "rejected" | "abstained" | "pending";
  /** Number of votes in favour. */
  votes_for?: number;
  /** Number of votes against. */
  votes_against?: number;
  /** Number of abstentions. */
  votes_abstain?: number;
  /** ISO date string when the vote was recorded. */
  voted_at?: string;
  [extra: string]: unknown;
}

/** The full council votes payload returned by csoai.org/api/council/votes.json. */
export interface CouncilVotes {
  /** Council session or term identifier. */
  session?: string;
  /** All recorded votes. */
  votes: CouncilVote[];
  [extra: string]: unknown;
}

/** Result of verifying a sigil (compliance seal) by its identifier. */
export interface SigilVerification {
  /** Whether the sigil is currently valid. */
  valid: boolean;
  /** Sigil identifier that was checked. */
  sigil_id: string;
  /** Human-readable verification message. */
  message?: string;
  /** Entity the sigil was issued to. */
  entity?: string;
  /** Framework the sigil covers. */
  framework?: string;
  /** ISO date string of original issuance. */
  issued_at?: string;
  /** ISO date string of expiration, if applicable. */
  expires_at?: string;
  [extra: string]: unknown;
}

/** Options passed to the {@link CSOAIClient} constructor. */
export interface CSOAIClientOptions {
  /** Optional API key for higher rate limits or private endpoints. */
  apiKey?: string;
  /** Override the default base URL (default: https://csoai.org). */
  baseUrl?: string;
  /** Per-request timeout in milliseconds (default: 30_000). */
  timeoutMs?: number;
  /** Override `fetch` for testing or edge runtimes. */
  fetch?: typeof fetch;
}
