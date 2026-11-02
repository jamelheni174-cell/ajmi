#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
                                Table, TableStyle, PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import Color
from PIL import Image, ImageDraw, ImageFont
import textwrap

# Colors from site theme
NAVY = HexColor("#1e2766")
NAVY_LIGHT = HexColor("#2e3d91")
PAPER = HexColor("#ece9e2")
STONE = HexColor("#dcd8cb")
AMBER = HexColor("#f59e0b")
EMERALD = HexColor("#065f46")
INK = HexColor("#1a1a1a")
BLUE = HexColor("#3b82f6")
GREY = HexColor("#64748b")

OUTPUT = "/home/user/ajmi/guide-administrateur-ajmi.pdf"
IMG_DIR = "/tmp/guide_imgs"
os.makedirs(IMG_DIR, exist_ok=True)

def make_screenshot(filename, title, subtitle, bullets=None, badge=""):
    """Generate a placeholder screenshot image"""
    W, H = 900, 500
    img = Image.new("RGB", (W, H), color=(236,233,226))
    draw = ImageDraw.Draw(img)
    # Try to load a font
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
        font_badge = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
    except:
        font_title = ImageFont.load_default()
        font_sub = font_small = font_badge = font_title

    # Header bar
    draw.rectangle([0,0,W,58], fill=(30,39,102))
    draw.text((24,18), "A.  Cabinet Me Mohamed Anouar Ajmi", fill=(174,185,236), font=font_small)
    draw.text((W-220,18), "Panneau d'Administration", fill=(255,255,255), font=font_small)
    # Title
    draw.text((30, 80), title, fill=(30,39,102), font=font_title)
    if subtitle:
        draw.text((30, 118), subtitle, fill=(100,116,139), font=font_sub)
    # Badge
    if badge:
        # badge bg
        bw = len(badge)*7 + 24
        draw.rounded_rectangle([W-bw-30, 78, W-30, 108], radius=8, fill=(46,61,145))
        draw.text((W-bw-18, 87), badge, fill=(255,255,255), font=font_badge)
    # Content area
    draw.rounded_rectangle([20, 150, W-20, H-20], radius=12, fill=(255,255,255), outline=(220,216,203), width=2)
    # Tabs mock
    tabs = ["Accueil","Cabinet","Domaines","Publications","Réservations","Galerie","Messages","Médiathèque"]
    x = 30
    for i, t in enumerate(tabs[:6]):
        is_active = (i==3 and "Publication" in title) or (i==4 and "Réservation" in title) or (i==0 and "Accueil" in title) or (i==5 and "Galerie" in title) or (i==1 and "Cabinet" in title)
        if is_active:
            draw.rounded_rectangle([x, 162, x+95, 186], radius=6, fill=(46,61,145))
            draw.text((x+12, 170), t, fill=(255,255,255), font=font_small)
        else:
            draw.text((x+12, 170), t, fill=(30,39,102), font=font_small)
        x += 100
    # Bullets inside
    if bullets:
        y = 210
        for b in bullets[:5]:
            # dot
            draw.ellipse([40, y+4, 48, y+12], fill=(46,61,145))
            # wrap
            lines = textwrap.wrap(b, width=72)
            for line in lines[:2]:
                draw.text((58, y), line, fill=(30,30,30), font=font_small)
                y += 18
            y += 8
            if y > H-40:
                break
    else:
        # generic placeholder
        draw.text((40, 240), "Aperçu de l'interface — remplacez par une capture d'écran réelle", fill=(150,150,150), font=font_small)

    # Footer publish button
    draw.rounded_rectangle([W-160, H-42, W-22, H-16], radius=8, fill=(245,158,11))
    draw.text((W-138, H-33), "Publier", fill=(0,0,0), font=font_badge)

    path = os.path.join(IMG_DIR, filename)
    img.save(path, "PNG", quality=95)
    return path

