#!/usr/bin/env python3
"""ARCHIVE — veille tech hebdo. Générateur statique (stdlib uniquement).

Usage : python3 build.py
Lit editions/*.json, écrit public/ (index.html, edition-AAAA-MM-JJ.html, assets/).
Chaque édition : {edition, date, title{fr,en}, deck{fr,en}, hero{src,alt{fr,en}}, news[]}.
Chaque news : {id, category{fr,en}, date, title{fr,en}, body{fr,en}, learning{fr,en}, media{type:image|video|gif, src, poster?, alt}, source{name,url}, also?{name,url}}
"""
import json, os, re, shutil, random, html, glob, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'public')
ASSETS = os.path.join(ROOT, 'assets')
SITE_URL = 'https://veille-tech.netlify.app'

MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
MOIS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

def esc(s):
    return html.escape(str(s), quote=True)

def date_fr(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} {MOIS_FR[d.month - 1]} {d.year}"

def date_en(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{MOIS_EN[d.month - 1]} {d.day}, {d.year}"

def bi(obj, tag='span', cls=''):
    """Rend un objet {fr,en} en deux spans commutés par CSS."""
    c = f' class="{cls}"' if cls else ''
    return (f'<{tag}{c} data-l="fr">{obj["fr"]}</{tag}>'
            f'<{tag}{c} data-l="en">{obj["en"]}</{tag}>')

def bi_esc(obj, tag='span', cls=''):
    return bi({'fr': esc(obj['fr']), 'en': esc(obj['en'])}, tag, cls)

def logo_svg(cls=''):
    raw = open(os.path.join(ASSETS, 'logo.svg'), encoding='utf-8').read()
    raw = re.sub(r'<\?xml.*?\?>', '', raw, flags=re.S)
    raw = re.sub(r'<metadata>.*?</metadata>', '', raw, flags=re.S)
    raw = re.sub(r'<!--.*?-->', '', raw, flags=re.S)
    raw = re.sub(r'<defs>.*?</defs>', '', raw, flags=re.S)
    raw = raw.replace('class="st0"', '')
    raw = re.sub(r'<svg[^>]*>', lambda m: re.sub(r'\s(id|version|xmlns)="[^"]*"', '', m.group(0)).replace('<svg', f'<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ARCHIVE"{(" class=" + chr(34) + cls + chr(34)) if cls else ""}', 1), raw, count=1)
    return raw.strip()

def speckles_svg(seed=1745, w=1600, h=1000):
    """Usure de pellicule : rayures verticales fines, poussières, grain léger. Déterministe, discret."""
    import math
    rnd = random.Random(seed)
    parts = []
    # rayures verticales (fines, longues, très légères)
    for _ in range(9):
        x = rnd.uniform(0, w); y0 = rnd.uniform(-100, h * 0.6); L = rnd.uniform(120, 620)
        op = rnd.uniform(0.05, 0.14); sw = rnd.choice([0.5, 0.6, 0.8])
        parts.append(f'<line x1="{x:.1f}" y1="{y0:.1f}" x2="{x + rnd.uniform(-1.5, 1.5):.1f}" y2="{y0 + L:.1f}" stroke="#EDE7DC" stroke-opacity="{op:.2f}" stroke-width="{sw}"/>')
    # poussières et petits éclats
    for _ in range(46):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        op = rnd.uniform(0.18, 0.5)
        if rnd.random() < 0.7:
            parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(0.4, 1.1):.2f}" fill="#EDE7DC" fill-opacity="{op:.2f}"/>')
        else:
            k = rnd.randint(4, 6); base = rnd.uniform(1.0, 2.2); pts = []
            for i in range(k):
                a = i / k * 6.2832; rr = base * rnd.uniform(0.5, 1.4)
                pts.append(f'{x + rr * math.cos(a):.1f},{y + rr * math.sin(a):.1f}')
            parts.append(f'<polygon points="{" ".join(pts)}" fill="#EDE7DC" fill-opacity="{op:.2f}"/>')
    # cheveux (courbes fines)
    for _ in range(4):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        parts.append(f'<path d="M{x:.1f},{y:.1f} q{rnd.uniform(-14, 14):.1f},{rnd.uniform(-20, 20):.1f} {rnd.uniform(-30, 30):.1f},{rnd.uniform(-36, 36):.1f}" fill="none" stroke="#EDE7DC" stroke-opacity="0.22" stroke-width="0.6"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{"".join(parts)}</svg>')

