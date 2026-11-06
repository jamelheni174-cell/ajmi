import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

// Load fonts (use any available font)
import { readFile } from 'fs/promises';
let fontData;
try {
  fontData = await readFile('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
} catch {
  // fallback: try to find any ttf
  fontData = await readFile(new URL('../node_modules/satori/test/assets/Roboto-Regular.ttf', import.meta.url)).catch(() => null);
  if (!fontData) {
    console.log("No font found, using default");
    fontData = Buffer.alloc(0);
  }
}

const OUT = '/tmp/screenshots_real';
fs.mkdirSync(OUT, { recursive: true });

const NAVY = '#1e2766';
const BG = '#ece9e2';
const CARD = '#ffffff';
const MUTED = '#6b7280';

function browserChrome(content, title='Cabinet Ajmi — Administration') {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1280px',
        height: '800px',
        backgroundColor: BG,
        fontFamily: 'sans-serif',
      },
      children: [
        // Browser bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              height: '40px',
              backgroundColor: '#e5e7eb',
              borderBottom: '1px solid #d1d5db',
              padding: '0 12px',
              gap: '8px',
            },
            children: [
              { type: 'div', props: { style: { display: 'flex', gap: '6px' }, children: [
                { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}},
                { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}},
                { type: 'div', props: { style: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}},
              ]}},
              { type: 'div', props: { style: { flex: 1, display: 'flex', justifyContent: 'center' }, children: [
                { type: 'div', props: { style: { backgroundColor: 'white', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }, children: [
                  { type: 'div', props: { style: { width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%' }}},
                  'https://cabinetmaitreajmi.tn/#/admin — ' + title,
                ]}},
              ]}},
            ]
          }
        },
        content
      ]
    }
  };
}

function tabBar(active) {
  const tabs = ['Accueil','Cabinet','Domaines','Publications','Réservations','Messages','Galerie','Contact'];
  return {
    type: 'div',
    props: {
      style: { display: 'flex', gap: '4px', padding: '12px 24px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' },
      children: tabs.map(t => ({
        type: 'div',
        props: {
          style: {
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: t===active ? NAVY : '#f3f4f6',
            color: t===active ? 'white' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          },
          children: t + (t==='Réservations' ? ' ③' : t==='Messages' ? ' ②' : '')
        }
      }))
    }
  };
}

function card(children, style={}) {
  return {
    type: 'div',
    props: {
      style: { backgroundColor: CARD, borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', ...style },
      children
    }
  };
}

async function render(element, filename, width=1280, height=800) {
  const svg = await satori(element, { width, height, fonts: fontData.length ? [{ name: 'sans-serif', data: fontData, weight: 400, style: 'normal' }] : [] });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(OUT, filename), png);
  console.log('Saved', filename);
}