# Generate screenshots
screenshots = {}
screenshots['login'] = make_screenshot("login.png", "Connexion Administrateur", "Accès sécurisé au tableau de bord", [
    "1. Allez sur cabinetmaitreajmi.tn/#/admin",
    "2. Saisissez Email + Mot de passe",
    "3. Cliquez sur Se connecter",
    "Bandeau bleu = Backend connecté"
], badge="Login")
screenshots['accueil'] = make_screenshot("accueil.png", "Tableau de bord — Accueil", "Hero, chiffres clés et historique", [
    "Modifier le Sur-titre (Kicker), Titre et Sous-titre du Hero",
    "Ajouter / modifier les 4 chiffres clés (ex: 5 domaines d'expertise)",
    "Bouton Publier en ligne = visible immédiatement pour tous",
    "Historique : restaurer une ancienne version en 1 clic"
])
screenshots['publications'] = make_screenshot("publications.png", "Publications & Ouvrages", "Gestion de l'ouvrage 2026 et des articles", [
    "+ Ajouter une publication → Remplir Type, Titre FR/AR, ISBN, Prix",
    "Cocher Mettre en vedette pour la carte d'accueil",
    "Image couverture : /images/book-cover.jpg",
    "Glisser : ↑ Monter / ↓ Descendre pour réordonner"
], badge="Important")
screenshots['reservations'] = make_screenshot("reservations.png", "Réservations — Tableau de bord", "Suivi des commandes d'ouvrages", [
    "Filtres : Toutes / En attente / Confirmée / Livrée / Annulée",
    "Recherche par nom, téléphone ou référence RES-#",
    "Changer l'état → le client voit la mise à jour sur /#/suivi",
    "Téléphone cliquable → appel direct, Email → réponse"
], badge="RES-#")
screenshots['messages'] = make_screenshot("messages.png", "Messages de Contact", "Formulaire du site → boîte de réception", [
    "Voir les non-lus → bouton Marquer lu / Non lu",
    "Bouton Répondre → ouvre votre messagerie",
    "Supprimer après traitement",
    "Champ Compétence = domaine sélectionné par le visiteur"
])
screenshots['galerie'] = make_screenshot("galerie.png", "Galerie Photos", "Mosaïque d'images du cabinet", [
    "Titre et texte d'introduction de la section",
    "+ Téléverser des photos → redimensionnement auto (1400px max)",
    "Légende + Catégorie : tribunal / conference / russie",
    "Format portrait = grande vignette, ← → pour réordonner"
])
screenshots['domaines'] = make_screenshot("domaines.png", "Domaines d'Intervention", "5 domaines : Affaires, Famille, Médical...", [
    "N° (01-05), Titre, Description détaillée",
    "Sous-rubriques : une par ligne (ex: Création de sociétés)",
    "Boutons ↑ ↓ pour réordonner, Supprimer",
    "+ Ajouter un domaine → Publier"
])
screenshots['contact'] = make_screenshot("contact.png", "Coordonnées & Contact", "Pied de page et page Contact", [
    "Téléphone affiché + lien tel: (clic → appel)",
    "Email, LinkedIn, Adresse du cabinet à Monastir",
    "Citation de pied de page + auteur",
    "Toutes les pages utilisent ces infos automatiquement"
])

# PDF generation
styles = getSampleStyleSheet()
# Custom styles
s_title = ParagraphStyle('TitleCustom', parent=styles['Title'], fontSize=28, leading=32, textColor=NAVY, alignment=TA_LEFT, fontName='Helvetica-Bold', spaceAfter=6)
s_h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=16, leading=20, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=8, keepWithNext=True, borderPadding=(0,0,0))
s_h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, leading=16, textColor=NAVY_LIGHT, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=6)
s_h3 = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, leading=14, textColor=HexColor("#334155"), fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=4)
s_body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9.5, leading=13.5, textColor=HexColor("#1e293b"), alignment=TA_JUSTIFY, spaceAfter=6, fontName='Helvetica')
s_bullet = ParagraphStyle('Bullet', parent=s_body, leftIndent=14, firstLineIndent=0, spaceAfter=3, bulletIndent=6)
s_caption = ParagraphStyle('Caption', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=GREY, alignment=TA_CENTER, fontName='Helvetica-Oblique', spaceBefore=4, spaceAfter=10)
s_code = ParagraphStyle('Code', parent=styles['Code'], fontSize=8.5, leading=11, textColor=NAVY, backColor=HexColor("#f1f5f9"), borderPadding=(6,6,6), fontName='Courier', spaceAfter=6)
s_warning = ParagraphStyle('Warning', parent=s_body, textColor=HexColor("#92400e"), backColor=HexColor("#fffbeb"), borderPadding=(8,8,8), borderWidth=1, borderColor=HexColor("#fcd34d"), spaceAfter=8)
s_success = ParagraphStyle('Success', parent=s_body, textColor=HexColor("#065f46"), backColor=HexColor("#ecfdf5"), borderPadding=(8,8,8), borderWidth=1, borderColor=HexColor("#6ee7b7"), spaceAfter=8)
s_cover_sub = ParagraphStyle('CoverSub', parent=styles['Normal'], fontSize=10, leading=14, textColor=white, alignment=TA_CENTER, fontName='Helvetica', spaceAfter=2)
s_cover_title = ParagraphStyle('CoverTitle', parent=styles['Title'], fontSize=32, leading=34, textColor=white, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4)
s_cover_small = ParagraphStyle('CoverSmall', parent=styles['Normal'], fontSize=8, leading=10, textColor=HexColor("#aeb9ec"), alignment=TA_CENTER, fontName='Helvetica', spaceAfter=0)
s_toc = ParagraphStyle('TOC', parent=styles['Normal'], fontSize=9.5, leading=13, textColor=NAVY, fontName='Helvetica', spaceAfter=3)
s_footer = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, leading=9, textColor=GREY, alignment=TA_CENTER, fontName='Helvetica')

def header_footer(canvas, doc):
    canvas.saveState()
    # Top line
    canvas.setStrokeColor(STONe if 'STONe' in dir() else STONE)
    canvas.setStrokeColor(STONE)
    canvas.setLineWidth(0.5)
    canvas.line(15*mm, 287*mm, 195*mm, 287*mm)
    # Header text
    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(GREY)
    canvas.drawString(15*mm, 290*mm, "Cabinet Me Mohamed Anouar Ajmi — Guide Administrateur")
    canvas.drawRightString(195*mm, 290*mm, "cabinetmaitreajmi.tn")
    # Footer
    canvas.setFont("Helvetica", 6.5)
    canvas.drawCentredString(105*mm, 10*mm, f"Page {doc.page}  •  Confidentiel — Usage interne Cabinet Ajmi  •  Novembre 2026")
    # Bottom line
    canvas.setStrokeColor(STONE)
    canvas.line(15*mm, 12*mm, 195*mm, 12*mm)
    canvas.restoreState()

