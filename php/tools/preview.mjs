#!/usr/bin/env node
/* ------------------------------------------------------------------
   Aperçu local de la version PHP — sans installer PHP.

   Le site et l'API sont exécutés par un vrai PHP 8.3 (WebAssembly),
   dans un disque virtuel en mémoire : rien n'est écrit dans le dépôt.
   Pratique pour vérifier le rendu et les parcours avant d'envoyer les
   fichiers sur l'hébergement.

     npm i --no-save @php-wasm/node @php-wasm/universal
     node php/tools/preview.mjs
     → http://localhost:8080

   Variables d'environnement :
     PORT=8000           port d'écoute (8080 par défaut)
     HOST=127.0.0.1      adresse d'écoute (0.0.0.0 par défaut)
     AJMI_ADMIN_EMAIL    compte créé automatiquement (admin@ajmi.tn)
     AJMI_ADMIN_PASS     mot de passe associé (Ajmi2026!)

   Ce fichier n'est pas nécessaire sur l'hébergement : il ne sert qu'au
   développement. Sur un serveur disposant de PHP, préférez :
     php -S localhost:8080 -t php/
------------------------------------------------------------------- */

import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..");
const ROOT = "/site";
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const EMAIL = process.env.AJMI_ADMIN_EMAIL || "admin@ajmi.tn";
const PASS = process.env.AJMI_ADMIN_PASS || "Ajmi2026!";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

/* ---------- état ---------- */
let php = null;
let resoudrePret, rejeterPret;
const pret = new Promise((ok, ko) => {
  resoudrePret = ok;
  rejeterPret = ko;
});
pret.catch(() => {});

/** Une seule instance PHP : les requêtes sont sérialisées. */
let file = Promise.resolve();
const serialiser = (tache) => {
  const suite = file.then(tache, tache);
  file = suite.catch(() => {});
  return suite;
};

function executerPhp({ url, method, corps, jeton, ip }) {
  return serialiser(() =>
    php.run({
      code: `<?php
        define('AJMI_INPUT', ${JSON.stringify(corps ?? "")});
        $_SERVER['REQUEST_METHOD'] = ${JSON.stringify(method)};
        $_SERVER['REQUEST_URI'] = ${JSON.stringify(url)};
        $_SERVER['SCRIPT_NAME'] = '/api/index.php';
        $_SERVER['REMOTE_ADDR'] = ${JSON.stringify(ip)};
        $_SERVER['HTTP_AUTHORIZATION'] = ${JSON.stringify(jeton ? `Bearer ${jeton}` : "")};
        $_GET = [];
        ob_start();
        register_shutdown_function(function () {
          $corps = ob_get_clean();
          echo "###AJMI:", http_response_code() ?: 200, "###", $corps;
        });
        require '${ROOT}/api/index.php';
      `,
    }),
  );
}

