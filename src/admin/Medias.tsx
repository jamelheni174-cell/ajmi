import { useEffect, useState } from "react";
import { deleteImage, listImages, uploadImage } from "../backend";
import { Btn, Card, fileToDataUrl } from "./ui";

export function Medias() {
  const [imgs, setImgs] = useState<{ name: string; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => setImgs(await listImages());
  useEffect(() => { void load(); }, []);

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      const { error } = await uploadImage(await fileToDataUrl(f), f.name);
      if (!error) ok++;
    }
    setBusy(false);
    setMsg(`${ok} image(s) envoyée(s) sur le serveur`);
    void load();
  };

  return (
    <>
      <Card>
        <h2 className="font-serif text-2xl">Médiathèque</h2>
        <p className="mt-2 text-sm text-ink/70">
          Les images sont hébergées sur le serveur et accessibles depuis n'importe quel appareil. Copiez une adresse pour l'utiliser
          dans la galerie ou comme portrait.
        </p>
        <label className="mt-4 inline-block cursor-pointer rounded bg-navy px-5 py-2.5 text-[11px] uppercase tracking-[0.15em] text-paper hover:bg-ink">
          {busy ? "Envoi en cours…" : "+ Téléverser des images"}
          <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => upload(e.target.files)} />
        </label>
        {msg && <p className="mt-3 text-sm text-navy">{msg}</p>}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {imgs.map((i) => (
          <Card key={i.name}>
            <img src={i.url} alt="" className="aspect-[4/3] w-full rounded object-cover" />
            <p className="mt-2 truncate text-[10px] text-ink/50">{i.name}</p>
            <div className="mt-3 flex gap-2">
              <Btn onClick={() => { navigator.clipboard.writeText(i.url); setMsg("Adresse copiée ✓"); }}>Copier l'URL</Btn>
              <Btn variant="danger" onClick={async () => { if (confirm("Supprimer cette image ?")) { await deleteImage(i.name); void load(); } }}>✕</Btn>
            </div>
          </Card>
        ))}
      </div>
      {imgs.length === 0 && <Card><p className="text-sm text-ink/60">Aucune image sur le serveur.</p></Card>}
    </>
  );
}