def cover_header_footer(canvas, doc):
    pass  # No header/footer on cover

# Build story
story = []

# --- COVER PAGE ---
# Full page navy background
# We'll simulate with a table covering page
cover_data = [
    [Paragraph('<font color="#aeb9ec" size=8>◉ CABINET D’AVOCAT &nbsp;•&nbsp; MONASTIR — TUNISIE</font>', s_cover_small)],
    [Spacer(1, 18*mm)],
    [Paragraph('Guide<br/>Administrateur', ParagraphStyle('CoverBig', parent=s_cover_title, fontSize=44, leading=44, textColor=white, alignment=TA_CENTER, fontName='Helvetica-Bold'))],
    [Paragraph('Site officiel du Cabinet<br/>Me Mohamed Anouar Ajmi', ParagraphStyle('CoverMid', parent=s_cover_sub, fontSize=13, leading=16, textColor=HexColor("#aeb9ec"), alignment=TA_CENTER, fontName='Helvetica'))],
    [Spacer(1, 6*mm)],
    [HRFlowable(width="18%", thickness=1.2, lineCap='round', color=AMBER, spaceBefore=4, spaceAfter=6, hAlign='CENTER', vAlign='BOTTOM')],
    [Spacer(1, 6*mm)],
    [Paragraph('Gérez votre site en toute autonomie :<br/>contenus, ouvrages, réservations, messages et galerie', ParagraphStyle('CoverDesc', parent=s_cover_sub, fontSize=9.5, leading=13, textColor=white, alignment=TA_CENTER, fontName='Helvetica'))],
    [Spacer(1, 14*mm)],
    # Credentials box
    [Table(
        [[Paragraph('<font color="#1e2766"><b>Accès administrateur</b><br/><br/>URL : <font color="#2563eb">https://cabinetmaitreajmi.tn/#/admin</font><br/>Email : <font color="#1e2766">ajmianouar259@gmail.com</font><br/>Mot de passe : <font color="#1e2766">ajmianouar123A</font></font>', ParagraphStyle('Cred', parent=s_body, fontSize=9, leading=12, textColor=NAVY, alignment=TA_LEFT))]],
        colWidths=[82*mm], style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), white),
            ('ROUNDEDCORNERS', [6,6,6,6]),
            ('BOX', (0,0), (-1,-1), 0.8, HexColor("#dcd8cb")),
            ('INNERPADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ])
    )],
    [Spacer(1, 8*mm)],
    [Paragraph('Version 1.0 — Novembre 2026 &nbsp;•&nbsp; Support : contact.anouarajmi@gmail.com<br/>Document confidentiel — ne pas diffuser', s_cover_small)],
]
# Create a table for cover with navy bg via canvas
# We'll add a custom onFirstPage that paints navy

def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0,0,A4[0],A4[1], stroke=0, fill=1)
    # decorative line top
    canvas.setStrokeColor(AMBER)
    canvas.setLineWidth(1.2)
    canvas.line(15*mm, 285*mm, 195*mm, 285*mm)
    canvas.restoreState()

# Use simple cover with bg
# Add cover content via story with spacers to position
story.append(Spacer(1, 42*mm))
for row in cover_data:
    # row is already a flowable or list
    if isinstance(row, list):
        for el in row:
            story.append(el)
    else:
        story.append(row)
# Add page break after cover
story.append(PageBreak())

# --- TOC ---
story.append(Paragraph('Sommaire', s_title))
story.append(HRFlowable(width="100%", thickness=1, color=STONe if 'STONe' in globals() else STONE, spaceAfter=8, spaceBefore=4))
toc_items = [
    ("1", "Connexion à l’administration", "3"),
    ("2", "Vue d’ensemble de l’interface", "4"),
    ("3", "Modifier la page d’accueil (Hero & Chiffres)", "5"),
    ("4", "Gérer le Cabinet & la citation", "6"),
    ("5", "Domaines d’intervention", "7"),
    ("6", "Publications & Ouvrage 2026 (le plus important)", "8"),
    ("7", "Réservations — suivre & confirmer les commandes", "10"),
    ("8", "Messages des visiteurs", "11"),
    ("9", "Galerie photos", "12"),
    ("10", "Contact & coordonnées", "13"),
    ("11", "Publier, historique et sauvegardes", "14"),
    ("12", "Bonnes pratiques & dépannage", "15"),
]
toc_data = []
for num, title, pg in toc_items:
    toc_data.append([Paragraph(f'<b>{num}.</b>', ParagraphStyle('num', parent=s_toc, alignment=TA_RIGHT)), Paragraph(title, s_toc), Paragraph(pg, ParagraphStyle('pg', parent=s_toc, alignment=TA_RIGHT))])
t = Table(toc_data, colWidths=[10*mm, 130*mm, 12*mm])
t.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 2),
    ('RIGHTPADDING', (0,0), (-1,-1), 2),
    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ('LINEBELOW', (0,0), (-1,-2), 0.4, HexColor("#e2e8f0")),
]))
story.append(t)
story.append(Spacer(1, 6*mm))
story.append(Paragraph('Astuce : gardez ce PDF dans un dossier sécurisé. Le mot de passe administrateur y figure en clair pour votre première connexion — changez-le dès que possible (p. 14).', ParagraphStyle('Astuce', parent=s_warning, fontSize=8.5, leading=11)))
story.append(PageBreak())