def grain_svg():
    """Tuile de grain (bruit) très légère, répétée en fond."""
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">'
            '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>'
            '<feColorMatrix values="0 0 0 0 0.93 0 0 0 0 0.9 0 0 0 0 0.86 0 0 0 0.06 0"/></filter>'
            '<rect width="240" height="240" filter="url(#g)"/></svg>')

BG_IMAGE = ''

def head(title, desc, canonical, og_image=''):
    og = f'<meta property="og:image" content="{esc(og_image)}">' if og_image else ''
    bgs = f'<style>:root{{--bg-grain:url("{esc(BG_IMAGE)}")}}</style>' if BG_IMAGE else ''
    return f'''<!DOCTYPE html>
<html lang="fr" data-lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
{og}
<link rel="canonical" href="{esc(canonical)}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Astloch:wght@400;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
{bgs}
<script>try{{var l=localStorage.getItem('archive-lang');if(l==='en'||l==='fr'){{document.documentElement.setAttribute('data-lang',l);document.documentElement.setAttribute('lang',l);}}}}catch(e){{}}</script>
</head>
<body>'''

def topbar(home=True):
    brand = '' if home else f'<a class="brand" href="index.html" aria-label="ARCHIVE, accueil">{logo_svg()}<span data-l="fr">Veille tech</span><span data-l="en">Tech watch</span></a>'
    if home:
        brand = '<div class="brand"><span data-l="fr">Veille tech hebdo</span><span data-l="en">Weekly tech watch</span></div>'
    return f'''<div class="topbar">
  {brand}
  <div class="lang" role="group" aria-label="Langue">
    <button type="button" data-set="fr" aria-pressed="true">FR</button>
    <button type="button" data-set="en" aria-pressed="false">EN</button>
  </div>
</div>'''

def footer():
    y = datetime.date.today().year
    return f'''<footer class="foot">
  <div><span data-l="fr">ARCHIVE · veille tech hebdomadaire · IA, gaming tech, robotique</span><span data-l="en">ARCHIVE · weekly tech watch · AI, gaming tech, robotics</span></div>
  <div class="r"><a href="index.html"><span data-l="fr">Éditions</span><span data-l="en">Issues</span></a><span>Karl Petzold · {y}</span></div>
</footer>
<script src="assets/site.js"></script>'''

def media_html(m, alt=''):
    t = m.get('type', 'image')
    if t == 'slideshow' and m.get('srcs'):
        labels = m.get('labels') or []
        imgs = ''.join(
            f'<img src="{esc(u)}" alt="{esc(alt)}" loading="lazy" decoding="async"{" class=on" if i == 0 else ""}>'
            + (f'<span class="lbl"{" data-on" if i == 0 else ""}>{esc(labels[i])}</span>' if i < len(labels) else '')
            for i, u in enumerate(m['srcs']))
        return f'<div class="media slides" data-slides>{imgs}</div>'
    src = m.get('src', '')
    if not src:
        return '<div class="media"></div>'
    if t == 'video':
        poster = f' poster="{esc(m["poster"])}"' if m.get('poster') else ''
        inner = f'<video data-auto muted loop playsinline preload="metadata"{poster} aria-label="{esc(alt)}"><source src="{esc(src)}" type="video/mp4"></video>'
    else:
        inner = f'<img src="{esc(src)}" alt="{esc(alt)}" loading="lazy" decoding="async">'
    return f'<div class="media">{inner}</div>'

