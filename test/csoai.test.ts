/**
 * CSOAIClient unit tests — uses a stub fetch (no MSW required).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CSOAIClient,
  CSOAINetworkError,
  CSOAIValidationError,
} from "../src/csoai/index.js";

const BASE = "https://csoai.org";

function makeFetch(routes: Record<string, { status: number; body: unknown }>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const match = Object.entries(routes).find(([path]) => url.endsWith(path));
    if (!match) {
      return new Response(JSON.stringify({ error: "no stub" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const [, { status, body }] = match;
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

describe("CSOAIClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getComplianceMap returns ComplianceMap", async () => {
    const client = new CSOAIClient({
      fetch: makeFetch({
        "/api/map.json": {
          status: 200,
          body: { version: "1.0", regions: [{ code: "GB", name: "United Kingdom" }] },
        },
      }),
    });
    const result = await client.getComplianceMap();
    expect(result.version).toBe("1.0");
    expect(result.regions[0].code).toBe("GB");
  });

  it("getCrosswalk returns Crosswalk", async () => {
    const client = new CSOAIClient({
      fetch: makeFetch({
        "/api/crosswalk.json": {
          status: 200,
          body: {
            version: "1.0",
            frameworks: [{ id: "EU_AI_ACT", name: "EU AI Act" }],
            rows: [{ source_framework_id: "EU_AI_ACT", target_framework_id: "UK_AI_BILL" }],
          },
        },
      }),
    });
    const result = await client.getCrosswalk();
    expect(result.version).toBe("1.0");
    expect(result.rows[0].source_framework_id).toBe("EU_AI_ACT");
  });

  it("getDOMEStatus returns DOMEStatus", async () => {
    const client = new CSOAIClient({
      fetch: makeFetch({
        "/api/dome/status.json": {
          status: 200,
          body: { status: "healthy", active_nodes: 3, total_nodes: 5 },
        },
      }),
    });
    const result = await client.getDOMEStatus();
    expect(result.status).toBe("healthy");
    expect(result.active_nodes).toBe(3);
  });

  it("getCouncilVotes returns CouncilVotes", async () => {
    const client = new CSOAIClient({
      fetch: makeFetch({
        "/api/council/votes.json": {
          status: 200,
          body: {
            session: "2026-Q2",
            votes: [{ vote_id: "V-001", result: "passed" }],
          },
        },
      }),
    });
    const result = await client.getCouncilVotes();
    expect(result.session).toBe("2026-Q2");
    expect(result.votes[0].vote_id).toBe("V-001");
  });

  it("verifySigil returns SigilVerification", async () => {
    const client = new CSOAIClient({
      fetch: makeFetch({
        "/api/sigil/verify.json?id=WD-2026-001": {
          status: 200,
          body: { valid: true, sigil_id: "WD-2026-001", message: "ok" },
        },
      }),
    });
    const result = await client.verifySigil("WD-2026-001");
    expect(result.valid).toBe(true);
    expect(result.sigil_id).toBe("WD-2026-001");
  });

  it("400 raises CSOAIValidationError", async () => {
    const client = new CSOAIClient({
      fetch: makeFetch({
        "/api/map.json": { status: 400, body: { error: "bad request" } },
      }),
    });
    await expect(client.getComplianceMap()).rejects.toBeInstanceOf(CSOAIValidationError);
  });

  it("network error wraps in CSOAINetworkError", async () => {
    const client = new CSOAIClient({
      fetch: vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }) as unknown as typeof fetch,
    });
    await expect(client.getComplianceMap()).rejects.toBeInstanceOf(CSOAINetworkError);
  });

  it("uses custom baseUrl", async () => {
    const client = new CSOAIClient({
      baseUrl: "https://staging.csoai.org",
      fetch: makeFetch({
        "/api/map.json": { status: 200, body: { regions: [] } },
      }),
    });
    const result = await client.getComplianceMap();
    expect(result.regions).toEqual([]);
  });
});
