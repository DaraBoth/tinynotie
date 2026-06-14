# Tesseract Language Data

The `.traineddata.gz` files in this directory are excluded from git (see root `.gitignore`)
because they are binary language packs (~5 MB total).

After cloning, restore them with:

```bash
cd client-next/public/tessdata

curl -LO https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz
curl -LO https://cdn.jsdelivr.net/npm/@tesseract.js-data/kor/4.0.0_best_int/kor.traineddata.gz
curl -LO https://cdn.jsdelivr.net/npm/@tesseract.js-data/khm/4.0.0_best_int/khm.traineddata.gz
```

Keep files as `.gz` — Tesseract.js reads gzipped data natively.

| File | Language | Size |
|---|---|---|
| `eng.traineddata.gz` | English | ~2.9 MB |
| `kor.traineddata.gz` | Korean | ~1.5 MB |
| `khm.traineddata.gz` | Khmer | ~1.1 MB |

These are only needed for the offline OCR fallback in the Receipt Scanner.
If missing, Tesseract.js falls back to loading packs from jsDelivr CDN automatically.
