/* ------------------------------------------------------------------
   Accès aux données (Cloudflare D1 / SQLite).
   Même contrat que server/db.js, en asynchrone (l'API D1 l'est).
------------------------------------------------------------------- */

export function createDb(env) {
  const db = env.DB;

  const all = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results ?? [];
  const one = async (sql, ...args) => (await db.prepare(sql).bind(...args).first()) ?? null;
  const run = async (sql, ...args) => db.prepare(sql).bind(...args).run();

  const users = {
    count: async () => (await one("select count(*) c from users")).c,
    byEmail: (email) => one("select * from users where lower(email) = lower(?)", email),
    create: async (nom, email, passwordHash) =>
      run(
        `insert into users (nom, email, password) values (?, ?, ?)
         on conflict(email) do update set nom = excluded.nom, password = excluded.password`,
        nom,
        String(email).toLowerCase(),
        passwordHash,
      ),
    setPassword: (email, passwordHash) => run("update users set password = ? where email = ?", passwordHash, email),
  };

  const content = {
    get: async () => {
      const row = await one("select data from content where id = 1");
      return row ? JSON.parse(row.data) : null;
    },
    set: async (data, author) => {
      const raw = JSON.stringify(data);
      await run(
        `insert into content (id, data, updated_at) values (1, ?, datetime('now'))
         on conflict(id) do update set data = excluded.data, updated_at = excluded.updated_at`,
        raw,
      );
      await run("insert into history (data, author) values (?, ?)", raw, author ?? null);
      await run("delete from history where id not in (select id from history order by id desc limit 20)");
    },
    history: () => all("select id, author, created_at from history order by id desc"),
    version: async (id) => {
      const row = await one("select data from history where id = ?", id);
      return row ? JSON.parse(row.data) : null;
    },
  };

  const messages = {
    add: (m, ip) =>
      run(
        "insert into messages (nom, email, telephone, competence, message, ip) values (?,?,?,?,?,?)",
        m.nom,
        m.email,
        m.telephone ?? "",
        m.competence ?? "",
        m.message,
        ip,
      ),
    all: async () => (await all("select * from messages order by created_at desc, id desc")).map((m) => ({ ...m, lu: !!m.lu })),
    unread: async () => (await one("select count(*) c from messages where lu = 0")).c,
    setRead: (id, lu) => run("update messages set lu = ? where id = ?", lu ? 1 : 0, id),
    remove: (id) => run("delete from messages where id = ?", id),
  };

  const media = {
    add: (name, taille) => run("insert or replace into media (name, taille) values (?, ?)", name, taille),
    all: () => all("select * from media order by created_at desc, id desc"),
    remove: (name) => run("delete from media where name = ?", name),
  };

  const reservations = {
    add: (r) =>
      run(
        `insert into reservations
           (id, code_norm, created_at, publication_id, publication_title, nom, telephone, email, adresse, quantite, remarques, statut, ip)
         values (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        r.id,
        r.code_norm,
        r.created_at,
        r.publication_id ?? "",
        r.publication_title ?? "",
        r.nom,
        r.telephone ?? "",
        r.email ?? "",
        r.adresse ?? "",
        Number(r.quantite) || 1,
        r.remarques ?? "",
        r.statut ?? "en_attente",
        r.ip ?? null,
      ),
    all: () =>
      all(
        `select id, code_norm, created_at, publication_id, publication_title, nom, telephone, email,
                adresse, quantite, remarques, statut
           from reservations order by created_at desc`,
      ),
    byId: (id) => one("select * from reservations where id = ?", id),
    byCode: (codeNorm) => one("select * from reservations where code_norm = ? limit 1", codeNorm),
    likeCode: (codeNorm) => one("select * from reservations where code_norm like ? order by created_at desc limit 1", `%${codeNorm}%`),
    setStatus: (id, statut) => run("update reservations set statut = ? where id = ?", statut, id),
    remove: (id) => run("delete from reservations where id = ?", id),
  };

  const stats = async () => ({
    messages: (await one("select count(*) c from messages")).c,
    nonLus: await messages.unread(),
    medias: (await one("select count(*) c from media")).c,
    versions: (await one("select count(*) c from history")).c,
    reservations: (await one("select count(*) c from reservations")).c,
    reservationsEnAttente: (await one("select count(*) c from reservations where statut = 'en_attente'")).c,
    derniereMaj: (await one("select updated_at from content where id = 1"))?.updated_at ?? null,
  });

  return { createDb: db, users, content, messages, media, reservations, stats };
}
