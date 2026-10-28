#!/usr/bin/env node
/* ------------------------------------------------------------------
   Vérifie que tous les chemins suivis par Git sont valides sur
   Windows, macOS et Linux.

     npm run check:paths

   Un dossier nommé « Russie et roscongress  » (espaces finaux) ou un
   fichier « CON » empêchent « git clone » de s'achever sous Windows :
   git s'arrête sur « error: invalid path », la copie de travail reste
   incomplète et les commandes npm échouent ensuite de façon trompeuse.
------------------------------------------------------------------- */

import { spawnSync } from "node:child_process";

const out = spawnSync("git", ["ls-files", "-z"], { encoding: "buffer", maxBuffer: 128 * 1024 * 1024 });
if (out.status !== 0) {
  console.error("✗ git introuvable ou dépôt absent.");
  process.exit(1);
}

const files = out.stdout.toString("utf-8").split("\0").filter(Boolean);

// Noms réservés par Windows, avec ou sans extension (CON, NUL, COM1…).
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
// Caractères interdits sur Windows : < > : " | ? * et les caractères de contrôle.
const FORBIDDEN = /[<>:"|?*\u0000-\u001f]/;

const problems = [];

for (const file of files) {
  const segments = file.split("/");
  for (const segment of segments) {
    const where = `  ${file}`;
    const name = segment.replace(/\.[^.]*$/, "");

    if (/[ .]$/.test(segment)) {
      problems.push(`${where}\n     segment « ${segment} » : espace ou point final`);
    } else if (FORBIDDEN.test(segment)) {
      problems.push(`${where}\n     segment « ${segment} » : caractère interdit sous Windows`);
    } else if (RESERVED.test(name)) {
      problems.push(`${where}\n     segment « ${segment} » : nom réservé par Windows`);
    }
  }
}

if (!problems.length) {
  console.log(`✓ ${files.length} chemins valides sur Windows, macOS et Linux.`);
  process.exit(0);
}

console.error(`\n✗ ${problems.length} chemin(s) incompatible(s) avec Windows :\n`);
console.error(problems.join("\n"));
console.error(
  "\n  Un « git clone » sous Windows échouera sur ces chemins.\n" +
    "  Renommez-les :  git mv \"<ancien>\" \"<nouveau>\"\n" +
    "  Pour tout un dossier inutilisé :  git rm -r --cached <dossier> && rm -rf <dossier>\n",
);
process.exit(1);
