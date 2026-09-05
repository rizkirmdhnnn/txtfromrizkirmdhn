"""Generate a dependency-free, explicitly labelled demonstration CV PDF."""

from pathlib import Path

lines = [
    ("DEMO CV", 11),
    ("Achmad Rizki Ramadhan", 24),
    ("Fullstack Developer | Cloud Enthusiast", 12),
    ("Yogyakarta, Indonesia", 11),
    ("", 12),
    ("PROFILE", 12),
    ("Building applications, cloud infrastructure, and solving problems with AI.", 10),
    ("", 12),
    ("PUBLIC PROJECTS", 12),
    ("Mailriz: persistent email aliases on Cloudflare (Worker, D1, R2).", 10),
    ("R2 x macOS: JuiceFS, Redis, Docker, and SMB.", 10),
    ("dsh-tool-notify: AI agent completion notifications.", 10),
    ("", 12),
    ("LINKS", 12),
    ("github.com/rizkirmdhnnn", 10),
    ("linkedin.com/in/achmadrizkirmdhn", 10),
    ("", 12),
    ("This is a demo based on public profile data and owner-provided information.", 9),
    ("Employment history and certifications have not yet been supplied.", 9),
]
stream = "BT\n"
y = 785
for text, size in lines:
    text = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream += f"/F1 {size} Tf 1 0 0 1 48 {y} Tm ({text}) Tj\n"
    y -= size + 14
stream += "ET"
objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    f"<< /Length {len(stream.encode())} >>\nstream\n{stream}\nendstream",
]
out = b"%PDF-1.4\n"
offsets = [0]
for i, obj in enumerate(objects, 1):
    offsets.append(len(out))
    out += f"{i} 0 obj\n{obj}\nendobj\n".encode()
xref = len(out)
out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
for offset in offsets[1:]:
    out += f"{offset:010d} 00000 n \n".encode()
out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
Path("seed-assets").mkdir(exist_ok=True)
Path("seed-assets/cv-demo.pdf").write_bytes(out)
