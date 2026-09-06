"""Bangun mockup arah tab Setup memakai CSS asli situs (src/styles.css).

Output:
- design-exploration/mockups/setup-directions.html  (dokumen lengkap)
- path kedua (argumen opsional): fragmen tanpa <html>/<head>/<body> untuk
  dipublikasikan sebagai Artifact.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
site_css = (ROOT / "src/styles.css").read_text()

# Token gelap situs hanya aktif lewat data-theme="dark". Untuk pratinjau yang
# mengikuti tema sistem, gandakan blok itu di bawah prefers-color-scheme.
dark = re.search(r':root\[data-theme="dark"\] \{[^}]*\}', site_css)
dark_block = dark.group(0) if dark else ""
system_dark = (
    "@media (prefers-color-scheme: dark) {\n"
    + dark_block.replace(':root[data-theme="dark"]', ':root:not([data-theme="light"])')
    + "\n}"
    if dark_block
    else ""
)

MOCK_CSS = r"""
:root { --page-bg: #f8f9fb; }
:root[data-theme="dark"] { --page-bg: #17191c; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --page-bg: #17191c; } }
body { background: var(--page-bg); color: var(--ink); }
.mock-wrap { width: min(880px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 80px; }
.mock-intro h1 { font-size: 30px; letter-spacing: -0.03em; margin: 0 0 8px; text-wrap: balance; }
.mock-intro p { font-size: 15px; color: var(--muted); line-height: 1.7; margin: 0; max-width: 65ch; }
.mock-toc { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 18px 0 0; padding: 0; list-style: none; font-size: 14px; }
.mock-toc a { color: var(--accent); font-weight: 600; }
.variant { margin-top: 56px; }
.variant-head { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 16px; align-items: start; margin-bottom: 16px; }
.variant-letter { width: 44px; height: 44px; border-radius: 12px; background: var(--button); color: var(--button-text); font-weight: 700; font-size: 20px; display: grid; place-items: center; }
.variant-head h2 { font-size: 21px; margin: 4px 0 6px; letter-spacing: -0.02em; }
.variant-head p { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 65ch; }
.variant-head p + p { margin-top: 4px; }
.frame { border: 1px solid var(--line); border-radius: 18px; background: var(--paper); padding: 10px 32px 36px; overflow: hidden; }
.frame .tabs { margin-bottom: 0; }
.ph { display: grid; place-items: center; color: #5f6b78; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; background: linear-gradient(135deg, #d9e0e8, #eef2f6 55%, #dfe5ec); border: 1px solid var(--line); }
.ph-desk { aspect-ratio: 16 / 9; border-radius: 11px; background: linear-gradient(160deg, #c9d3de 0%, #e3e9ef 40%, #d3dbe4 70%, #bfcad6 100%); }
.ph-1 { background: linear-gradient(135deg, #d5dde6, #eef2f6); }
.ph-2 { background: linear-gradient(135deg, #dcd7cf, #f1ede6); }
.ph-3 { background: linear-gradient(135deg, #d3dcd6, #ebf0ec); }
.ph-4 { background: linear-gradient(135deg, #dad6df, #efedf3); }
.ph-5 { background: linear-gradient(135deg, #e0dcd2, #f3f0ea); }
.ph-6 { background: linear-gradient(135deg, #d0d8e2, #e9eef4); }
.mock-intro-text { font-size: 16px; line-height: 1.9; color: var(--muted); margin: 22px 0 6px; max-width: 65ch; }
/* A: kartu gear */
.gear-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 12px; }
.gear-card .ph { aspect-ratio: 4 / 3; border-radius: 11px; }
.gear-card h4 { margin: 12px 0 2px; font-size: 16px; display: flex; align-items: center; gap: 6px; }
.gear-card h4 svg { color: var(--muted); }
.gear-card p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--muted); }
/* B: lembar spesifikasi */
.spec { display: grid; grid-template-columns: 140px minmax(0, 1fr); border-top: 1px solid var(--line); margin-top: 26px; }
.spec > div { border-bottom: 1px solid var(--line); padding: 16px 0; }
.spec .cat { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); padding-top: 24px; }
.spec-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; padding: 7px 0; }
.spec-row strong { font-size: 15px; display: inline-flex; align-items: center; gap: 5px; }
.spec-row strong svg { color: var(--muted); }
.spec-row span { font-size: 14px; color: var(--muted); }
/* C: ubin seperti Gallery */
.tile-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.tile .ph { aspect-ratio: 1 / 1; border-radius: 11px; }
.tile .ph.text { font-size: 15px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink); }
.tile p { margin: 8px 0 0; font-size: 13px; color: var(--muted); }
/* D: penanda di foto meja */
.hot { position: relative; }
.dot { position: absolute; width: 26px; height: 26px; border-radius: 50%; background: var(--button); color: var(--button-text); font-size: 12px; font-weight: 700; display: grid; place-items: center; transform: translate(-50%, -50%); box-shadow: 0 0 0 3px #ffffffb3; }
.numbered { list-style: none; margin: 22px 0 0; padding: 0; }
.numbered li { display: flex; align-items: flex-start; gap: 14px; padding: 15px 0; border-bottom: 1px solid var(--line); }
.numbered .n { width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--soft); border: 1px solid var(--line); font-size: 12px; font-weight: 700; display: grid; place-items: center; margin-top: 1px; }
.numbered strong { font-size: 15px; display: inline-flex; align-items: center; gap: 5px; }
.numbered strong svg { color: var(--muted); }
.numbered p { margin: 2px 0 0; font-size: 14px; color: var(--muted); }
.mock-foot { margin-top: 56px; font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 65ch; }
@media (max-width: 760px) {
  .frame { padding: 6px 18px 28px; }
  .gear-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .spec { grid-template-columns: 1fr; }
  .spec .cat { padding-top: 16px; border-bottom: 0; padding-bottom: 0; }
  .tile-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
}
"""

ARROW = (
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    '<path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>'
)

TABS = """
<nav class="tabs" aria-label="Portfolio categories">
  <a href="#">Projects <span>1</span></a><a href="#">Experience</a><a href="#">Writing</a>
  <a href="#">About</a><a href="#" class="active" aria-current="page">Setup</a><a href="#">Gallery</a>
</nav>
"""

HEADING = """
<div class="section-heading"><h2>Setup</h2></div>
"""

DESK = '<div class="ph ph-desk">Desk photo</div>'
INTRO = '<p class="mock-intro-text">A small desk by the window. Everything below is what I use daily.</p>'

GEAR = {
    "Hardware": [
        ("BenQ 27-inch 4K", "Sharp text at 150% scaling.", True, "ph-1"),
        ("Keychron Q1", "Gateron Browns, wired.", True, "ph-2"),
        ("MX Master 3S", "Quiet clicks, one charge a month.", False, "ph-3"),
    ],
    "Software": [
        ("VS Code", "Default theme, JetBrains Mono.", True, "ph-4"),
        ("Warp", "Terminal with blocks and history.", True, "ph-5"),
        ("Raycast", "Launcher, clipboard, window tiling.", False, "ph-6"),
    ],
    "Desk": [
        ("Desk lamp", "Warm 2700K, no flicker.", False, "ph-2"),
        ("Monitor arm", "Frees the desk, eye level.", True, "ph-1"),
    ],
}


def name(title, link):
    return f"{title}{' ' + ARROW if link else ''}"


def variant_a():
    out = [DESK, INTRO]
    for group, items in GEAR.items():
        out.append(f'<div class="setup-group"><h3>{group}</h3><div class="gear-grid">')
        for title, note, link, ph in items:
            out.append(
                f'<article class="gear-card"><div class="ph {ph}">Photo</div>'
                f"<h4>{name(title, link)}</h4><p>{note}</p></article>"
            )
        out.append("</div></div>")
    return "\n".join(out)


def variant_b():
    out = [DESK, INTRO, '<div class="spec">']
    for group, items in GEAR.items():
        out.append(f'<div class="cat">{group}</div><div>')
        for title, note, link, _ in items:
            out.append(
                f'<div class="spec-row"><strong>{name(title, link)}</strong><span>{note}</span></div>'
            )
        out.append("</div>")
    out.append("</div>")
    return "\n".join(out)


def variant_c():
    out = [DESK, INTRO]
    for group, items in GEAR.items():
        out.append(f'<div class="setup-group"><h3>{group}</h3><div class="tile-grid">')
        for title, note, link, ph in items:
            text = group == "Software"
            out.append(
                f'<div class="tile"><div class="ph {ph}{" text" if text else ""}">'
                f'{title if text else "Photo"}</div><p>{title}</p></div>'
            )
        out.append("</div></div>")
    return "\n".join(out)


def variant_d():
    dots = [(28, 42), (52, 68), (66, 64), (86, 36), (14, 62)]
    numbered = [
        ("BenQ 27-inch 4K", "Sharp text at 150% scaling.", True),
        ("Keychron Q1", "Gateron Browns, wired.", True),
        ("MX Master 3S", "Quiet clicks, one charge a month.", False),
        ("Monitor arm", "Frees the desk, eye level.", True),
        ("Desk lamp", "Warm 2700K, no flicker.", False),
    ]
    out = ['<div class="hot">', DESK]
    for i, (x, y) in enumerate(dots, 1):
        out.append(f'<span class="dot" style="left:{x}%;top:{y}%">{i}</span>')
    out.append("</div>")
    out.append(INTRO)
    out.append('<ol class="numbered">')
    for i, (title, note, link) in enumerate(numbered, 1):
        out.append(
            f'<li><span class="n">{i}</span><div><strong>{name(title, link)}</strong>'
            f"<p>{note}</p></div></li>"
        )
    out.append("</ol>")
    out.append('<div class="setup-group" style="margin-top:30px"><h3>Software</h3><div class="spec" style="margin-top:8px;border-top:0">')
    out.append("<div></div><div>")
    for title, note, link, _ in GEAR["Software"]:
        out.append(
            f'<div class="spec-row"><strong>{name(title, link)}</strong><span>{note}</span></div>'
        )
    out.append("</div></div></div>")
    return "\n".join(out)


VARIANTS = [
    (
        "A",
        "Kartu gear",
        "Tiap perangkat jadi kartu berfoto (rasio 4:3) dalam grid tiga kolom, dikelompokkan per kategori. "
        "Foto meja tetap di atas sebagai pembuka.",
        "Paling menonjolkan barangnya. Butuh foto untuk hampir semua item agar grid-nya rapi.",
        variant_a,
    ),
    (
        "B",
        "Lembar spesifikasi",
        "Tanpa foto per item. Kategori di kolom kiri, daftar padat di kanan: nama tebal, catatan singkat di sampingnya. "
        "Gaya halaman /uses klasik.",
        "Paling ringkas dan cepat diisi, karena cukup nama, catatan, dan link. Foto meja menjadi satu-satunya gambar.",
        variant_b,
    ),
    (
        "C",
        "Ubin seperti Gallery",
        "Grid ubin persegi kecil seperti tab Gallery, nama di bawah ubin. Klik ubin membuka lightbox yang sama "
        "berisi catatan dan link. Item tanpa foto tampil sebagai ubin teks.",
        "Konsisten dengan Gallery, halaman tetap tenang karena catatan disembunyikan sampai diklik.",
        variant_c,
    ),
    (
        "D",
        "Penanda di foto meja",
        "Foto meja diberi nomor pada posisi tiap barang. Daftar bernomor di bawah mengikuti urutan itu; software "
        "yang tidak ada di foto masuk daftar terpisah.",
        "Paling khas untuk halaman setup. Konsekuensinya di admin: tiap item perlu ditaruh di foto dengan sekali klik.",
        variant_d,
    ),
]


def build(fragment: bool):
    parts = []
    parts.append("<title>Arah Tab Setup</title>")
    parts.append(f"<style>{site_css}\n{system_dark}\n{MOCK_CSS}</style>")
    parts.append('<div class="public-site"><div class="mock-wrap">')
    parts.append(
        '<div class="mock-intro"><h1>Empat arah untuk tab Setup</h1>'
        "<p>Semua dirender dengan CSS situs yang sekarang. Foto memakai placeholder; isi contoh diambil dari "
        "konten uji. Setiap arah memakai data yang sama: nama, catatan singkat, link, dan kategori.</p>"
        '<ul class="mock-toc">'
        + "".join(f'<li><a href="#arah-{k.lower()}">{k} · {t}</a></li>' for k, t, *_ in VARIANTS)
        + "</ul></div>"
    )
    for key, title, desc, note, fn in VARIANTS:
        parts.append(
            f'<section class="variant" id="arah-{key.lower()}">'
            f'<div class="variant-head"><div class="variant-letter">{key}</div>'
            f"<div><h2>{title}</h2><p>{desc}</p><p>{note}</p></div></div>"
            f'<div class="frame"><div class="portfolio-content">{TABS}<div class="category-content">'
            f'<section>{HEADING}{fn()}</section></div></div></div></section>'
        )
    parts.append(
        '<p class="mock-foot">Yang tetap sama di semua arah: kategori dari field Group, urutan dari Order, '
        "link membuka tab baru, dan tab tersembunyi sampai diaktifkan di Profile &amp; website.</p>"
    )
    parts.append("</div></div>")
    body = "\n".join(parts)
    if fragment:
        return body
    return (
        '<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + body.replace("<title>Arah Tab Setup</title>", "", 1).replace(
            "<style>", "<title>Arah Tab Setup</title>\n<style>", 1
        )
        + "\n</head>\n<body>\n</body>\n</html>\n"
    )


if __name__ == "__main__":
    full = build(fragment=False)
    # Pindahkan isi ke <body>: build() menaruh style di awal dokumen.
    head_end = full.index("</style>") + len("</style>")
    doc = (
        full[:head_end]
        + "\n</head>\n<body>\n"
        + full[head_end:].replace("\n</head>\n<body>\n</body>\n</html>\n", "\n</body>\n</html>\n")
    )
    (ROOT / "design-exploration/mockups/setup-directions.html").write_text(doc)
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(build(fragment=True))
    print("ok")
