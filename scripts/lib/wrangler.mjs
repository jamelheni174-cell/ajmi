import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const BIN = path.resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler",
);

export const WRANGLER_BIN = existsSync(BIN) ? BIN : "wrangler";

const shellOpt = () => process.platform === "win32" && WRANGLER_BIN.endsWith(".cmd");

/**
 * Exécute wrangler et renvoie { status, stdout, stderr }.
 * Les sorties sont capturées : l'appelant décide de ce qu'il affiche.
 */
export function wrangler(args, { input, timeout = 10 * 60 * 1000 } = {}) {
  const res = spawnSync(WRANGLER_BIN, args, {
    input,
    encoding: "utf8",
    timeout,
    shell: shellOpt(),
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

/**
 * Exécute wrangler en laissant la main à l'utilisateur (questions de
 * Cloudflare au premier déploiement) tout en capturant la sortie.
 * Renvoie { status, text }.
 */
export function wranglerInteractive(args, { timeout = 30 * 60 * 1000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(WRANGLER_BIN, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: shellOpt(),
    });

    let text = "";
    const relay = (stream, target) =>
      stream.on("data", (chunk) => {
        const value = chunk.toString();
        text += value;
        target.write(value);
      });

    relay(child.stdout, process.stdout);
    relay(child.stderr, process.stderr);

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      text += "\n(délai dépassé)";
    }, timeout);

    const finish = (status) => {
      clearTimeout(timer);
      resolve({ status: status ?? 1, text });
    };

    child.on("error", (error) => {
      text += `\n${error.message}`;
      finish(1);
    });
    child.on("close", (code) => finish(code));
  });
}
