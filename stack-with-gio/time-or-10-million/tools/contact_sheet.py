# Build a labelled contact sheet from PNG frames. Usage: python3 tools/contact_sheet.py out.png cols frame1.png [frame2.png ...]
# Draws the safe area (x 100–900, y 230–1490) as a thin outline when SAFE=1 is set.
import os, re, sys
from PIL import Image, ImageDraw, ImageFont
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw, th = 324, 576
font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 22)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 12) + 12, rows * (th + 46) + 12), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, fp in enumerate(files):
    im = Image.open(fp).convert('RGB')
    if os.environ.get('SAFE') == '1':
        ImageDraw.Draw(im).rectangle([100, 230, 900, 1490], outline=(255, 60, 160), width=3)
    im = im.resize((tw, th), Image.LANCZOS)
    x, y = 12 + (i % cols) * (tw + 12), 12 + (i // cols) * (th + 46)
    sheet.paste(im, (x, y))
    m = re.search(r'(\d+)\.png$', fp)
    n = int(m.group(1)) if m else i
    d.text((x, y + th + 8), f'f{n}  {n / 30:.2f}s', fill=(230, 230, 230), font=font)
sheet.save(out)
