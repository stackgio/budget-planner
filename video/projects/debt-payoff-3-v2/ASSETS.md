# V2 footage and licences

All footage is **Adobe Stock, free tier, licensed on 2026-10-29 to the connected Adobe account** (Adobe for creativity connector, `asset_license_and_download_stock`). Every asset is marked `isGenTech: false` by Adobe Stock, meaning it is not AI-generated. No AI imagery, no screenshots, no fabricated account screens.

The media files are **not committed**. `public/debt-payoff-3-v2/stock/` is gitignored so licensed stock isn't redistributed as standalone files. The rendered MP4, with the footage embedded in the edit, is committed.

| Asset ID | Adobe Stock title (abridged) | Source | Used for | Crop / note |
|---|---|---|---|---|
| 407052217 | Hands using calculator, paying credit-card debt and bills | 3840×2160 ProRes | Hook | 9:16 window x=1080 |
| 314073589 | Credit card surface extreme close-up (mock-up card, sample numbers) | 1920×1080 | "3 things", step 3 | x=120; **1080p source cropped to 608 px wide, so it is soft when upscaled** |
| 216482306 | Coins fall into a glass jar on dollar bills (slow motion) | 1920×1080 | Step 1, $0→$500 | x=560; same softness caveat |
| 477125265 | Close-up of a flat car tyre on the road (photo) | 5760×3840 JPEG | Flat tyre, outcome background | Still with Ken Burns move |
| 315023474 | Mechanic changing a tyre at a repair station | 3840×2160 ProRes | "Surprise bill" | x=737, exposure lifted |
| 1028222252 | Vertical clock time-lapse, day to night | 1080×1920 | Step 2 title, overtime | Native vertical |
| 1332873009 | Delivery courier holding food bags (vertical) | 1080×1920 ProRes | Extra shifts / delivery | Native vertical |
| 230058613 | Hands taping a parcel box | 3840×2160 MJPEG | Sell what you don't use, weekly graphic | x=930 |
| 480504243 | Paying with a credit card on a phone | 3840×2160 ProRes 50p | "+$300 new purchase" | x=930 |
| 290773630 | Back view of a man walking down a street | 3840×2160 | "I'm working toward debt-free" | x=1697 |
| 573461741 | Man at sunset in the city (golden hour) | 3840×2160 50p | Closing lines, CTA background | x=900 |

**Rebuilding the proxies:** license and download each ID again with the Adobe connector (re-licensing an owned asset only refreshes the URL). Save them as `<id>.mov` / `<id>.jpg` in one folder, then run `bash scripts/v2-prep-stock.sh <folder>`.

**Not available / not used:**
- No free Adobe Stock *video* of a flat tyre exists, so a still photo stands in.
- No footage of you. The narration is first person ("I'm working toward becoming debt-free myself"), and stock actors stand in for you.
- Pexels, Unsplash, Pixabay and Wikimedia are blocked by this environment's network policy.
- No voiceover was supplied.
