/** Emit the type-only plugin SDK from a LearnHarness checkout.
 * Usage: node scripts/export-sdk.mjs [appCheckout] [outputDir]
 * Defaults: $LH_APP_CHECKOUT or ../learnharness-v0.7.0; output ./.sdk */
import { spawnSync } from "node:child_process";
import path from "node:path";

const app = path.resolve(process.env.LH_APP_CHECKOUT ?? process.argv[2] ?? "../learnharness-v0.7.0");
const output = path.resolve(process.argv[3] ?? ".sdk");
const script = path.join(app, "scripts", "build-plugin-types.mjs");
const result = spawnSync(process.execPath, [script, output], { cwd: app, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
