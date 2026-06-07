/**
 * MeokClient unit tests — uses a stub fetch (no MSW required).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MeokAuthError,
  MeokClient,
  MeokNetworkError,
  MeokValidationError,
} from "../src/index.js";

const BASE = "https://meok-attestation-api.vercel.app";

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

describe("MeokClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("health returns ok", async () => {
    const client = new MeokClient({
      fetch: makeFetch({
        "/health": { status: 200, body: { ok: true, status: "ok", service: "meok" } },
      }),
    });
    const result = await client.health();
    expect(result.ok).toBe(true);
  });

  it("sign without api key throws MeokAuthError", async () => {
    const client = new MeokClient({ fetch: makeFetch({}) });
    await expect(
      client.sign({ regulation: "GDPR", entity: "ACME", score: 80 }),
    ).rejects.toBeInstanceOf(MeokAuthError);
  });

  it("sign returns cert on 200", async () => {
    const fakeCert = {
      cert_id: "abc123",
      regulation: "GDPR",
      entity: "ACME",
      score: 80,
      assessment: "COMPLIANT" as const,
      signature_sha256_hmac: "deadbeef",
      verify_url: `${BASE}/v/abc123`,
    };
    const client = new MeokClient({
      apiKey: "sk_test",
      fetch: makeFetch({ "/sign": { status: 200, body: fakeCert } }),
    });
    const result = await client.sign({
      regulation: "GDPR",
      entity: "ACME",
      score: 80,
      findings: ["X"],
    });
    expect(result.cert_id).toBe("abc123");
    expect(result.assessment).toBe("COMPLIANT");
  });

  it("400 raises MeokValidationError", async () => {
    const client = new MeokClient({
      apiKey: "sk_test",
      fetch: makeFetch({
        "/sign": { status: 400, body: { error: "regulation required" } },
      }),
    });
    await expect(
      client.sign({ regulation: "", entity: "ACME", score: 80 }),
    ).rejects.toBeInstanceOf(MeokValidationError);
  });

  it("verify returns VerifyResult", async () => {
    const client = new MeokClient({
      fetch: makeFetch({
        "/verify": {
          status: 200,
          body: { valid: true, message: "ok", cert_id: "abc" },
        },
      }),
    });
    const result = await client.verify({ cert_id: "abc" });
    expect(result.valid).toBe(true);
    expect(result.cert_id).toBe("abc");
  });

  it("MeokClient.verifyPublic works without instance", async () => {
    const result = await MeokClient.verifyPublic(
      { cert_id: "abc" },
      {
        fetch: makeFetch({
          "/verify": { status: 200, body: { valid: false, message: "expired" } },
        }),
      },
    );
    expect(result.valid).toBe(false);
    expect(result.message).toBe("expired");
  });

  it("network error wraps in MeokNetworkError", async () => {
    const client = new MeokClient({
      fetch: vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }) as unknown as typeof fetch,
    });
    await expect(client.health()).rejects.toBeInstanceOf(MeokNetworkError);
  });
});
