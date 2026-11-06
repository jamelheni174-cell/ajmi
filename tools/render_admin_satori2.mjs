import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';

let fontData;
try { fontData = await readFile('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'); } catch { fontData = Buffer.alloc(0); }
const OUT = '/tmp/screenshots_real';
fs.mkdirSync(OUT, { recursive: true });
const NAVY='#1e2766', BG='#ece9e2', CARD='#fff', MUTED='#6b7280';
function chromeWrap(content, title){
  return { type:'div', props:{ style:{display:'flex',flexDirection:'column',width:'1280px',height:'800px',backgroundColor:BG,fontFamily:'sans-serif'}, children:[
    { type:'div', props:{ style:{display:'flex',alignItems:'center',height:'36px',backgroundColor:'#e5e7eb',borderBottom:'1px solid #d1d5db',padding:'0 12px',gap:'8px'}, children:[
      {type:'div',props:{style:{display:'flex',gap:'6px'},children:[
        {type:'div',props:{style:{width:'12px',height:'12px',borderRadius:'50%',backgroundColor:'#ef4444'}}},
        {type:'div',props:{style:{width:'12px',height:'12px',borderRadius:'50%',backgroundColor:'#f59e0b'}}},
        {type:'div',props:{style:{width:'12px',height:'12px',borderRadius:'50%',backgroundColor:'#22c55e'}}},
      ]}},
      {type:'div',props:{style:{flex:1,display:'flex',justifyContent:'center'},children:[
        {type:'div',props:{style:{backgroundColor:'white',borderRadius:'8px',padding:'4px 12px',fontSize:'11px',color:'#374151',display:'flex',alignItems:'center',gap:'6px'},children:[
          {type:'div',props:{style:{width:'10px',height:'10px',backgroundColor:'#22c55e',borderRadius:'50%'}}},
          'https://cabinetmaitreajmi.tn/#/admin — '+title
        ]}}
      ]}}
    ]}}, content
  ]}};
}
function tabs(active){
  const all=['Accueil','Cabinet','Domaines','Publications','Réservations','Messages','Galerie','Contact'];
  return { type:'div', props:{ style:{display:'flex',gap:'4px',padding:'10px 20px',backgroundColor:'white',borderBottom:'1px solid #e5e7eb',flexWrap:'wrap'}, children: all.map(t=>({
    type:'div', props:{ style:{padding:'6px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',backgroundColor:t===active?NAVY:'#f3f4f6',color:t===active?'white':'#374151',display:'flex',alignItems:'center',gap:'6px'}, children: t + (t==='Réservations'?' ③':t==='Messages'?' ②':'') }
  }))}};
}
function card(children, style={}){ return { type:'div', props:{ style:{backgroundColor:CARD,borderRadius:'12px',border:'1px solid #e5e7eb',padding:'14px',...style}, children }}; }
async function render(el, name){ const svg=await satori(el,{width:1280,height:800,fonts:fontData.length?[{name:'sans-serif',data:fontData,weight:400,style:'normal'}]:[]}); const png=new Resvg(svg,{fitTo:{mode:'width',value:1280}}).render().asPng(); fs.writeFileSync(path.join(OUT,name),png); console.log('Saved',name); }

