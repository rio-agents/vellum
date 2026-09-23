#!/usr/bin/env node
// The command runs Vellum's TypeScript sources directly. Node 22 can do that only
// with type stripping switched on, so without it this launcher re-runs itself
// with the flag, whichever way it was started.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (!process.features.typescript) {
  const flags = ["--experimental-strip-types", "--no-warnings=ExperimentalWarning"];
  const result = spawnSync(process.execPath, [...flags, fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

const { main } = await import("../src/build/command.ts");
main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