// 1. Login
const loginPage = browserChrome({
  type: 'div',
  props: {
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px' },
    children: [
      { type: 'div', props: { style: { width: '48px', height: '48px', backgroundColor: NAVY, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '700' }, children: 'A.' }},
      { type: 'div', props: { style: { fontSize: '10px', letterSpacing: '3px', color: '#4f46e5', marginTop: '12px', textTransform: 'uppercase', fontWeight: '600' }, children: "Espace Sécurisé d'Administration" }},
      { type: 'div', props: { style: { fontSize: '24px', fontWeight: '700', color: NAVY, marginTop: '4px' }, children: 'Cabinet Ajmi' }},
      {
        type: 'div',
        props: {
          style: { backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', width: '360px', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
          children: [
            { type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', fontSize: '11px', color: '#6b7280' }, children: [
              { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [
                { type: 'div', props: { style: { width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}},
                'Serveur en ligne'
              ]}},
              { type: 'div', props: { style: { backgroundColor: '#e0e7ff', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', color: NAVY }, children: 'v2.0' }}
            ]}},
            { type: 'div', props: { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }, children: 'Identifiant Email' }},
            { type: 'div', props: { style: { backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#1f2937' }, children: 'ajmianouar259@gmail.com' }},
            { type: 'div', props: { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginTop: '4px' }, children: 'Mot de passe administrateur' }},
            { type: 'div', props: { style: { backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }, children: [
              '••••••••••••', { type: 'div', props: { style: { color: NAVY, fontSize: '11px' }, children: 'Afficher' }}
            ]}},
            { type: 'div', props: { style: { backgroundColor: '#1e3a8a', color: 'white', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '8px' }, children: "Accéder à l'Administration" }},
          ]
        }
      }
    ]
  }
}, 'Connexion');

await render(loginPage, '00_login.png');

// 2. Accueil
const accueil = browserChrome({
  type: 'div',
  props: {
    style: { display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: BG },
    children: [
      tabBar('Accueil'),
      { type: 'div', props: { style: { display: 'flex', gap: '16px', padding: '20px 24px', flex: 1 }, children: [
        { type: 'div', props: { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }, children: [
          card([
            { type: 'div', props: { style: { fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '1px' }, children: 'Hero — Page d’accueil' }},
            { type: 'div', props: { style: { fontSize: '20px', fontWeight: '700', color: NAVY, marginTop: '6px' }, children: 'Me Anouar Ajmi — Avocat à la Cour' }},
            { type: 'div', props: { style: { fontSize: '12px', color: '#4b5563', marginTop: '4px', lineHeight: '1.4' }, children: 'Plus de 25 ans d’expérience au service du droit des affaires et du contentieux.' }},
            { type: 'div', props: { style: { display: 'flex', gap: '8px', marginTop: '12px' }, children: [
              { type: 'div', props: { style: { backgroundColor: NAVY, color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '11px' }, children: 'Prendre rendez-vous' }},
              { type: 'div', props: { style: { backgroundColor: 'white', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: '6px', fontSize: '11px' }, children: 'Découvrir le cabinet' }},
            ]}},
          ]) ,
          card([
            { type: 'div', props: { style: { fontSize: '12px', fontWeight: '600', color: NAVY }, children: 'Chiffres clés' }},
            { type: 'div', props: { style: { display: 'flex', gap: '12px', marginTop: '12px' }, children: [
              { type: 'div', props: { style: { flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }, children: [
                { type: 'div', props: { style: { fontSize: '18px', fontWeight: '700', color: NAVY }, children: '1200+' }},
                { type: 'div', props: { style: { fontSize: '10px', color: MUTED }, children: 'Dossiers traités' }},
              ]}},
              { type: 'div', props: { style: { flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }, children: [
                { type: 'div', props: { style: { fontSize: '18px', fontWeight: '700', color: NAVY }, children: '25 ans' }},
                { type: 'div', props: { style: { fontSize: '10px', color: MUTED }, children: "d'expérience" }},
              ]}},
              { type: 'div', props: { style: { flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }, children: [
                { type: 'div', props: { style: { fontSize: '18px', fontWeight: '700', color: NAVY }, children: '98%' }},
                { type: 'div', props: { style: { fontSize: '10px', color: MUTED }, children: 'Clients satisfaits' }},
              ]}},
            ]}},
          ]),
        ]}},
        { type: 'div', props: { style: { width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }, children: [
          card([
            { type: 'div', props: { style: { fontSize: '12px', fontWeight: '600', color: NAVY }, children: 'Aperçu en direct' }},
            { type: 'div', props: { style: { width: '100%', height: '120px', backgroundColor: '#e0e7ff', borderRadius: '8px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY, fontSize: '11px' }, children: 'Photo hero — bureau Tunis' }},
          ]),
          { type: 'div', props: { style: { backgroundColor: '#1e3a8a', color: 'white', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }, children: 'Publier en ligne ✓' }},
        ]}},
      ]}},
    ]
  }
}, 'Accueil');
await render(accueil, '01_accueil.png');

// 3. Publications
const pubs = browserChrome({
  type: 'div',
  props: {
    style: { display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: BG },
    children: [
      tabBar('Publications'),
      { type: 'div', props: { style: { padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }, children: [
        { type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [
          { type: 'div', props: { style: { fontSize: '16px', fontWeight: '700', color: NAVY }, children: 'Publications & Ouvrage 2026 ★' }},
          { type: 'div', props: { style: { backgroundColor: NAVY, color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '11px' }, children: '+ Ajouter une publication' }},
        ]}},
        {
          type: 'div',
          props: {
            style: { backgroundColor: 'white', borderRadius: '12px', border: '2px solid #fbbf24', padding: '16px', display: 'flex', gap: '16px' },
            children: [
              { type: 'div', props: { style: { width: '100px', height: '130px', backgroundColor: NAVY, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', textAlign: 'center', padding: '8px' }, children: 'COUVERTURE\nOuvrage 2026' }},
              { type: 'div', props: { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }, children: [
                { type: 'div', props: { style: { backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', alignSelf: 'flex-start' }, children: '⭐ En vedette — Page d’accueil' }},
                { type: 'div', props: { style: { fontSize: '14px', fontWeight: '700', color: NAVY }, children: 'Droit des affaires en Tunisie — 2e édition (2026)' }},
                { type: 'div', props: { style: { fontSize: '11px', color: '#6b7280' }, children: 'Par Me Anouar Ajmi — 320 pages • Disponible en librairie' }},
                { type: 'div', props: { style: { fontSize: '11px', color: '#374151', lineHeight: '1.4' }, children: 'Analyse approfondie du Code des sociétés et jurisprudence récente. Ouvrage de référence pour praticiens et étudiants.' }},
                { type: 'div', props: { style: { display: 'flex', gap: '8px', marginTop: '6px' }, children: [
                  { type: 'div', props: { style: { backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }, children: 'Modifier' }},
                  { type: 'div', props: { style: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#dc2626' }, children: 'Retirer la vedette' }},
                ]}},
              ]}},
            ]
          }
        },
        { type: 'div', props: { style: { display: 'flex', gap: '12px' }, children: [
          card([{ type: 'div', props: { style: { fontSize: '12px', fontWeight: '600' }, children: 'Article récent' }}, { type: 'div', props: { style: { fontSize: '11px', color: MUTED, marginTop: '4px' }, children: 'Réforme du Code de procédure civile' }}], { flex: 1 }),
          card([{ type: 'div', props: { style: { fontSize: '12px', fontWeight: '600' }, children: 'Conférence' }}, { type: 'div', props: { style: { fontSize: '11px', color: MUTED, marginTop: '4px' }, children: 'Colloque Tunis 2025 — Arbitrage' }}], { flex: 1 }),
          card([{ type: 'div', props: { style: { fontSize: '12px', fontWeight: '600' }, children: 'Interview' }}, { type: 'div', props: { style: { fontSize: '11px', color: MUTED, marginTop: '4px' }, children: 'Leaders Magazine — Décembre 2024' }}], { flex: 1 }),
        ]}},
      ]}}
    ]
  }
}, 'Publications');
await render(pubs, '02_publications.png');

// 4. Réservations
const resa = browserChrome({
  type: 'div',
  props: {
    style: { display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: BG },
    children: [
      tabBar('Réservations'),
      { type: 'div', props: { style: { padding: '16px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }, children: [
        { type: 'div', props: { style: { display: 'flex', gap: '8px' }, children: [
          { type: 'div', props: { style: { backgroundColor: NAVY, color: 'white', padding: '6px 12px', borderRadius: '16px', fontSize: '11px' }, children: 'Toutes (12)' }},
          { type: 'div', props: { style: { backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', border: '1px solid #fbbf24' }, children: 'En attente (3) •' }},
          { type: 'div', props: { style: { backgroundColor: 'white', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', border: '1px solid #e5e7eb' }, children: 'Confirmées (6)' }},
          { type: 'div', props: { style: { backgroundColor: 'white', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', border: '1px solid #e5e7eb' }, children: 'Annulées (3)' }},
        ]}},
        {
          type: 'div',
          props: {
            style: { backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' },
            children: [
              { type: 'div', props: { style: { display: 'flex', backgroundColor: '#f9fafb', padding: '8px 12px', fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }, children: [
                { type: 'div', props: { style: { width: '90px' }, children: 'Code' }},
                { type: 'div', props: { style: { width: '140px' }, children: 'Client' }},
                { type: 'div', props: { style: { width: '120px' }, children: 'Date' }},
                { type: 'div', props: { style: { width: '110px' }, children: 'Statut' }},
                { type: 'div', props: { style: { flex: 1 }, children: 'Actions' }},
              ]}},
              ...[
                ['RES-9F3A2', 'Sami Ben Ali', '12/11/2025 14:30', 'En attente', '#f59e0b'],
                ['RES-8B1C4', 'Leila Mansour', '10/11/2025 09:00', 'Confirmée', '#22c55e'],
                ['RES-7K2D9', 'Karim Trabelsi', '08/11/2025 16:00', 'En attente', '#f59e0b'],
                ['RES-6M4E1', 'Nadia Gharbi', '05/11/2025 11:00', 'Confirmée', '#22c55e'],
              ].map(row => ({
                type: 'div',
                props: {
                  style: { display: 'flex', padding: '10px 12px', fontSize: '12px', borderTop: '1px solid #f3f4f6', alignItems: 'center' },
                  children: [
                    { type: 'div', props: { style: { width: '90px', fontWeight: '600', color: NAVY, fontFamily: 'monospace' }, children: row[0] }},
                    { type: 'div', props: { style: { width: '140px' }, children: row[1] }},
                    { type: 'div', props: { style: { width: '120px', color: MUTED }, children: row[2] }},
                    { type: 'div', props: { style: { width: '110px' }, children: [
                      { type: 'div', props: { style: { backgroundColor: row[4]+'20', color: row[4], padding: '2px 8px', borderRadius: '10px', fontSize: '10px', textAlign: 'center' }, children: row[3] }}
                    ]}},
                    { type: 'div', props: { style: { flex: 1, display: 'flex', gap: '6px' }, children: [
                      { type: 'div', props: { style: { backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '6px', fontSize: '10px' }, children: 'Confirmer' }},
                      { type: 'div', props: { style: { backgroundColor: 'white', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '6px', fontSize: '10px' }, children: 'Voir' }},
                    ]}},
                  ]
                }
              }))
            ]
          }
        },
        { type: 'div', props: { style: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#1e40af' }, children: '💡 Cliquez sur Confirmer pour notifier le client par email. Le code RES-# permet le suivi côté client dans Mon suivi.' }},
      ]}}
    ]
  }
}, 'Réservations');
await render(resa, '03_reservations.png');

// 5. Domaines
const domaines = browserChrome({
  type: 'div',
  props: {
    style: { display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: BG },
    children: [
      tabBar('Domaines'),
      { type: 'div', props: { style: { padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }, children: [
        ...['Droit des affaires','Contentieux','Arbitrage','Droit social','Immobilier','Fiscalité'].map(title => ({
          type: 'div',
          props: {
            style: { width: '360px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px', display: 'flex', gap: '12px' },
            children: [
              { type: 'div', props: { style: { width: '48px', height: '48px', backgroundColor: '#e0e7ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }, children: '⚖️' }},
              { type: 'div', props: { style: { flex: 1 }, children: [
                { type: 'div', props: { style: { fontSize: '13px', fontWeight: '700', color: NAVY }, children: title }},
                { type: 'div', props: { style: { fontSize: '11px', color: MUTED, marginTop: '4px', lineHeight: '1.3' }, children: 'Accompagnement complet — conseil, rédaction et représentation devant les juridictions.' }},
                { type: 'div', props: { style: { display: 'flex', gap: '6px', marginTop: '8px' }, children: [
                  { type: 'div', props: { style: { backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '6px', fontSize: '10px' }, children: 'Modifier' }},
                  { type: 'div', props: { style: { backgroundColor: 'white', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: '6px', fontSize: '10px' }, children: 'Icône' }},
                ]}},
              ]}},
            ]
          }
        }))
      ]}}
    ]
  }
}, 'Domaines');
await render(domaines, '04_domaines.png');

console.log('All done in', OUT);