# Helper to add section
def add_section(number, title, intro, image_path=None, caption=None):
    story.append(Paragraph(f'<font color="#2e3d91">{number}</font> &nbsp; {title}', s_h1))
    story.append(HRFlowable(width="100%", thickness=0.8, color=AMBER, spaceAfter=6, spaceBefore=2, hAlign='LEFT'))
    if intro:
        story.append(Paragraph(intro, s_body))
    if image_path and os.path.exists(image_path):
        story.append(Spacer(1, 3*mm))
        # Image with border
        img = RLImage(image_path, width=170*mm, height=95*mm)
        img.hAlign = 'CENTER'
        story.append(img)
        if caption:
            story.append(Paragraph(caption, s_caption))

# 1. Connexion
add_section("01", "Connexion à l’administration", "L’administration est l’espace privé où vous modifiez tout le site. Seul le titulaire des identifiants peut y accéder. L’adresse est identique sur ordinateur, tablette ou téléphone.", screenshots['login'], "Figure 1 — Écran de connexion. Bandeau bleu = « Backend connecté »")
story.append(Paragraph("Accès", s_h2))
story.append(Paragraph("Ouvrez dans votre navigateur : <b>https://cabinetmaitreajmi.tn/#/admin</b><br/>Saisissez :", s_body))
creds = [
    ["Email", "ajmianouar259@gmail.com"],
    ["Mot de passe", "ajmianouar123A"],
]
ct = Table([[Paragraph(f"<b>{k}</b>", s_body), Paragraph(f"<font face=\"Courier\" color=\"#1e2766\">{v}</font>", s_body)] for k,v in creds], colWidths=[28*mm, 120*mm])
ct.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), HexColor("#f1f5f9")),
    ('BOX', (0,0), (-1,-1), 0.6, STONE),
    ('INNERGRID', (0,0), (-1,-1), 0.4, STONE),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
]))
story.append(ct)
story.append(Spacer(1, 3*mm))
story.append(Paragraph("Cliquez sur <b>Se connecter</b>. Si les identifiants sont corrects, vous arrivez sur le tableau de bord. En cas d’erreur « Identifiants incorrects », vérifiez les majuscules du mot de passe (le « A » final est en majuscule).", s_body))
story.append(Paragraph("Premier réflexe : changer le mot de passe après la première connexion (voir p. 14).", s_warning))

# 2. Vue d'ensemble
add_section("02", "Vue d’ensemble de l’interface", "Le bandeau supérieur bleu nuit (#1e2766) est présent sur toutes les pages admin. Il vous indique l’état de connexion et donne accès aux actions globales.", screenshots['accueil'], "Figure 2 — Bandeau supérieur et barre d’onglets")
story.append(Paragraph("Repères", s_h2))
bullets = [
    "<b>● En ligne · synchronisé</b> = le site et l’admin sont connectés au serveur. Toute modification est enregistrée en base et visible par les visiteurs après clic sur <b>Publier en ligne</b>.",
    "<b>○ Mode local autonome</b> = vous n’êtes pas connecté (hors ligne ou session expirée). Les modifications sont enregistrées localement dans votre navigateur — reconnectez-vous pour les publier.",
    "<b>Publier en ligne</b> (bouton ambre en haut à droite) : enregistre et diffuse immédiatement. <b>Ne quittez jamais la page sans cliquer sur Publier</b>.",
    "<b>Voir le site ↗</b> : ouvre le site public dans un nouvel onglet pour vérifier le rendu.",
    "<b>Déconnexion</b> : termine la session. Vous devrez ressaisir Email/Mot de passe au prochain accès.",
]
for b in bullets:
    story.append(Paragraph(f"• &nbsp;{b}", s_bullet))
story.append(Paragraph("Les onglets", s_h2))
story.append(Paragraph("Les onglets sont au nombre de 13. Les 11 premiers (Accueil → Contact) gèrent le contenu public. Les 2 derniers (<b>Messages</b> et <b>Médiathèque</b>) n’apparaissent que <b>En ligne</b> car ils lisent la base serveur. Les réservations affichent une pastille <b>3 en attente</b> quand de nouvelles commandes arrivent.", s_body))

# 3. Accueil Hero & Chiffres
add_section("03", "Modifier la page d’accueil (Hero & Chiffres)", "La première chose que voient vos visiteurs est la section Hero (kicker + titre + accroche). Juste en dessous, les 4 chiffres clés résument l’activité.", screenshots['accueil'], "Figure 3 — Onglet Accueil : Hero, chiffres et historique des versions")
story.append(Paragraph("Onglet <b>Accueil</b>", s_h2))
story.append(Paragraph("• <b>Sur-titre (Kicker)</b> : petite ligne au-dessus du titre, ex : « Avocat près la Cour d’Appel — Monastir »<br/>• <b>Titre principal</b> + <b>Titre en italique</b> : les deux parties du grand titre (ex : Rigueur + <i>Engagement</i>)<br/>• <b>Sous-titre / Accroche</b> : phrase sous le titre (2-3 lignes maximum)<br/>• <b>Chiffres clés</b> : valeur (ex : 5) + libellé (ex : domaines d’expertise) — utilisez <b>+ Ajouter un chiffre</b> pour en créer un 5e, ou ✕ pour supprimer", s_body))
story.append(Paragraph("Historique des publications", s_h2))
story.append(Paragraph("En mode En ligne, cliquez sur <b>Charger l’historique</b> : les 10 dernières versions publiées s’affichent. Cliquez sur <b>Restaurer</b> pour recharger une ancienne version, puis <b>Publier en ligne</b> pour la remettre en ligne. Utile en cas d’erreur.", s_body))

