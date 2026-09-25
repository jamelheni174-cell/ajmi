import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Users, closeDb } from "./db.js";

console.log("\n  Création d'un compte administrateur — Cabinet Ajmi\n");

// Mode non interactif : ADMIN_NOM=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin
let nom = process.env.ADMIN_NOM;
let email = process.env.ADMIN_EMAIL;
let password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  nom = (await rl.question("  Nom affiché      : ")).trim() || "Administrateur";
  email = (await rl.question("  Email            : ")).trim();
  password = (await rl.question("  Mot de passe     : ")).trim();
  rl.close();
}
nom = (nom || "Administrateur").trim();
email = (email || "").trim().toLowerCase();
password = (password || "").trim();

if (!email || password.length < 8) {
  console.error("\n  ✗ Email requis et mot de passe d'au moins 8 caractères.\n");
  process.exit(1);
}

Users.create(nom, email, password);

// Ferme la base : garantit que l'écriture est bien dans le fichier principal
// avant l'arrêt du processus.
closeDb();

console.log(`\n  ✓ Compte « ${email} » enregistré. Connectez-vous sur /#/admin\n`);