// Cabinet
await render(chromeWrap({type:'div',props:{style:{display:'flex',flexDirection:'column',flex:1,backgroundColor:BG},children:[
  tabs('Cabinet'),
  {type:'div',props:{style:{padding:'16px 20px',display:'flex',gap:'16px',flex:1},children:[
    {type:'div',props:{style:{flex:1,display:'flex',flexDirection:'column',gap:'12px'},children:[
      card([
        {type:'div',props:{style:{fontSize:'11px',color:MUTED,textTransform:'uppercase',letterSpacing:'1px'},children:'À propos du cabinet'}},
        {type:'div',props:{style:{fontSize:'15px',fontWeight:'700',color:NAVY,marginTop:'6px'},children:'Excellence & proximité depuis 1998'}},
        {type:'div',props:{style:{fontSize:'11px',color:'#4b5563',marginTop:'6px',lineHeight:'1.5'},children:'Fondé par Me Anouar Ajmi, le cabinet accompagne entreprises et particuliers à Tunis et à l’international. 4 avocats, 6 collaborateurs, 1 engagement : défendre vos intérêts avec rigueur.'}},
        {type:'div',props:{style:{display:'flex',gap:'8px',marginTop:'10px'},children:[
          {type:'div',props:{style:{backgroundColor:'#f3f4f6',padding:'6px 10px',borderRadius:'6px',fontSize:'11px'},children:'Modifier le texte'}},
          {type:'div',props:{style:{backgroundColor:'white',border:'1px solid #e5e7eb',padding:'6px 10px',borderRadius:'6px',fontSize:'11px'},children:'Changer la photo'}},
        ]}}
      ]),
      card([
        {type:'div',props:{style:{fontSize:'12px',fontWeight:'600',color:NAVY},children:'Valeurs'}},
        {type:'div',props:{style:{display:'flex',gap:'10px',marginTop:'10px'},children:[
          {type:'div',props:{style:{flex:1,backgroundColor:'#eef2ff',borderRadius:'8px',padding:'10px',textAlign:'center'},children:[
            {type:'div',props:{style:{fontSize:'14px'},children:'🤝'}},
            {type:'div',props:{style:{fontSize:'11px',fontWeight:'600',marginTop:'4px'},children:'Confiance'}},
            {type:'div',props:{style:{fontSize:'10px',color:MUTED},children:'Relation durable'}},
          ]}},
          {type:'div',props:{style:{flex:1,backgroundColor:'#fef3c7',borderRadius:'8px',padding:'10px',textAlign:'center'},children:[
            {type:'div',props:{style:{fontSize:'14px'},children:'⚡'}},
            {type:'div',props:{style:{fontSize:'11px',fontWeight:'600',marginTop:'4px'},children:'Réactivité'}},
            {type:'div',props:{style:{fontSize:'10px',color:MUTED},children:'Réponse 24h'}},
          ]}},
          {type:'div',props:{style:{flex:1,backgroundColor:'#dcfce7',borderRadius:'8px',padding:'10px',textAlign:'center'},children:[
            {type:'div',props:{style:{fontSize:'14px'},children:'🎯'}},
            {type:'div',props:{style:{fontSize:'11px',fontWeight:'600',marginTop:'4px'},children:'Résultat'}},
            {type:'div',props:{style:{fontSize:'10px',color:MUTED},children:'Taux succès 92%'}},
          ]}},
        ]}}
      ])
    ]}},
    {type:'div',props:{style:{width:'300px',display:'flex',flexDirection:'column',gap:'10px'},children:[
      {type:'div',props:{style:{backgroundColor:'white',borderRadius:'12px',border:'1px solid #e5e7eb',padding:'12px'},children:[
        {type:'div',props:{style:{fontSize:'11px',fontWeight:'600',color:NAVY},children:'Photo du cabinet'}},
        {type:'div',props:{style:{width:'100%',height:'110px',backgroundColor:'#e0e7ff',borderRadius:'8px',marginTop:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:NAVY,fontSize:'11px'},children:'Facade Tunis Lac 2'}},
        {type:'div',props:{style:{fontSize:'10px',color:MUTED,marginTop:'6px',textAlign:'center'},children:'Glissez une nouvelle image ou cliquez'}},
      ]}},
      {type:'div',props:{style:{backgroundColor:NAVY,color:'white',borderRadius:'8px',padding:'10px',textAlign:'center',fontSize:'11px',fontWeight:'600'},children:'Publier en ligne ✓'}},
    ]}}
  ]}}
]}},'Cabinet'),'05_cabinet.png');

// Galerie
await render(chromeWrap({type:'div',props:{style:{display:'flex',flexDirection:'column',flex:1,backgroundColor:BG},children:[
  tabs('Galerie'),
  {type:'div',props:{style:{padding:'16px 20px',flex:1,display:'flex',flexDirection:'column',gap:'12px'},children:[
    {type:'div',props:{style:{display:'flex',justifyContent:'space-between',alignItems:'center'},children:[
      {type:'div',props:{style:{fontSize:'14px',fontWeight:'700',color:NAVY},children:'Galerie — 18 photos'}},
      {type:'div',props:{style:{backgroundColor:NAVY,color:'white',padding:'6px 12px',borderRadius:'6px',fontSize:'11px'},children:'+ Ajouter des photos'}},
    ]}},
    {type:'div',props:{style:{display:'flex',gap:'10px',flexWrap:'wrap'},children: Array.from({length:6}).map((_,i)=>(
      {type:'div',props:{style:{width:'186px',backgroundColor:'white',borderRadius:'10px',border:'1px solid #e5e7eb',overflow:'hidden'},children:[
        {type:'div',props:{style:{height:'90px',backgroundColor:['#ddd6fe','#bfdbfe','#fed7aa','#a7f3d0','#fbcfe8','#fef08a'][i],display:'flex',alignItems:'center',justifyContent:'center',color:NAVY,fontSize:'10px'},children:'IMG_0'+(i+1)+'.jpg'}},
        {type:'div',props:{style:{padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'},children:[
          {type:'div',props:{style:{fontSize:'11px',fontWeight:'600'},children:'Audience '+ (i+1)}},
          {type:'div',props:{style:{fontSize:'10px',color:'#dc2626'},children:'Suppr.'}},
        ]}}
      ]}}
    ))}},
    {type:'div',props:{style:{backgroundColor:'#fef3c7',border:'1px solid #fbbf24',borderRadius:'8px',padding:'8px 12px',fontSize:'11px',color:'#92400e'},children:'💡 Glissez-déposez pour réordonner. Les 6 premières photos apparaissent sur la page d’accueil.'}},
  ]}}
]}},'Galerie'),'06_galerie.png');