# 4. Cabinet
add_section("04", "Gérer le Cabinet & la citation", "Cette section présente le cabinet et Maître Ajmi juste sous le Hero. Elle est cruciale pour le référencement et la confiance.", screenshots['contact'], "Figure 4 — Onglet Cabinet : textes de présentation et citation")
story.append(Paragraph("Onglet <b>Cabinet</b>", s_h2))
story.append(Paragraph("• <b>Titre de section</b> : ex : Le Cabinet & Maître Mohamed Anouar Ajmi<br/>• <b>Paragraphe 1 & 2</b> : texte de présentation (copiez-collez depuis Word, le gras est conservé)<br/>• <b>Citation mise en avant</b> : phrase en italique affichée en grand au milieu de la page<br/><br/>Astuce : gardez des paragraphes de 4-5 lignes maximum pour la lecture sur mobile.", s_body))
story.append(Paragraph("Onglet <b>Avocat</b> (profil)", s_h2))
story.append(Paragraph("• <b>Portrait</b> : cliquez sur <b>Changer le portrait</b> pour téléverser une nouvelle photo (format portrait 4/5 recommandé, 800×1000 px). L’ancienne est remplacée.<br/>• <b>Nom, Titre principal/secondaire</b> : affichés sous le portrait<br/>• <b>Texte « Valeurs »</b> + liste <b>Disponibilité, Réactivité…</b> : modifiables via <b>+ Ajouter</b> / ✕", s_body))

# 5. Domaines
add_section("05", "Domaines d’intervention", "Les 5 domaines (Affaires, Famille, Médical, Biens, Contrats) sont affichés en grille sur la page d’accueil et en détail sur la page Compétences.", screenshots['domaines'], "Figure 5 — Onglet Domaines : N°, titre, description et sous-rubriques")
story.append(Paragraph("Onglet <b>Domaines</b>", s_h2))
story.append(Paragraph("Chaque domaine est une carte :<br/>• <b>N°</b> : 01 à 05 (affiché en petit)<br/>• <b>Titre</b> : ex : Droit des affaires<br/>• <b>Description détaillée</b> : 2-3 phrases<br/>• <b>Sous-rubriques</b> : une par ligne, ex :<br/><font face=\"Courier\" size=8>Création de sociétés &amp; startups<br/>Droit social<br/>Contentieux commercial</font><br/>Utilisez <b>↑ ↓</b> pour réordonner, <b>Supprimer</b> pour retirer, <b>+ Ajouter un domaine</b> pour créer le 6e.", s_body))
story.append(Paragraph("Onglet <b>Compétences</b> & <b>Clients</b>", s_h2))
story.append(Paragraph("Même principe : liste de mots-clés. Pour les clients, le logo est géré via la Médiathèque : le nom doit correspondre au fichier image (ex : logo-asf.jpg).", s_body))

# 6. Publications - LE PLUS IMPORTANT
add_section("06", "Publications & Ouvrage 2026", "C’est l’onglet le plus utilisé : il gère l’ouvrage majeur 2026 et tous les articles/policy briefs. Chaque publication devient une page dédiée avec bouton « Commander ».", screenshots['publications'], "Figure 6 — Onglet Publications : 5 formulaires, l’ouvrage en vedette est signalé")
story.append(Paragraph("Onglet <b>Publications</b>", s_h2))
story.append(Paragraph("<b>Publication #1 — [OUVRAGE EN VEDETTE]</b> : c’est votre ouvrage principal. Il apparaît en grand sur la page d’accueil et au centre de la page Publications. <b>Ne le supprimez pas</b>, modifiez-le.", s_body))
details = [
    "<b>Identifiant Route (slug)</b> : <font face=\"Courier\">ouvrage-2026</font> → URL devient <font face=\"Courier\">/publication/ouvrage-2026</font> — ne mettez que des minuscules, chiffres et tirets.",
    "<b>Type / Catégorie</b> : ex : Ouvrage Majeur 2026, Article de Doctrine, Policy Brief, Prix Scientifique.",
    "<b>Titre Français</b> + <b>Titre Arabe (optionnel)</b> : le titre arabe s’affiche en grand, en RTL, sous le type.",
    "<b>Référence / Éditeur</b> : ex : Latrach Édition — Tunis, 2026 (Loi n°32...) — affiché en petit sous le titre.",
    "<b>Code ISBN</b> : 978-9938-20-976-1 — affiché dans le bloc tarifaire noir.",
    "<b>Prix public</b> : ex : 12 TND (12 د.ت) — en ambre dans la fiche tarifaire.",
    "<b>Chemin Image Couverture</b> : <font face=\"Courier\">/images/book-cover.jpg</font> — l’image doit exister dans <b>Médiathèque</b> ou <b>public/images/</b>.",
    "<b>Résumé détaillé</b> : 4-5 phrases maximum, visible sur la page de détail.",
]
for d in details:
    story.append(Paragraph(f"• &nbsp;{d}", s_bullet))
