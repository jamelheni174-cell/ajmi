#!/usr/bin/env node
/* ------------------------------------------------------------------
   Tests de la version PHP — exécutés avec un vrai PHP 8.3 (WebAssembly).

     npm i --no-save @php-wasm/node @php-wasm/universal
     node php/tools/test-api.mjs

   Deux suites :
     1. « API »      : 59 vérifications sur les routes, l'authentification,
                       les médias, les réservations et la base.
     2. « Installation » : l'assistant install.php, de la validation du
                       formulaire jusqu'à la première requête API.

   Aucune dépendance n'est ajoutée au package.json : l'installation est
   ponctuelle (« --no-save »). Sur un serveur disposant de PHP en ligne de
   commande, préférez simplement :
       php -S localhost:8080 -t php/
------------------------------------------------------------------- */

import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..");

let moteur;
try {
  moteur = {
    ...(await import("@php-wasm/node")),
    ...(await import("@php-wasm/universal")),
  };
} catch {
  console.error(
    "\n  ✗ @php-wasm/node est absent.\n\n" +
      "    npm i --no-save @php-wasm/node @php-wasm/universal\n" +
      "    node php/tools/test-api.mjs\n",
  );
  process.exit(1);
}

const { loadNodeRuntime, PHP } = moteur;

const resultats = [];
const verifier = (suite, label, cond, detail = "") =>
  resultats.push({ suite, label, ok: !!cond, detail: cond ? "" : String(detail).replace(/\s+/g, " ").slice(0, 220) });

const fichiersNecessaires = [
  "api/index.php",
  "app/bootstrap.php",
  "app/helpers.php",
  "app/auth.php",
  "app/db.php",
  "app/routes.php",
  "app/schema/sqlite.sql",
  "install.php",
  "check.php",
];

/** Prépare un faux site dans le système de fichiers du PHP embarqué. */
async function preparer(php, racine, options = {}) {
  const { avecConfig = true } = options;
  for (const d of [racine, `${racine}/app`, `${racine}/app/schema`, `${racine}/api`, `${racine}/uploads`, `${racine}/ajmi-data`]) {
    await php.mkdirTree(d);
  }
  for (const f of fichiersNecessaires) {
    await php.writeFile(`${racine}/${f}`, fs.readFileSync(path.join(SRC, f), "utf8"));
  }
  await php.writeFile(`${racine}/index.html`, "<!doctype html><title>test</title>");
  if (avecConfig) {
    await php.writeFile(
      `${racine}/app/config.php`,
      `<?php return [
        'driver' => 'sqlite',
        'sqlite_path' => '${racine}/ajmi-data/ajmi.sqlite',
        'upload_dir' => '${racine}/uploads',
        'data_dir' => '${racine}/ajmi-data',
        'jwt_secret' => '${"a".repeat(64)}',
        'jwt_days' => 7,
        'max_upload' => 6291456,
        'mysql' => ['host' => 'localhost', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'],
      ];`,
    );
  }
}

/* ============================ Suite 1 : API ============================ */