// Messages
await render(chromeWrap({type:'div',props:{style:{display:'flex',flexDirection:'column',flex:1,backgroundColor:BG},children:[
  tabs('Messages'),
  {type:'div',props:{style:{padding:'16px 20px',flex:1,display:'flex',flexDirection:'column',gap:'12px'},children:[
    {type:'div',props:{style:{display:'flex',gap:'8px'},children:[
      {type:'div',props:{style:{backgroundColor:NAVY,color:'white',padding:'6px 12px',borderRadius:'16px',fontSize:'11px'},children:'Tous (8)'}},
      {type:'div',props:{style:{backgroundColor:'#fef3c7',padding:'6px 12px',borderRadius:'16px',fontSize:'11px',border:'1px solid #fbbf24'},children:'Non lus (2) •'}},
      {type:'div',props:{style:{backgroundColor:'white',padding:'6px 12px',borderRadius:'16px',fontSize:'11px',border:'1px solid #e5e7eb'},children:'Archivés (3)'}},
    ]}},
    {type:'div',props:{style:{backgroundColor:'white',borderRadius:'10px',border:'1px solid #e5e7eb',overflow:'hidden'},children:[
      {type:'div',props:{style:{display:'flex',backgroundColor:'#f9fafb',padding:'8px 12px',fontSize:'10px',fontWeight:'700',color:MUTED,textTransform:'uppercase'},children:[
        {type:'div',props:{style:{width:'160px'},children:'Expéditeur'}},
        {type:'div',props:{style:{width:'90px'},children:'Date'}},
        {type:'div',props:{style:{flex:1},children:'Message'}},
        {type:'div',props:{style:{width:'80px'},children:'Statut'}},
      ]}},
      ...[
        ['Amine Cherif — am.cherif@mail.tn','Aujourd’hui','Demande de consultation en droit social…','Non lu'],
        ['Fatma Ben Youssef','Hier','Merci pour votre article sur l’arbitrage…','Lu'],
        ['Société Al Karama','02/11','Devis pour contentieux commercial…','Non lu'],
      ].map(r=>({type:'div',props:{style:{display:'flex',padding:'10px 12px',fontSize:'11px',borderTop:'1px solid #f3f4f6',alignItems:'center'},children:[
        {type:'div',props:{style:{width:'160px',fontWeight:'600',color:NAVY},children:r[0]}},
        {type:'div',props:{style:{width:'90px',color:MUTED},children:r[1]}},
        {type:'div',props:{style:{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:'#374151'},children:r[2]}},
        {type:'div',props:{style:{width:'80px'},children:[{type:'div',props:{style:{backgroundColor:r[3]==='Non lu'?'#fef3c7':'#dcfce7',color:r[3]==='Non lu'?'#92400e':'#166534',padding:'2px 6px',borderRadius:'10px',fontSize:'10px',textAlign:'center'},children:r[3]}}]}},
      ]}}))
    ]}},
    {type:'div',props:{style:{backgroundColor:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'8px 12px',fontSize:'11px',color:'#1e40af'},children:'Cliquez sur un message pour répondre directement — la réponse part à l’adresse email du client.'}}
  ]}}
]}},'Messages'),'07_messages.png');