story.append(Paragraph("Mettre en vedette", s_h3))
story.append(Paragraph("Cochez <b>Mettre en vedette (Carte d’Accueil)</b> pour qu’une publication apparaisse dans la section « Publications » de l’accueil (max 3, les 3 premières de la liste).", s_body))
story.append(Paragraph("Ordre", s_h3))
story.append(Paragraph("Utilisez <b>↑ Monter / ↓ Descendre</b> pour réordonner. L’ordre dans l’admin = l’ordre sur le site. Cliquez sur <b>Publier en ligne</b> après chaque changement.", s_body))
story.append(Paragraph("Publier une nouvelle publication", s_h3))
story.append(Paragraph("Cliquez sur <b>+ Ajouter une publication</b> (bouton bleu nuit en haut à droite), remplissez les champs, puis <b>Publier en ligne</b>. La page est immédiatement accessible à l’adresse <font face=\"Courier\">/publication/votre-slug</font>.", s_body))

# 7. Réservations - CRITIQUE
add_section("07", "Réservations — suivre & confirmer les commandes", "Dès qu’un visiteur clique sur « Commander / Réserver cet ouvrage » sur une page de publication, sa commande arrive ici. C’est votre outil de vente.", screenshots['reservations'], "Figure 7 — Onglet Réservations : filtres, recherche et changement d’état")
story.append(Paragraph("Onglet <b>Réservations</b>", s_h2))
story.append(Paragraph("Chaque commande affiche :<br/>• <b>Référence</b> : <font face=\"Courier\">RES-#A1B2C3</font> (code à transmettre au client pour suivi)<br/>• <b>Badges d’état</b> : <font color=\"#92400e\"><b>En attente</b></font> (ambre) → <font color=\"#1e40af\"><b>Confirmée</b></font> (bleu) → <font color=\"#065f46\"><b>Livrée</b></font> (vert) ou <font color=\"#991b1b\"><b>Annulée</b></font> (rouge)<br/>• <b>Date</b>, <b>Ouvrage</b>, <b>Quantité</b><br/>• <b>Client</b> : Nom, Téléphone (cliquable → appel direct), Email, Adresse, Remarques (dédicace...)", s_body))
story.append(Paragraph("Actions", s_h3))
actions = [
    "<b>Filtres</b> : cliquez sur « Toutes », « En attente », « Confirmée »... pour n’afficher qu’un état. Le compteur <b>3 en attente</b> (pastille ambre) s’affiche sur l’onglet.",
    "<b>Recherche</b> : tapez nom, téléphone ou référence (ex : C68F9C) pour retrouver une commande.",
    "<b>Changer l’état</b> : liste déroulante à droite de chaque carte. Dès que vous passez en <b>Confirmée</b> ou <b>Livrée</b>, le client voit la mise à jour sur <b>/#/suivi</b> s’il saisit son code.",
    "<b>Supprimer</b> : bouton rouge — efface définitivement la réservation (demande confirmation).",
    "<b>Actualiser</b> : recharge la liste depuis le serveur (utile après une nouvelle commande).",
]
for a in actions:
    story.append(Paragraph(f"• &nbsp;{a}", s_bullet))
story.append(Paragraph("Suivi côté client", s_h3))
story.append(Paragraph("Le client saisit son code sur <b>https://cabinetmaitreajmi.tn/#/suivi</b> (ex : RES-#C68F9C ou simplement C68F9C, avec ou sans accent). Il ne voit que <b>sa</b> réservation, pas les autres. Communiquez-lui ce code par SMS/WhatsApp après confirmation.", s_body))
story.append(Paragraph("Bonnes pratiques", s_h3))
story.append(Paragraph("• Passez en <b>Confirmée</b> dès que vous avez appelé le client et validé adresse/paiement.<br/>• Passez en <b>Livrée</b> une fois l’ouvrage remis.<br/>• Gardez les réservations <b>En attente</b> à zéro : c’est votre indicateur d’action.", s_body))

# 8. Messages
add_section("08", "Messages des visiteurs", "Les messages du formulaire de contact (page Contact) arrivent ici en temps réel. Vous recevez les demandes de consultation, questions et prises de RDV.", screenshots['messages'], "Figure 8 — Onglet Messages : non-lus, réponse et suppression")
story.append(Paragraph("Onglet <b>Messages</b> (uniquement En ligne)", s_h2))
story.append(Paragraph("En haut : <b>X message(s) · Y non lu(s)</b> + boutons <b>Voir les non-lus</b> / <b>Actualiser</b>. Chaque carte affiche : Nom (badge <b>Nouveau</b> si non lu), Date, Compétence choisie, Email, Téléphone, et le message complet.", s_body))
msgs = [
    "<b>Répondre</b> (bordure pierre) → ouvre votre messagerie (mailto) avec l’email du demandeur.",
    "<b>Marquer lu / Non lu</b> → fait disparaître le badge Nouveau et décrémente le compteur.",
    "<b>Supprimer</b> → efface définitivement le message (confirmation).",
]
for m in msgs:
    story.append(Paragraph(f"• &nbsp;{m}", s_bullet))
story.append(Paragraph("Confidentialité : seuls les administrateurs connectés voient les messages. Ils ne sont jamais publiés sur le site.", s_body))