def news_html(n, idx):
    src = n['source']; also = n.get('also')
    also_html = f'<a href="{esc(also["url"])}" target="_blank" rel="noopener">{esc(also["name"])}</a>' if also else ''
    return f'''<article class="news reveal" id="{esc(n['id'])}">
  <div class="text">
    <div class="eyebrow">{bi_esc(n['category'])}<span class="sep">/</span><span class="date"><span data-l="fr">{date_fr(n['date'])}</span><span data-l="en">{date_en(n['date'])}</span></span></div>
    <h2>{bi_esc(n['title'])}</h2>
    <p class="body">{bi_esc(n['body'])}</p>
    <p class="learning">{bi_esc(n['learning'])}</p>
    <div class="src"><span class="lbl"><span data-l="fr">Source</span><span data-l="en">Source</span></span><a href="{esc(src['url'])}" target="_blank" rel="noopener">{esc(src['name'])}</a>{also_html}</div>
  </div>
  {media_html(n['media'], n['media'].get('alt', ''))}
</article>'''

def edition_page(ed, prev_ed, next_ed):
    hero = ed.get('hero', {})
    hero_img = f'<img src="{esc(hero["src"])}" alt="{esc(hero.get("alt", {}).get("fr", ""))}">' if hero.get('src') else ''
    news = '\n'.join(news_html(n, i) for i, n in enumerate(ed['news']))
    def nav(e, label_fr, label_en, cls):
        if not e:
            return f'<span class="dis"><span data-l="fr">{label_fr}</span><span data-l="en">{label_en}</span></span>'
        return f'<a class="{cls}" href="edition-{e["date"]}.html"><span data-l="fr">{label_fr} · N° {e["edition"]}</span><span data-l="en">{label_en} · No. {e["edition"]}</span></a>'
    title = f"ARCHIVE N° {ed['edition']} · {ed['title']['fr']}"
    return f'''{head(title, ed['deck']['fr'], f"{SITE_URL}/edition-{ed['date']}.html", hero.get('src', ''))}
{topbar(home=False)}
<header class="hero-ed">
  {hero_img}
  <div class="inner">
    <div class="n">{num3(ed)}</div>
    <h1>{bi_esc(ed['title'])}</h1>
    <p class="deck">{bi_esc(ed['deck'])}</p>
    <div class="meta"><span><b data-l="fr">{date_fr(ed['date'])}</b><b data-l="en">{date_en(ed['date'])}</b></span><span>{len(ed['news'])} <span data-l="fr">news</span><span data-l="en">stories</span></span></div>
  </div>
</header>
<main class="wrap news-list">
{news}
<nav class="ednav">
  {nav(prev_ed, 'Édition précédente', 'Previous issue', 'prev')}
  <a href="index.html"><span data-l="fr">Toutes les éditions</span><span data-l="en">All issues</span></a>
  {nav(next_ed, 'Édition suivante', 'Next issue', 'next')}
</nav>
</main>
{footer()}
</body>
</html>'''

def num3(ed):
    return str(int(ed['edition'])).zfill(3)

def tags_html(ed):
    return '<ul class="tags">' + ''.join(f'<li>{esc(n.get("tag") or n["category"]["fr"])}</li>' for n in ed['news']) + '</ul>'

