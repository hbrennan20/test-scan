# Scan

Upload scanned documents from school MFDs (multi-function devices) and extract text via OCR.

Built with Next.js 16 + shadcn/ui + Tesseract OCR.

## Tech

- **Next.js 16** — App router, Turbopack
- **shadcn/ui** — Card, Table, Badge, Dialog components
- **Tesseract** — Server-side OCR via system `tesseract`

## Quickstart

```bash
npm install
npm run dev      # http://localhost:3000
```

## API

`POST /api/ocr` — upload an image, get back extracted text.

```bash
curl -F "file=@scan.jpeg" http://localhost:3000/api/ocr
# → { "text": "extracted content..." }
```