# 9. Galerie
add_section("09", "Galerie photos", "La galerie « En images » (page d’accueil + page Expériences) est alimentée par cet onglet. C’est une mosaïque à 3 colonnes.", screenshots['galerie'], "Figure 9 — Onglet Galerie : ajout par glisser-déposer et édition des légendes")
story.append(Paragraph("Onglet <b>Galerie</b>", s_h2))
story.append(Paragraph("• <b>Titre + Texte d’introduction</b> : affichés en haut de la section Galerie.<br/>• <b>+ Téléverser des photos</b> : cliquez, sélectionnez plusieurs fichiers (JPG/PNG, max 6 Mo chacun). Le site redimensionne automatiquement à 1400 px max — aucune retouche nécessaire.<br/>• <b>Légende</b> : texte court sous l’image (ex : Colloque Tunis 2024)<br/>• <b>Catégorie</b> : <font face=\"Courier\">tribunal</font> | <font face=\"Courier\">conference</font> | <font face=\"Courier\">russie</font> — permet de filtrer dans la future page Galerie<br/>• <b>Format portrait</b> : cochez pour une grande vignette (2x hauteur)<br/>• <b>← →</b> : réordonner, <b>Supprimer</b> : retirer", s_body))
story.append(Paragraph("Astuce : téléversez d’abord les 6-8 meilleures photos, puis ajoutez les autres au fil de l’actualité. Cliquez sur <b>Publier en ligne</b> après chaque ajout.", s_body))

# 10. Contact
add_section("10", "Contact & coordonnées", "Toutes les coordonnées du cabinet sont centralisées ici et répercutées automatiquement sur : le pied de page, la page Contact, et le bloc « Nous serions fiers de vous accompagner ».", screenshots['contact'], "Figure 10 — Onglet Contact : téléphone, email, adresse et citation")
story.append(Paragraph("Onglet <b>Contact</b>", s_h2))
story.append(Paragraph("• <b>Téléphone (affiché)</b> : ex : +216 54 311 937 — tel que les visiteurs le voient<br/>• <b>Téléphone (lien tel:)</b> : <font face=\"Courier\">tel:+21654311937</font> — sans espaces, avec +216 — permet l’appel en 1 clic sur mobile<br/>• <b>Email</b> : contact.anouarajmi@gmail.com — cliquable partout<br/>• <b>LinkedIn</b> : URL complète vers le profil<br/>• <b>Adresse</b> : Beb Brikcha – Résidence El Mabrouk, Bureau n°9, Monastir<br/>• <b>Citation de pied de page</b> + <b>Auteur</b> : ex : « La justice est la vérité en action. » — Joseph Joubert", s_body))
story.append(Paragraph("Après modification, cliquez sur <b>Publier en ligne</b> et vérifiez en ouvrant <b>Voir le site ↗</b> sur mobile.", s_body))

# 11. Publier, historique, sauvegardes
add_section("11", "Publier, historique et sauvegardes", "Comprendre la différence entre « Enregistrer » et « Publier » est essentiel pour ne rien perdre.")
story.append(Paragraph("Le bouton central", s_h2))
story.append(Paragraph("• <b>En mode En ligne · synchronisé</b> : le bouton s’appelle <b>Publier en ligne</b> (ambre). Il enregistre en base serveur + rend visible par tous les visiteurs. Un toast « Publié en ligne ✓ » confirme.<br/>• <b>En mode hors ligne</b> : il s’appelle <b>Enregistrer</b> et n’enregistre que dans votre navigateur (localStorage). Reconnectez-vous et cliquez sur <b>Publier en ligne</b> pour diffuser.", s_body))
story.append(Paragraph("Historique (onglet Accueil)", s_h2))
story.append(Paragraph("Cliquez sur <b>Charger l’historique</b> : les 20 dernières publications s’affichent avec date et auteur. Cliquez sur <b>Restaurer</b> pour recharger une version, puis <b>Publier en ligne</b> pour la remettre en ligne. C’est votre « Ctrl+Z » permanent.", s_body))
story.append(Paragraph("Exporter / Importer", s_h2))
story.append(Paragraph("En haut du bandeau : <b>Exporter</b> télécharge un fichier <font face=\"Courier\">cabinet-ajmi-contenu.json</font> (tout le site en JSON). Gardez-en une copie mensuelle. <b>Importer</b> permet de restaurer ce fichier sur un autre navigateur ou après une réinstallation.", s_body))
story.append(Paragraph("Réinitialiser", s_h3))
story.append(Paragraph("Bouton rouge <b>Réinitialiser</b> : remet tout le contenu d’usine (defaut du code). <b>Attention : demande confirmation, mais irréversible si vous publiez ensuite.</b> À n’utiliser qu’en cas de corruption.", s_body))
story.append(Paragraph("Médiathèque", s_h2))
story.append(Paragraph("Onglet <b>Médiathèque</b> (En ligne) : liste toutes les images téléversées via <b>Galerie</b> ou <b>Publications</b>. Vous pouvez copier leur URL (<font face=\"Courier\">/uploads/123-...jpg</font>) pour l’utiliser dans une publication, ou la supprimer.", s_body))