def index_page(eds):
    latest = eds[0]
    def block(ed, featured):
        hero = ed.get('hero', {})
        img = f'<img src="{esc(hero["src"])}" alt="" loading="{"eager" if featured else "lazy"}" decoding="async">' if hero.get('src') else ''
        href = f'edition-{ed["date"]}.html'
        date = f'<span data-l="fr">{date_fr(ed["date"])}</span><span data-l="en">{date_en(ed["date"])}</span>'
        if featured:
            return f'''<article class="card card-hero reveal">
  <a class="media" href="{href}" aria-label="N° {ed['edition']}">{img}</a>
  <div class="content">
    <div class="num">{num3(ed)}</div>
    <div class="eyebrow"><span data-l="fr">Dernière édition</span><span data-l="en">Latest issue</span><span class="sep">/</span><span class="date">{date}</span></div>
    <h3><a href="{href}">{bi_esc(ed['title'])}</a></h3>
    {tags_html(ed)}
    <a class="cta" href="{href}"><span data-l="fr">Lire l'édition</span><span data-l="en">Read the issue</span><i aria-hidden="true"></i></a>
  </div>
</article>'''
        return f'''<article class="card card-past reveal">
  <a class="media" href="{href}" aria-label="N° {ed['edition']}">{img}</a>
  <div class="content">
    <div class="num">{num3(ed)}</div>
    <div class="eyebrow"><span class="date">{date}</span></div>
    <h3><a href="{href}">{bi_esc(ed['title'])}</a></h3>
    {tags_html(ed)}
    <a class="cta" href="{href}"><span data-l="fr">Lire l'édition</span><span data-l="en">Read the issue</span><i aria-hidden="true"></i></a>
  </div>
</article>'''
    blocks = '\n'.join(block(e, i == 0) for i, e in enumerate(eds))
    desc = 'ARCHIVE, veille tech hebdomadaire : IA, gaming tech, robotique. Quatre à six news par semaine, lues en trois minutes.'
    return f'''{head('ARCHIVE · veille tech hebdo', desc, SITE_URL + '/', latest.get('hero', {}).get('src', ''))}
{topbar(home=True)}
<header class="hero-game" id="hero">
  <canvas id="c-back" aria-hidden="true"></canvas>
  <div class="logo">{logo_svg()}</div>
  <canvas id="c-front" aria-hidden="true"></canvas>
  <div class="flash" aria-hidden="true"></div>
  <div class="gameover" aria-live="polite">
    <div class="line" data-line></div>
    <div class="sub"><span data-l="fr">Score</span><span data-l="en">Score</span> <b data-score>000</b></div>
    <button type="button" class="again"><span data-l="fr">Réessayer</span><span data-l="en">Try again</span></button>
  </div>
</header>
<main class="wrap editions">
  <div class="head reveal"><h2><span data-l="fr">Éditions</span><span data-l="en">Issues</span></h2><span class="count">{len(eds)} <span data-l="fr">numéro{"s" if len(eds) > 1 else ""}</span><span data-l="en">issue{"s" if len(eds) > 1 else ""}</span></span></div>
  {blocks}
</main>
{footer()}
<script src="assets/game.js"></script>
</body>
</html>'''

def main():
    files = sorted(glob.glob(os.path.join(ROOT, 'editions', '*.json')))
    eds = [json.load(open(f, encoding='utf-8')) for f in files]
    eds.sort(key=lambda e: e['date'], reverse=True)
    if not eds:
        raise SystemExit('Aucune édition dans editions/')
    global BG_IMAGE
    for e in eds:
        if e.get('background', {}).get('src'):
            BG_IMAGE = e['background']['src']; break
    os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
    for name in ('style.css', 'game.js', 'site.js', 'logo.svg', 'favicon.svg'):
        p = os.path.join(ASSETS, name)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(OUT, 'assets', name))
    open(os.path.join(OUT, 'assets', 'speckles.svg'), 'w', encoding='utf-8').write(speckles_svg())
    open(os.path.join(OUT, 'assets', 'grain.svg'), 'w', encoding='utf-8').write(grain_svg())
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index_page(eds))
    for i, ed in enumerate(eds):
        newer = eds[i - 1] if i > 0 else None
        older = eds[i + 1] if i + 1 < len(eds) else None
        open(os.path.join(OUT, f'edition-{ed["date"]}.html'), 'w', encoding='utf-8').write(edition_page(ed, older, newer))
    print(f"OK · {len(eds)} édition(s) → public/ (index.html + {' '.join('edition-' + e['date'] + '.html' for e in eds)})")

if __name__ == '__main__':
    main()
