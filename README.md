# Grade

Upload scanned student assignments from school MFDs and auto-correct with OCR.

Built for Irish primary & secondary teachers. Inter type, blue tech palette.

## Tech

- **Next.js 16** — App router, Turbopack
- **shadcn/ui** — Card, Table, Badge components
- **Inter** typeface by Rasmus Andersson
- **Tesseract** — Server-side OCR

## Quickstart

```bash
npm install
npm run dev      # http://localhost:3000
```

## API

`POST /api/ocr` — upload an image, get back extracted text.

```bash
curl -F "file=@assignment.jpeg" http://localhost:3000/api/ocr
# → { "text": "extracted content..." }
```