# 12. Bonnes pratiques
add_section("12", "Bonnes pratiques & dépannage", "Quelques règles pour que le site reste rapide, sécurisé et bien référencé.")
story.append(Paragraph("Sécurité", s_h2))
secs = [
    "<b>Changez le mot de passe</b> après la première connexion : dans l’admin, allez sur <b>Serveur</b> (en haut à droite) → <b>Changer le mot de passe</b> ou utilisez la page <b>/admin/setup</b> en cas d’oubli (voir README). Choisissez 12 caractères minimum.",
    "<b>Déconnectez-vous</b> après chaque session sur un ordinateur partagé (bouton Déconnexion).",
    "<b>Supprimez</b> <font face=\"Courier\">install.php</font> et <font face=\"Courier\">check.php</font> du File Manager s’ils sont encore présents (ils l’étaient lors du diagnostic — c’est fait).",
    "<b>Ne partagez jamais</b> le token JWT (dans localStorage) — il donne accès admin.",
]
for s in secs:
    story.append(Paragraph(f"• &nbsp;{s}", s_bullet))
story.append(Paragraph("Performance", s_h2))
story.append(Paragraph("• Images : privilégiez JPG < 1 Mo, le site redimensionne mais plus c’est léger, plus c’est rapide.<br/>• Vidéos : ne les hébergez pas sur InfinityFree — déposez-les sur YouTube et collez le lien dans la description.<br/>• Sauvegarde : une fois par mois, <b>Exporter</b> + copier le dossier <font face=\"Courier\">uploads/</font> via FTP/File Manager.", s_body))
story.append(Paragraph("Problèmes courants", s_h2))
probs = [
    ["Le site affiche une ancienne version", "Videz le cache du navigateur (Ctrl+F5) et vérifiez que vous avez bien cliqué sur <b>Publier en ligne</b> (pas seulement Enregistrer)."],
    ["« Backend déconnecté » ou bandeau gris", "Votre session a expiré ou le serveur est injoignable. Reconnectez-vous. Vérifiez <b>check.php</b> si vous l’avez remis (tout doit être vert)."],
    ["Image qui ne s’affiche pas", "Vérifiez que le fichier est dans <b>Médiathèque</b> et que <b>uploads/</b> est en 755. Le chemin doit commencer par <font face=\"Courier\">/uploads/</font> ou <font face=\"Courier\">/images/</font>."],
    ["Réservation introuvable sur /suivi", "Le client doit saisir le code exact <b>RES-#...</b> ou les 6 caractères hex (ex : C68F9C). Vérifiez dans l’admin que la réservation est bien en « En attente » et non supprimée."],
    ["Mot de passe oublié", "Voir php/README.md section Dépannage : créez un fichier <font face=\"Courier\">reset.php</font> temporaire avec le snippet fourni, ouvrez-le, puis supprimez-le immédiatement."],
]
for q,a in probs:
    story.append(Paragraph(f"<b>{q}</b>", ParagraphStyle('Q', parent=s_body, fontName='Helvetica-Bold', textColor=NAVY, spaceAfter=2)))
    story.append(Paragraph(a, s_body))
story.append(Paragraph("Support", s_h2))
story.append(Paragraph("Pour toute modification technique (nom de domaine, HTTPS, mise à jour du site) : contactez le développeur avec une capture d’écran et l’URL exacte de la page. Conservez ce PDF dans un lieu sûr.", s_body))
story.append(Paragraph("Merci pour votre confiance. Le Cabinet Ajmi est désormais autonome pour faire vivre son site.", ParagraphStyle('Thanks', parent=s_body, alignment=TA_CENTER, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=10)))
story.append(Spacer(1, 4*mm))
story.append(Paragraph("— Cabinet d’Avocat Me Mohamed Anouar Ajmi —<br/>Beb Brikcha – Résidence El Mabrouk, Bureau n°9, Monastir — Tunisie<br/>Tél. +216 54 311 937 — contact.anouarajmi@gmail.com — avocatmedanouarajmi.com", ParagraphStyle('Foot', parent=s_caption, alignment=TA_CENTER, textColor=GREY)))

# Build PDF
doc = SimpleDocTemplate(OUTPUT, pagesize=A4, leftMargin=15*mm, rightMargin=15*mm, topMargin=18*mm, bottomMargin=14*mm, title="Guide Administrateur - Cabinet Ajmi", author="Cabinet Me Mohamed Anouar Ajmi")
# Need to handle first page bg differently
# We'll build with custom onLaterPages for header/footer and first page bg
# For cover we want navy bg - we simulated with table but need to paint bg before

# To get cover bg we need to use a trick: create doc with page templates? Simpler: just build normally, cover will be white with navy header from earlier but we added navy via cover_bg function earlier not used
# Let's implement proper page func

def on_first_page(canvas, doc):
    # Paint navy bg for cover
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0,0,A4[0],A4[1], stroke=0, fill=1)
    # gold line top
    canvas.setStrokeColor(AMBER)
    canvas.setLineWidth(1.2)
    canvas.line(15*mm, 285*mm, 195*mm, 285*mm)
    # footer small
    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(HexColor("#aeb9ec"))
    canvas.drawCentredString(105*mm, 12*mm, "Document confidentiel — Cabinet Ajmi • Novembre 2026")
    canvas.restoreState()

def on_later_pages(canvas, doc):
    header_footer(canvas, doc)

# Need to set story with page breaks already, but first page is cover
# We'll do doc.build with arg
# However story[0] is Spacer for cover - we need to ensure cover_bg only for page 1
# So we need to split: first page is cover, rest is normal

# Build with two-phase: we already have story with PageBreak after cover
# Use doc.build with onFirstPage and onLaterPages
doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
print(f"PDF généré : {OUTPUT} ({os.path.getsize(OUTPUT)//1024} Ko)")
