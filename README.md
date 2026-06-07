# @meok/sdk

**Official TypeScript SDK for the MEOK Attestation API** — sign + verify HMAC-signed compliance attestations across the MEOK trade-compliance ecosystem.

> Part of the [MEOK AI Labs](https://meok.ai) ecosystem powering [haulage.app](https://haulage.app), the umbrella for 32 PyPI-published Model Context Protocol servers covering UK + EU + US + AU + Canada + air + sea + rail trade compliance.

[![npm](https://img.shields.io/npm/v/@meok/sdk.svg)](https://www.npmjs.com/package/@meok/sdk)
[![Node](https://img.shields.io/node/v/@meok/sdk.svg)](https://www.npmjs.com/package/@meok/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

## Install

```bash
npm install @meok/sdk
# or pnpm add @meok/sdk
# or yarn add @meok/sdk
```

Node ≥ 18.17 (uses global `fetch`). Works on Vercel Edge, Cloudflare Workers, Deno, Bun, and modern browsers.

## Quick start — verify a cert (no API key needed)

```ts
import { MeokClient } from "@meok/sdk";

const cert = {
  cert_id: "...",
  signature_sha256_hmac: "...",
  payload: { /* … */ },
};

const result = await MeokClient.verifyPublic(cert);
console.log(result.valid, result.message);
```

The verifier endpoint is **public and rate-limited** — no auth needed. Any auditor, regulator, or customer can verify your compliance chain.

## Sign a cert (requires an API key)

```ts
import { MeokClient } from "@meok/sdk";

const client = new MeokClient({ apiKey: process.env.MEOK_API_KEY });

const cert = await client.sign({
  regulation: "EU_AI_ACT_ANNEX_III",
  entity: "ACME Haulage Ltd",
  score: 82,
  findings: [
    "Tachograph data exported",
    "Driver hours within limits",
    "OCRS forecast GREEN",
  ],
  articles_audited: ["Art_9", "Art_10", "Art_15"],
});

console.log(cert.verify_url); // share with auditor
```

## Edge runtimes (Vercel Edge, Cloudflare Workers, Deno)

Just use the same code — the SDK uses the global `fetch`:

```ts
// app/api/sign/route.ts (Vercel Edge)
import { MeokClient } from "@meok/sdk";

export const runtime = "edge";

export async function POST(request: Request) {
  const client = new MeokClient({ apiKey: process.env.MEOK_API_KEY });
  const body = await request.json();
  const cert = await client.sign(body);
  return Response.json(cert);
}
```

## Error handling

All errors inherit from `MeokError`:

```ts
import {
  MeokAuthError,        // 401
  MeokValidationError,  // 400
  MeokPaymentError,     // 402
  MeokAPIError,         // any non-2xx
  MeokNetworkError,     // connect / DNS / TLS / timeout
  MeokError,            // catch-all base
} from "@meok/sdk";

try {
  await client.sign({ regulation: "", entity: "X", score: 50 });
} catch (e) {
  if (e instanceof MeokValidationError) {
    // show validation message to user
  } else if (e instanceof MeokAuthError) {
    // re-auth
  } else {
    throw e;
  }
}
```

## Environment variables

| Variable           | What                                                      | Default                                    |
|--------------------|-----------------------------------------------------------|--------------------------------------------|
| `MEOK_API_KEY`     | Default API key used when none is passed to the client.   | `undefined`                                |
| `MEOK_API_BASE`    | Override base URL (testing, edge deployments).            | `https://meok-attestation-api.vercel.app`  |

## API surface

| Method                              | Auth | What                                                          |
|-------------------------------------|------|---------------------------------------------------------------|
| `client.health()`                   | no   | Liveness probe.                                                |
| `client.sign(params)`               | yes  | Issue a signed cert.                                          |
| `client.verify(cert)`               | no   | Verify a cert (instance method).                              |
| `MeokClient.verifyPublic(cert)`     | no   | Static — verify without instantiating a client.               |
| `client.provision(params)`          | no   | Exchange Stripe session for an API key.                       |

## Related

- [MEOK Attestation API — OpenAPI 3.1 spec](https://meok-attestation-api.vercel.app/openapi.json)
- [Interactive docs (Swagger UI)](https://meok-attestation-api.vercel.app/docs)
- [Python SDK](https://pypi.org/project/meok-sdk/)
- [Haulage.app — 32-MCP trade compliance catalogue](https://haulage.app)
- [Source](https://github.com/CSOAI-ORG/meok-sdk-typescript)

## License

MIT — © 2026 MEOK AI Labs / CSOAI LTD.
