import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");

// Guard rails from docs/plugin-authoring.md: never build over a symlinked dist
// or a misplaced dist/data directory.
if (fs.existsSync(dist)) {
	const stat = fs.lstatSync(dist);
	if (stat.isSymbolicLink()) throw new Error("Refusing to build into a symlinked dist directory.");
	if (fs.existsSync(path.join(dist, "data"))) throw new Error("Refusing to build over misplaced dist/data; move it outside dist first.");
	fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

const common = { absWorkingDir: root, bundle: true, target: "es2022", legalComments: "none", minify: true };

await build({
	...common,
	entryPoints: ["src/main.ts"],
	outfile: "dist/main.js",
	format: "esm",
	platform: "browser",
});

await build({
	...common,
	entryPoints: ["src/backend.ts"],
	outfile: "dist/backend.cjs",
	format: "cjs",
	platform: "node",
	target: "node20",
	external: ["node:*"],
});

fs.copyFileSync(path.join(root, "src", "manifest.json"), path.join(dist, "manifest.json"));
fs.copyFileSync(path.join(root, "src", "styles.css"), path.join(dist, "styles.css"));

const manifest = JSON.parse(fs.readFileSync(path.join(dist, "manifest.json"), "utf8"));
for (const file of [manifest.main, manifest.backend, manifest.styles]) {
	if (file && !fs.existsSync(path.join(dist, file))) throw new Error(`Build output missing: ${file}`);
}
console.log(`Built ${manifest.id}@${manifest.version} -> dist/`);
