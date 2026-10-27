import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const BIN = path.resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler",
);

/**
 * Exécute wrangler et renvoie { status, stdout, stderr }.
 * Les sorties sont capturées : l'appelant décide de ce qu'il affiche.
 */
export function wrangler(args, { input, timeout = 10 * 60 * 1000 } = {}) {
  const command = existsSync(BIN) ? BIN : "wrangler";
  const res = spawnSync(command, args, {
    input,
    encoding: "utf8",
    timeout,
    shell: process.platform === "win32" && command.endsWith(".cmd"),
  });
  return {
    status: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    error: res.error,
    text: `${res.stdout ?? ""}${res.stderr ?? ""}`,
  };
}

/** Vrai si wrangler est authentifié sur un compte Cloudflare. */
export function isLoggedIn() {
  const res = wrangler(["whoami"]);
  return res.status === 0 && !/not authenticated|not logged in|wrangler login/i.test(res.text);
}

/** Échappe une chaîne pour un littéral SQL. */
export const sqlString = (value) => `'${String(value ?? "").replace(/'/g, "''")}'`;

export const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[36m${s}\x1b[0m`,
};

export function step(message) {
  console.log(`\n${C.blue("▸")} ${C.bold(message)}`);
}

export function ok(message) {
  console.log(`  ${C.green("✓")} ${message}`);
}

export function warn(message) {
  console.log(`  ${C.yellow("!")} ${message}`);
}

export function fail(message) {
  console.error(`\n  ${C.red("✗")} ${message}\n`);
}
