import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTopUp, buildTopUpQuery } from "./topup";

// R1 — pay ↔ ramps: the pay flow surfaces a top-up (on-ramp) entry point when
// the on-chain balance can't cover the quoted amount. These tests pin the pure
// decision logic. fail-before/pass-after: before computeTopUp existed the pay
// page had no insufficient-balance handling at all.

test("sufficient balance → no top-up", () => {
  const d = computeTopUp("10", "25");
  assert.equal(d.insufficient, false);
  assert.equal(d.shortfall, 0);
});

test("exact balance → no top-up (boundary)", () => {
  const d = computeTopUp("10", "10");
  assert.equal(d.insufficient, false);
  assert.equal(d.shortfall, 0);
});

test("insufficient balance → top-up with correct shortfall", () => {
  const d = computeTopUp("10", "3.5");
  assert.equal(d.insufficient, true);
  assert.equal(d.shortfall, 6.5);
});

test("zero / missing quote → no top-up (nothing to pay yet)", () => {
  assert.equal(computeTopUp(0, "0").insufficient, false);
  assert.equal(computeTopUp(null, "0").insufficient, false);
  assert.equal(computeTopUp(undefined, undefined).insufficient, false);
});

test("missing balance treated as zero → top-up for full amount", () => {
  const d = computeTopUp("5", null);
  assert.equal(d.insufficient, true);
  assert.equal(d.shortfall, 5);
});

test("top-up query is provider-agnostic and carries shortfall + returnTo", () => {
  const qs = buildTopUpQuery(6.5, "/pay");
  const params = new URLSearchParams(qs);
  assert.equal(params.get("topup"), "6.50");
  assert.equal(params.get("returnTo"), "/pay");
  // must NOT name any provider — provider is resolved via the registry later
  assert.equal(qs.toLowerCase().includes("moneygram"), false);
  assert.equal(qs.toLowerCase().includes("provider"), false);
});