/* ---------- serveur HTTP (démarré avant PHP, pour être joignable aussitôt) ---------- */
const serveur = http.createServer(async (req, res) => {
  try {
    await pret;
  } catch {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    return res.end("PHP n'a pas pu démarrer — voir la console.");
  }

  const brut = req.url || "/";
  let url;
  try {
    url = decodeURIComponent(brut.split("?")[0]);
  } catch {
    res.writeHead(400).end("400");
    return;
  }
  const jeton = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "203.0.113.9";

  try {
    /* --- API --- */
    if (url === "/api" || url.startsWith("/api/")) {
      const morceaux = [];
      for await (const c of req) morceaux.push(c);
      const corps = Buffer.concat(morceaux).toString("utf8");

      const r = await executerPhp({ url: brut, method: req.method, corps: corps || undefined, jeton, ip });
      const m = /###AJMI:(\d+)###([\s\S]*)$/.exec(r.text);
      res.writeHead(Number(m?.[1] || 500), {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      return res.end(m ? m[2] : r.text);
    }

    /* --- dossiers privés (règle équivalente au .htaccess) --- */
    if (/^\/(app|data|ajmi-data)(\/|$)/.test(url)) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      return res.end("403 — Accès interdit");
    }

    /* --- fichiers du site : disque réel, puis disque virtuel (uploads) --- */
    const relatif = url === "/" ? "/index.html" : url;
    const disque = path.join(SRC, relatif);
    let donnees = null;

    if (!relatif.includes("..") && disque.startsWith(SRC) && fs.existsSync(disque) && fs.statSync(disque).isFile()) {
      donnees = fs.readFileSync(disque);
    } else if (await php.fileExists(ROOT + relatif)) {
      donnees = Buffer.from(await php.readFileAsBuffer(ROOT + relatif));
    }

    if (donnees) {
      res.writeHead(200, {
        "content-type": TYPES[path.extname(relatif).toLowerCase()] || "application/octet-stream",
        "content-length": donnees.length,
        "cache-control": relatif.startsWith("/images/") ? "public, max-age=86400" : "no-cache",
      });
      return res.end(req.method === "HEAD" ? undefined : donnees);
    }

    /* --- repli React (toute autre adresse → index.html) --- */
    const index = fs.readFileSync(path.join(SRC, "index.html"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    res.end(index);
  } catch (erreur) {
    console.error("  erreur", url, erreur.message);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Erreur : " + erreur.message);
  }
});

serveur.on("error", (e) => {
  console.error(`\n  ✗ Impossible d'écouter sur ${HOST}:${PORT} — ${e.code}\n`);
  process.exit(1);
});

serveur.listen(PORT, HOST, () => {
  const a = serveur.address();
  console.log(`\n  Écoute sur ${a.address}:${a.port} — http://localhost:${a.port}/\n`);
});

/* ---------- démarrage de PHP ---------- */
let loadNodeRuntime, PHP;
try {
  ({ loadNodeRuntime } = await import("@php-wasm/node"));
  ({ PHP } = await import("@php-wasm/universal"));
} catch {
  rejeterPret();
  console.error(
    "\n  ✗ @php-wasm est absent.\n\n" +
      "    npm i --no-save @php-wasm/node @php-wasm/universal\n" +
      "    node php/tools/preview.mjs\n",
  );
  process.exit(1);
}

/* php-wasm ouvre au démarrage un port local (proxy réseau sortant de PHP,
   dont ce site n'a aucun besoin). On le repère pour le refermer ensuite :
   seul le port du site doit rester ouvert. */
const socketsParasites = [];
const listenOrigine = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  socketsParasites.push(this);
  return listenOrigine.apply(this, args);
};

const runtime = await loadNodeRuntime("8.3", { emscriptenOptions: { processId: 1 } });
net.Server.prototype.listen = listenOrigine;

php = new PHP(runtime);

const info = await php.run({ code: "<?php echo PHP_VERSION, extension_loaded('pdo_sqlite') ? ' (SQLite)' : ' (sans SQLite)';" });
console.log(`  PHP ${info.text.trim()}`);

/* ---------- copie du projet dans le disque virtuel ---------- */
async function copier(dir, cible) {
  await php.mkdirTree(cible);
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, e.name);
    if (e.isDirectory()) await copier(src, `${cible}/${e.name}`);
    else await php.writeFile(`${cible}/${e.name}`, new Uint8Array(fs.readFileSync(src)));
  }
}

for (const d of [ROOT, `${ROOT}/uploads`, `${ROOT}/ajmi-data`]) await php.mkdirTree(d);
await copier(SRC, ROOT);
// Les .htaccess ne concernent qu'Apache : ici le routage est fait plus haut.
for (const f of [".htaccess", "app/.htaccess", "uploads/.htaccess"]) {
  if (await php.fileExists(`${ROOT}/${f}`)) await php.unlink(`${ROOT}/${f}`);
}
console.log(`  ${fs.readdirSync(SRC).length} entrées copiées dans le disque virtuel`);

/* ---------- installation automatique (le vrai install.php) ---------- */
if (!(await php.fileExists(`${ROOT}/app/config.php`))) {
  const r = await php.run({
    code: `<?php
      $_SERVER['REQUEST_METHOD'] = 'POST';
      $_SERVER['REQUEST_URI'] = '/install.php';
      $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
      $_POST = [
        'driver' => 'sqlite',
        'nom' => 'Maître Ajmi',
        'email' => ${JSON.stringify(EMAIL)},
        'password' => ${JSON.stringify(PASS)},
        'password2' => ${JSON.stringify(PASS)},
      ];
      ob_start();
      include '${ROOT}/install.php';
      $html = ob_get_clean();
      echo is_file('${ROOT}/app/config.php') && strpos($html, 'Installation termin') !== false
        ? 'OK' : 'ÉCHEC : ' . substr(strip_tags($html), 0, 300);
    `,
  });
  console.log(`  installation → ${r.text.trim().slice(0, 200)}`);
}

resoudrePret();

/* On referme le port interne de php-wasm (voir plus haut). */
await new Promise((r) => setTimeout(r, 400));
for (const s of socketsParasites) {
  if (s === serveur) continue;
  try {
    s.close();
    s.closeAllConnections?.();
  } catch {}
}

const a = serveur.address();
console.log(`\n  Site   : http://localhost:${a.port}/`);
console.log(`  Admin  : http://localhost:${a.port}/admin`);
console.log(`  Compte : ${EMAIL} / ${PASS}\n`);
console.log("  Données en mémoire : un redémarrage remet tout à zéro.\n");

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => process.exit(0));