async function suiteApi() {
  const ROOT = "/api-test";
  const php = new PHP(await loadNodeRuntime("8.3", { emscriptenOptions: { processId: 11 } }));
  await preparer(php, ROOT);

  const schema = await php.run({
    code: `<?php
      define('AJMI', true);
      require '${ROOT}/app/helpers.php';
      define('AJMI_CONFIG', require '${ROOT}/app/config.php');
      require '${ROOT}/app/auth.php';
      require '${ROOT}/app/db.php';
      ajmi_installer_schema(ajmi_db(), 'sqlite');
      ajmi_user_creer('Me Ajmi', 'admin@ajmi.tn', ajmi_hash_mot_de_passe('motdepasse123'));
      echo ajmi_valeur('SELECT count(*) FROM users'), '/', count(ajmi_toutes("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"));
    `,
  });
  verifier("API", "schéma et compte créés", schema.text.trim() === "1/6", schema.text);

  /** Une requête = une exécution du contrôleur, comme en CGI. */
  async function requete({ url, method = "GET", body, token }) {
    const r = await php.run({
      code: `<?php
        define('AJMI_INPUT', ${JSON.stringify(body === undefined ? "" : JSON.stringify(body))});
        $_SERVER['REQUEST_METHOD'] = ${JSON.stringify(method)};
        $_SERVER['REQUEST_URI'] = ${JSON.stringify(url)};
        $_SERVER['SCRIPT_NAME'] = '/api/index.php';
        $_SERVER['REMOTE_ADDR'] = '203.0.113.9';
        $_SERVER['HTTP_AUTHORIZATION'] = ${JSON.stringify(token ? `Bearer ${token}` : "")};
        $_GET = [];
        ob_start();
        register_shutdown_function(function () {
          $corps = ob_get_clean();
          echo "###STATUS:", http_response_code() ?: 200, "###", $corps;
        });
        require '${ROOT}/api/index.php';
      `,
    });
    const m = /###STATUS:(\d+)###([\s\S]*)$/.exec(r.text) || [];
    let json = null;
    try { json = JSON.parse(m[2]); } catch {}
    return { status: Number(m[1] || 0), json, texte: (m[2] || r.text).slice(0, 200) };
  }

  async function attendre(label, opts, attendu = 200) {
    const r = await requete(opts);
    verifier("API", `${label} → ${attendu}`, r.status === attendu, `reçu ${r.status} : ${r.texte}`);
    return r;
  }

  const sante = await attendre("GET /api/health", { url: "/api/health" });
  verifier("API", "health renvoie { ok: true }", sante.json?.ok === true, JSON.stringify(sante.json));

  await attendre("GET /api/content (base vide)", { url: "/api/content" });
  await attendre("GET /api/messages sans jeton", { url: "/api/messages" }, 401);
  await attendre("GET /api/reservations sans jeton", { url: "/api/reservations" }, 401);
  await attendre("GET /api/stats sans jeton", { url: "/api/stats" }, 401);
  await attendre("POST /api/login mot de passe erroné", { url: "/api/login", method: "POST", body: { email: "admin@ajmi.tn", password: "faux" } }, 401);

  const login = await attendre("POST /api/login", { url: "/api/login", method: "POST", body: { email: "admin@ajmi.tn", password: "motdepasse123" } });
  const token = login.json?.token || "";
  verifier("API", "jeton JWT en trois segments", token.split(".").length === 3, token);

  const moi = await attendre("GET /api/me", { url: "/api/me", token });
  verifier("API", "identité renvoyée", moi.json?.user?.email === "admin@ajmi.tn", JSON.stringify(moi.json));
  await attendre("GET /api/me avec jeton falsifié", { url: "/api/me", token: token.slice(0, -3) + "abc" }, 401);

  await attendre("PUT /api/content", { url: "/api/content", method: "PUT", token, body: { hero: { titre: "Cabinet Ajmi — PHP" }, note: "l'apostrophe" } });
  const contenu = await attendre("GET /api/content", { url: "/api/content" });
  verifier("API", "contenu relu à l'identique (accents, apostrophe)", contenu.json?.note === "l'apostrophe" && contenu.json?.hero?.titre === "Cabinet Ajmi — PHP", JSON.stringify(contenu.json));
  await attendre("PUT /api/content sans jeton", { url: "/api/content", method: "PUT", body: { a: 1 } }, 401);
  await attendre("GET /api/history", { url: "/api/history", token });
  const version = await attendre("GET /api/history/1", { url: "/api/history/1", token });
  verifier("API", "version d'historique relisible", version.json?.note === "l'apostrophe", JSON.stringify(version.json));
  await attendre("GET /api/history/999", { url: "/api/history/999", token }, 404);

  await attendre("POST /api/messages", { url: "/api/messages", method: "POST", body: { nom: "Ahmed Ben Ali", email: "a@b.tn", telephone: "22334455", competence: "Famille", message: "Bonjour Maître" } }, 201);
  await attendre("POST /api/messages champ manquant", { url: "/api/messages", method: "POST", body: { nom: "" } }, 400);
  const messages = await attendre("GET /api/messages", { url: "/api/messages", token });
  verifier("API", "message enregistré, non lu", messages.json?.[0]?.nom === "Ahmed Ben Ali" && messages.json[0].lu === false, JSON.stringify(messages.json)?.slice(0, 140));
  await attendre("PUT /api/messages/:id", { url: `/api/messages/${messages.json?.[0]?.id}`, method: "PUT", token, body: { lu: true } });
  const relu = await attendre("GET /api/messages après lecture", { url: "/api/messages", token });
  verifier("API", "marquage « lu » effectif", relu.json?.[0]?.lu === true, JSON.stringify(relu.json?.[0]));

  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const media = await attendre("POST /api/media (image 1×1)", { url: "/api/media", method: "POST", token, body: { name: "essai.png", dataUrl: png } }, 201);
  verifier("API", "image écrite dans uploads/", await php.fileExists(ROOT + (media.json?.url || "/absent")), media.json?.url);
  const liste = await attendre("GET /api/media", { url: "/api/media" });
  verifier("API", "image listée", Array.isArray(liste.json) && liste.json.length === 1, JSON.stringify(liste.json));
  await attendre("POST /api/media format refusé", { url: "/api/media", method: "POST", token, body: { name: "x", dataUrl: "data:text/plain;base64,AAAA" } }, 400);
  await attendre("DELETE /api/media/:nom", { url: `/api/media/${path.basename(media.json?.url || "x")}`, method: "DELETE", token });
  verifier("API", "fichier supprimé du disque", !(await php.fileExists(ROOT + (media.json?.url || "/x"))));

  const resa = await attendre("POST /api/reservations", { url: "/api/reservations", method: "POST", body: { publication_id: "p1", publication_title: "Le droit des affaires", nom: "Sonia", telephone: "55667788", email: "s@x.tn", adresse: "Sousse", quantite: 2 } }, 201);
  const ref = resa.json?.id || "";
  verifier("API", "référence au format RÉSER-#XXXXXX", /^RÉSER-#[0-9A-F]{6}$/.test(ref), ref);
  verifier("API", "champs internes non exposés (code_norm, ip)", !("code_norm" in (resa.json || {})) && !("ip" in (resa.json || {})), JSON.stringify(resa.json));

  const suivi = await attendre("GET /api/reservations/track/:ref", { url: `/api/reservations/track/${encodeURIComponent(ref)}` });
  verifier("API", "suivi par référence complète", suivi.json?.nom === "Sonia" && suivi.json?.statut === "en_attente", JSON.stringify(suivi.json));
  const partiel = await attendre("GET /api/reservations/track/:6 derniers", { url: `/api/reservations/track/${ref.slice(-6)}` });
  verifier("API", "suivi par code partiel", partiel.json?.id === ref, JSON.stringify(partiel.json));
  const sansAccent = await attendre("GET /api/reservations/track sans accent", { url: `/api/reservations/track/${encodeURIComponent(ref.replace("É", "E"))}` });
  verifier("API", "suivi avec le code tapé sans accent", sansAccent.json?.id === ref, JSON.stringify(sansAccent.json));
  await attendre("GET /api/reservations/track inconnu", { url: "/api/reservations/track/ZZZZZZ" }, 404);
  await attendre("PUT /api/reservations/:id", { url: `/api/reservations/${encodeURIComponent(ref)}`, method: "PUT", token, body: { statut: "confirmee" } });
  const apres = await attendre("GET suivi après changement", { url: `/api/reservations/track/${ref.slice(-6)}` });
  verifier("API", "statut mis à jour", apres.json?.statut === "confirmee", JSON.stringify(apres.json));
  await attendre("PUT statut inconnu", { url: `/api/reservations/${encodeURIComponent(ref)}`, method: "PUT", token, body: { statut: "perdue" } }, 400);
  await attendre("PUT statut sans jeton", { url: `/api/reservations/${encodeURIComponent(ref)}`, method: "PUT", body: { statut: "livree" } }, 401);
  await attendre("GET /api/reservations (admin)", { url: "/api/reservations", token });

  const exp = await attendre("GET /api/export", { url: "/api/export", token });
  verifier("API", "export complet (contenu, messages, réservations)", exp.json?.content?.note === "l'apostrophe" && Array.isArray(exp.json?.messages) && Array.isArray(exp.json?.reservations), JSON.stringify(exp.json)?.slice(0, 140));
  await attendre("POST /api/password ancien erroné", { url: "/api/password", method: "POST", token, body: { ancien: "faux", nouveau: "nouveaupass123" } }, 400);
  await attendre("POST /api/password", { url: "/api/password", method: "POST", token, body: { ancien: "motdepasse123", nouveau: "nouveaupass123" } });
  await attendre("login avec le nouveau mot de passe", { url: "/api/login", method: "POST", body: { email: "admin@ajmi.tn", password: "nouveaupass123" } });
  await attendre("login avec l'ancien mot de passe", { url: "/api/login", method: "POST", body: { email: "admin@ajmi.tn", password: "motdepasse123" } }, 401);
  await attendre("GET /api/inconnu", { url: "/api/inconnu" }, 404);

  const chk = await php.run({
    code: `<?php
      $_SERVER['REQUEST_METHOD'] = 'GET'; $_SERVER['REQUEST_URI'] = '/check.php'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
      ob_start(); include '${ROOT}/check.php'; $html = ob_get_clean();
      echo "ko=", substr_count($html, 'À corriger'), " avert=", substr_count($html, 'Remarque');
    `,
  });
  verifier("API", "check.php ne signale aucune erreur bloquante", /ko=0 avert=\d+/.test(chk.text), chk.text);
}

/* ========================= Suite 2 : installation ========================= */

async function suiteInstallation() {
  const ROOT = "/install-test";
  const php = new PHP(await loadNodeRuntime("8.3", { emscriptenOptions: { processId: 12 } }));
  await preparer(php, ROOT, { avecConfig: false });

  const tableauPhp = (obj) =>
    "[" + Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)} => ${JSON.stringify(v)}`).join(", ") + "]";

  async function formulaire(post) {
    const r = await php.run({
      code: `<?php
        $_SERVER['REQUEST_METHOD'] = ${JSON.stringify(Object.keys(post).length ? "POST" : "GET")};
        $_SERVER['REQUEST_URI'] = '/install.php';
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
        $_POST = ${tableauPhp(post)};
        ob_start();
        include '${ROOT}/install.php';
        echo ob_get_clean();
      `,
    });
    return r.text;
  }

  const page1 = await formulaire({});
  verifier("Installation", "formulaire affiché avec les vérifications", page1.includes("Installer le site") && page1.includes("Vérifications du serveur"), page1.slice(0, 200));
  verifier("Installation", "aucune configuration écrite avant validation", !(await php.fileExists(`${ROOT}/app/config.php`)));

  const base = { driver: "sqlite", nom: "Me Ajmi", email: "admin@ajmi.tn" };
  verifier("Installation", "refus si les mots de passe diffèrent", (await formulaire({ ...base, password: "motdepasse123", password2: "autrechose" })).includes("ne correspondent pas"));
  verifier("Installation", "refus si mot de passe trop court", (await formulaire({ ...base, password: "court", password2: "court" })).includes("au moins 8 caractères"));
  verifier("Installation", "refus si email invalide", (await formulaire({ ...base, email: "pas-un-email", password: "motdepasse123", password2: "motdepasse123" })).includes("email invalide"));
  verifier("Installation", "aucune configuration écrite après un formulaire invalide", !(await php.fileExists(`${ROOT}/app/config.php`)));

  const page = await formulaire({ ...base, email: "Admin@Ajmi.tn", password: "motdepasse123", password2: "motdepasse123" });
  verifier("Installation", "écran de confirmation affiché", page.includes("Installation terminée"), page.slice(0, 300));
  verifier("Installation", "rappel de supprimer install.php", page.includes("Supprimez") && page.includes("install.php"));
  verifier("Installation", "config.php créé", await php.fileExists(`${ROOT}/app/config.php`));

  const config = await php.readFileAsText(`${ROOT}/app/config.php`);
  verifier("Installation", "secret de 64 caractères dans config.php", /'jwt_secret' => '[0-9a-f]{64}'/.test(config));
  verifier("Installation", "mot de passe absent du fichier de configuration", !config.includes("motdepasse123"));

  const etat = await php.run({
    code: `<?php
      define('AJMI', true);
      require '${ROOT}/app/helpers.php';
      define('AJMI_CONFIG', require '${ROOT}/app/config.php');
      require '${ROOT}/app/auth.php';
      require '${ROOT}/app/db.php';
      $u = ajmi_user_par_email('admin@ajmi.tn');
      echo 'users=', ajmi_valeur('SELECT count(*) FROM users'),
           ' tables=', count(ajmi_toutes("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")),
           ' email=', ajmi_valeur('SELECT email FROM users'),
           ' verif=', ajmi_verifie_mot_de_passe('motdepasse123', $u['password']) ? 'ok' : 'ko',
           ' base=', is_file(AJMI_CONFIG['sqlite_path']) ? 'fichier' : 'absent';
    `,
  });
  verifier("Installation", "compte admin créé, email en minuscules, mot de passe vérifiable, base sur disque",
    etat.text.trim() === "users=1 tables=6 email=admin@ajmi.tn verif=ok base=fichier", etat.text);

  verifier("Installation", "réinstallation refusée avec un message clair", (await formulaire({})).includes("déjà installé"));

  const api = await php.run({
    code: `<?php
      $_SERVER['REQUEST_METHOD'] = 'GET'; $_SERVER['REQUEST_URI'] = '/api/health'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
      ob_start(); register_shutdown_function(function () { echo ob_get_clean(); });
      require '${ROOT}/api/index.php';
    `,
  });
  verifier("Installation", "API opérationnelle juste après l'installation", /\{"ok":true,"version":1\}/.test(api.text), api.text.slice(0, 200));
}

/* ================================ Exécution ================================ */

try {
  await suiteApi();
  await suiteInstallation();
} catch (erreur) {
  console.error("\n  ✗ Interruption :", erreur.message);
  process.exit(1);
}

const parSuite = {};
for (const r of resultats) {
  parSuite[r.suite] ??= { ok: 0, total: 0 };
  parSuite[r.suite].total++;
  if (r.ok) parSuite[r.suite].ok++;
}

console.log("\n  Version PHP — tests\n");
for (const [suite, { ok, total }] of Object.entries(parSuite)) {
  console.log(`  ${ok === total ? "✓" : "✗"} ${suite} : ${ok}/${total}`);
}
for (const r of resultats.filter((r) => !r.ok)) {
  console.log(`\n  ✗ ${r.suite} — ${r.label}\n      → ${r.detail}`);
}

const echecs = resultats.filter((r) => !r.ok).length;
console.log(`\n  ${resultats.length - echecs}/${resultats.length} vérifications réussies\n`);
process.exit(echecs ? 1 : 0);
