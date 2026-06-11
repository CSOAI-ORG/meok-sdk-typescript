/**
 * @meok/sdk — Basic Usage Example (TypeScript)
 * Demonstrates signing and verifying a compliance attestation.
 */

import { MeokClient, CSOAIClient } from "@meok/sdk";

const API_KEY = process.env.MEOK_API_KEY ?? "sk_meok_demo_xxxxxxxx";

async function main() {
  // ── 1. Sign a compliance attestation ─────────────────────────────
  const client = new MeokClient({ apiKey: API_KEY });

  const cert = await client.sign({
    regulation: "EU_AI_ACT_ANNEX_III",
    entity: "ACME Haulage Ltd",
    score: 82,
    findings: [
      "Tachograph data exported successfully",
      "OCRS forecast: GREEN",
      "Driver CPC records up to date",
    ],
  });

  console.log("✅ Attestation signed");
  console.log(`   Cert ID : ${cert.cert_id}`);
  console.log(`   Score   : ${cert.score}`);
  console.log(`   Tier    : ${cert.tier}`);
  console.log(`   Verify  : ${cert.verify_url}`);

  // ── 2. Public verification (no API key needed) ─────────────────
  const result = await MeokClient.verifyPublic(cert);
  console.log(`\n🔍 Verification result: ${result.valid} — ${result.message}`);

  // ── 3. CSOAI unified compliance client ───────────────────────────
  const csoai = new CSOAIClient({ apiKey: API_KEY });

  // Check health
  const health = await csoai.health();
  console.log(`\n🏥 CSOAI API health: ${health.status}`);

  // Map a regulation across frameworks
  const mapping = await csoai.mapFramework({
    regulation: "EU_AI_ACT_ART_50",
    frameworks: ["ISO_42001", "NIST_AI_RMF", "TC260"],
  });
  console.log(`\n📋 Framework mapping: ${mapping.regulation}`);
  for (const row of mapping.crosswalk) {
    console.log(`   • ${row.framework}: ${row.mappedClause} (gap: ${row.gapScore})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
