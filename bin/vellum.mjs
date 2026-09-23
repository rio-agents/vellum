#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
import { main } from "../src/build/command.ts";

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
