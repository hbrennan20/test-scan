"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ── Types ──────────────────────────────────────
type ScanRecord = {
  id: string;
  filename: string;
  text: string;
  status: "processing" | "done" | "error";
  created_at: string;
};

// ── Icons (inline to avoid deps) ───────────────
function IconScan() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" x2="7" y1="12" y2="12" /><line x1="12" x2="12" y1="12" y2="12" /><line x1="17" x2="17" y1="12" y2="12" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
function IconText() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── ScanDemo Component ────────────────────────
function ScanDemo() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append("file", file);
      const id = crypto.randomUUID();
      const ts = new Date().toISOString();
      setScans((prev) => [{ id, filename: file.name, text: "", status: "processing", created_at: ts }, ...prev]);

      try {
        const res = await fetch("/api/ocr", { method: "POST", body: formData });
        const data = await res.json();
        setScans((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, text: data.text || data.error, status: data.text ? "done" : "error" } : s,
          ),
        );
      } catch {
        setScans((prev) => prev.map((s) => (s.id === id ? { ...s, text: "Upload failed", status: "error" } : s)));
      }
    }
    setUploading(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files); },
    [handleFiles],
  );
  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) handleFiles(e.target.files); },
    [handleFiles],
  );

  return (
    <div>
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => (document.getElementById("demo-file-input") as HTMLInputElement)?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
          dragOver
            ? "border-foreground/60 bg-foreground/5 scale-[1.02]"
            : "border-border hover:border-foreground/30 hover:bg-foreground/[0.02]"
        }`}
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/5">
          <IconUpload />
        </div>
        <p className="text-xl font-semibold">{dragOver ? "Drop it right here" : "Drag your scan here"}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">or click to browse — PNG, JPEG, TIFF from your school MFD</p>
        <input id="demo-file-input" type="file" accept="image/*" multiple hidden onChange={onFileSelect} />
      </div>

      {/* Uploading indicator */}
      {uploading && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-foreground/5 px-5 py-3 text-sm text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border border-foreground/30 border-t-foreground" />
          Processing through OCR…
        </div>
      )}

      {/* Results */}
      {scans.length > 0 && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Recent scans</p>
            <p className="text-xs text-muted-foreground/60">Click a row to copy text</p>
          </div>
          <Table>
          <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">File</TableHead>
                <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Extracted text</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow
                  key={scan.id}
                  onClick={() => { if (scan.text) navigator.clipboard.writeText(scan.text); }}
                  className="cursor-pointer"
                >
                  <TableCell className="px-4 py-3 text-sm font-medium">{scan.filename}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant={scan.status === "done" ? "default" : scan.status === "error" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {scan.status === "processing" && (
                        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      )}
                      {scan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate px-4 py-3 text-sm text-muted-foreground">{scan.text || "…"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Navbar ──────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background">
            <IconScan />
          </div>
          <span className="text-lg font-semibold tracking-tight">Scan</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#try-it">
            <Button size="sm" className="rounded-xl">Try it →</Button>
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Main Page ──────────────────────────────────
export default function Home() {
  return (
    <>
      <Navbar />

      {/* ──────── Hero ──────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Background glow */}
        <div className="pointer-events-none absolute -inset-80 flex items-center justify-center opacity-20">
          <div className="h-[500px] w-[500px] rounded-full bg-foreground/10 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium">
            ✦ OCR for Irish schools
          </Badge>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Turn scanned documents into{" "}
            <span className="animate-gradient bg-gradient-to-r from-foreground via-foreground/60 to-foreground bg-clip-text text-transparent">
              editable text
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Drag in scans from your school photocopier. We extract the text with OCR so you can copy, search, and work with it — no typing required.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <a href="#try-it">
              <Button size="lg" className="h-12 rounded-xl px-8 text-base">
                Try it now
                <span className="ml-2">→</span>
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="h-12 rounded-xl px-8 text-base">
                How it works
              </Button>
            </a>
          </div>

          {/* Trust line */}
          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><IconCheck className="h-3 w-3" /> No sign-up</span>
            <span className="flex items-center gap-1.5"><IconCheck className="h-3 w-3" /> 20MB per file</span>
            <span className="flex items-center gap-1.5"><IconCheck className="h-3 w-3" /> Tesseract OCR</span>
          </div>
        </div>
      </section>

      {/* ──────── How it works ──────── */}
      <section id="how-it-works" className="border-t border-border/40 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from paper to text</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Scan at school",
                desc: "Use your school MFD to scan documents. Scan-to-email or save to a folder — either works.",
                icon: <IconScan />,
              },
              {
                step: "02",
                title: "Upload here",
                desc: "Drag the scanned images onto this page. We accept PNG, JPEG, and TIFF up to 20MB each.",
                icon: <IconUpload />,
              },
              {
                step: "03",
                title: "Get text back",
                desc: "We run Tesseract OCR on the server. Your extracted text appears instantly — click to copy.",
                icon: <IconText />,
              },
            ].map((item) => (
              <Card key={item.step} className="group relative overflow-hidden border-border/50 p-8 transition-all duration-300 hover:border-foreground/20">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 text-foreground/70 transition-colors group-hover:bg-foreground/10">
                  {item.icon}
                </div>
                <span className="mb-2 block text-xs font-medium text-muted-foreground/50">{item.step}</span>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── Features ──────── */}
      <section id="features" className="border-t border-border/40 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for the classroom</h2>
            <p className="mt-3 text-muted-foreground">No IT setup, no accounts, no fuss</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Works with any MFD", desc: "Scan-to-email, scan-to-folder, USB — whatever your school photocopier supports." },
              { title: "No account needed", desc: "Just drag and drop. No sign-up, no login, no data stored." },
              { title: "Server-side OCR", desc: "All processing happens on the server. Works on any device with a browser." },
              { title: "Click to copy", desc: "Extracted text copies to your clipboard in one click. Paste straight into a doc." },
              { title: "Multiple files", desc: "Upload several scans at once. Each one processes independently." },
              { title: "Privacy-first", desc: "Images are processed and immediately discarded. Nothing stored long-term." },
            ].map((feat) => (
              <Card key={feat.title} className="border-border/50 p-6 transition-all duration-300 hover:border-foreground/20">
                <h3 className="mb-2 font-semibold">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── Try It (Demo) ──────── */}
      <section id="try-it" className="border-t border-border/40 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-xs font-medium">
              🧪 Try it
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Scan a document now</h2>
            <p className="mt-3 text-muted-foreground">
              Grab a scan from your school MFD and drop it below
            </p>
          </div>

          <Card className="glow border-border/50 p-8">
            <ScanDemo />
          </Card>
        </div>
      </section>

      {/* ──────── Footer ──────── */}
      <footer className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground text-background">
              <IconScan />
            </div>
            <span className="font-medium text-foreground">Scan</span>
          </div>
          <p>Powered by Tesseract OCR & Next.js</p>
          <p className="text-xs">© {new Date().getFullYear()} — just a test</p>
        </div>
      </footer>
    </>
  );
}