// Contact
await render(chromeWrap({type:'div',props:{style:{display:'flex',flexDirection:'column',flex:1,backgroundColor:BG},children:[
  tabs('Contact'),
  {type:'div',props:{style:{padding:'16px 20px',display:'flex',gap:'16px',flex:1},children:[
    {type:'div',props:{style:{flex:1,display:'flex',flexDirection:'column',gap:'12px'},children:[
      card([
        {type:'div',props:{style:{fontSize:'12px',fontWeight:'700',color:NAVY},children:'Coordonnées du cabinet'}},
        ...[
          ['Adresse','Immeuble Le Consul, Lac 2 — Tunis 1053'],
          ['Téléphone','+216 71 860 123 / +216 98 456 789'],
          ['Email public','contact@cabinetmaitreajmi.tn'],
          ['Horaires','Lun–Ven 08:30–17:30 • Sam 09:00–12:00'],
        ].map(([k,v])=>({type:'div',props:{style:{display:'flex',gap:'12px',marginTop:'8px',fontSize:'11px'},children:[
          {type:'div',props:{style:{width:'90px',color:MUTED,textTransform:'uppercase',fontWeight:'600',fontSize:'10px'},children:k}},
          {type:'div',props:{style:{flex:1,backgroundColor:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 10px',color:'#1f2937'},children:v}},
        ]}}))
      ]),
      card([
        {type:'div',props:{style:{fontSize:'11px',fontWeight:'600',color:NAVY},children:'Carte & accès'}},
        {type:'div',props:{style:{width:'100%',height:'90px',backgroundColor:'#dbeafe',borderRadius:'8px',marginTop:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:NAVY,fontSize:'11px'},children:'Carte OpenStreetMap — Lac 2 (modifiable dans content.ts)'}},
      ])
    ]}},
    {type:'div',props:{style:{width:'300px',display:'flex',flexDirection:'column',gap:'10px'},children:[
      card([
        {type:'div',props:{style:{fontSize:'11px',fontWeight:'600',color:NAVY},children:'Formulaire de contact'}},
        {type:'div',props:{style:{fontSize:'10px',color:MUTED,marginTop:'4px'},children:'Les messages arrivent dans l’onglet Messages'}},
        {type:'div',props:{style:{display:'flex',flexDirection:'column',gap:'6px',marginTop:'8px'},children:[
          {type:'div',props:{style:{backgroundColor:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 8px',fontSize:'10px',color:'#9ca3af'},children:'Nom'}},
          {type:'div',props:{style:{backgroundColor:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px 8px',fontSize:'10px',color:'#9ca3af'},children:'Email'}},
          {type:'div',props:{style:{backgroundColor:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'14px 8px',fontSize:'10px',color:'#9ca3af'},children:'Message…'}},
        ]}}
      ]),
      {type:'div',props:{style:{backgroundColor:NAVY,color:'white',borderRadius:'8px',padding:'10px',textAlign:'center',fontSize:'11px',fontWeight:'600'},children:'Publier en ligne ✓'}},
    ]}}
  ]}}
]}},'Contact'),'08_contact.png');

// Médiathèque
await render(chromeWrap({type:'div',props:{style:{display:'flex',flexDirection:'column',flex:1,backgroundColor:BG},children:[
  tabs('Contact'),
  {type:'div',props:{style:{padding:'16px 20px',flex:1,display:'flex',flexDirection:'column',gap:'12px'},children:[
    {type:'div',props:{style:{display:'flex',justifyContent:'space-between',alignItems:'center'},children:[
      {type:'div',props:{style:{fontSize:'14px',fontWeight:'700',color:NAVY},children:'Médiathèque — 24 fichiers'}},
      {type:'div',props:{style:{backgroundColor:NAVY,color:'white',padding:'6px 12px',borderRadius:'6px',fontSize:'11px'},children:'Uploader un fichier'}},
    ]}},
    {type:'div',props:{style:{backgroundColor:'white',borderRadius:'10px',border:'1px solid #e5e7eb',padding:'12px'},children:[
      {type:'div',props:{style:{display:'flex',gap:'10px',flexWrap:'wrap'},children: Array.from({length:6}).map((_,i)=>(
        {type:'div',props:{style:{width:'100px',height:'90px',backgroundColor:['#e0e7ff','#fef3c7','#dcfce7','#fee2e2','#e0f2fe','#f3e8ff'][i],borderRadius:'8px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px'},children:[
          {type:'div',props:{style:{fontSize:'16px'},children:['📄','🖼️','📷','📄','🖼️','🎥'][i]}},
          {type:'div',props:{style:{fontSize:'9px',color:NAVY,fontWeight:'600'},children:['CV.pdf','Bureau.jpg','Audience.png','Jugement.pdf','Team.jpg','Intro.mp4'][i]}},
          {type:'div',props:{style:{fontSize:'8px',color:MUTED},children:['120 Ko','2.1 Mo','800 Ko','450 Ko','1.4 Mo','12 Mo'][i]}},
        ]}}
      ))}},
      {type:'div',props:{style:{fontSize:'10px',color:MUTED,marginTop:'8px',textAlign:'center'},children:'Cliquez sur Copier le lien pour insérer l’image dans une publication'}},
    ]}},
    {type:'div',props:{style:{backgroundColor:'#f9fafb',border:'1px dashed #d1d5db',borderRadius:'8px',padding:'12px',textAlign:'center',fontSize:'11px',color:MUTED},children:'Glissez vos fichiers ici ou cliquez pour parcourir — JPG, PNG, PDF acceptés (max 10 Mo)'}}
  ]}}
]}},'Médiathèque'),'09_mediatheque.png');

console.log('Second batch done');
