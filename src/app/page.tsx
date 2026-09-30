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

// ── Icons ──────────────────────────────────────
function IconScan({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
  );
}
function IconUpload({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
function IconText({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </svg>
  );
}
function IconTick({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconRocket({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 18H12v-4a2 2 0 0 1 2-2h-4v-4a2 2 0 0 1-2-2H-4v6" /><line x1="6" x2="6" y1="12" y2="4" /><ellipse cx="6" cy="4" rx="3" ry="2" /><polyline points="3 16 9 19 3 19" />
    </svg>
  );
}

// ── ScanUpload Component ──────────────────────
function ScanUpload() {
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
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => (document.getElementById("scan-input") as HTMLInputElement)?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
          dragOver
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/40 hover:bg-primary/5"
        }`}
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <IconUpload className="h-8 w-8 text-primary" />
        </div>
        <p className="text-xl font-semibold">{dragOver ? "Drop them here" : "Drag in student scans"}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">or click to browse — PNG, JPEG, TIFF from your school MFD</p>
        <input id="scan-input" type="file" accept="image/*" multiple hidden onChange={onFileSelect} />
      </div>

      {uploading && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/60 bg-primary/5 px-5 py-3 text-sm text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border border-primary/30 border-t-primary" />
          Reading and correcting…
        </div>
      )}

      {scans.length > 0 && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Recent corrections</p>
            <p className="text-xs text-muted-foreground/60">Click a row to copy text</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Student</TableHead>
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
                      {scan.status === "done" ? "corrected" : scan.status}
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

// ── Navbar ────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconScan className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Grade</span>
        </a>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#try-it">
            <Button size="sm" className="rounded-lg">Try it →</Button>
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

      {/* ────── Hero ────── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
        {/* Background glow */}
        <div className="pointer-events-none absolute -inset-80 flex items-center justify-center opacity-20">
          <div className="h-[600px] w-[600px] rounded-full bg-primary/15 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 rounded-full px-5 py-1.5 text-xs font-medium tracking-wide text-accent">
            <IconRocket className="inline-block h-3 w-3 mr-1.5" />
            For Irish primary & secondary teachers
          </Badge>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Scan student work.
            <br />
            <span className="animate-gradient bg-gradient-to-r from-primary via-primary/50 to-accent bg-clip-text text-transparent">
              Auto-correct in seconds.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Upload scanned assignments from your school photocopier. We extract every word with OCR so you can review, copy, and mark without retyping a thing.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <a href="#try-it">
              <Button size="lg" className="h-12 rounded-xl px-8 text-base font-medium">
                Try it now
                <span className="ml-2">→</span>
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="h-12 rounded-xl px-8 text-base font-medium text-foreground">
                How it works
              </Button>
            </a>
          </div>

          <div className="mt-14 flex items-center justify-center gap-8 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1.5"><IconTick className="h-3.5 w-3.5 text-accent" /> No sign-up</span>
            <span className="flex items-center gap-1.5"><IconTick className="h-3.5 w-3.5 text-accent" /> 20MB per file</span>
            <span className="flex items-center gap-1.5"><IconTick className="h-3.5 w-3.5 text-accent" /> OCR by Tesseract</span>
            <span className="flex items-center gap-1.5"><IconTick className="h-3.5 w-3.5 text-accent" /> Nothing stored</span>
          </div>
        </div>
      </section>

      {/* ────── How It Works ────── */}
      <section id="how-it-works" className="border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from paper to corrected text</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: "01", title: "Scan at school", desc: "Use your school MFD to scan a batch of student assignments. Scan-to-email or save to a folder.", icon: <IconScan /> },
              { num: "02", title: "Upload here", desc: "Drag the scanned images onto this page. We accept PNG, JPEG, and TIFF — up to 20 MB each.", icon: <IconUpload /> },
              { num: "03", title: "Read & correct", desc: "We run OCR on every page. The extracted text appears instantly — click to copy or paste into your marking scheme.", icon: <IconText /> },
            ].map((item) => (
              <Card key={item.num} className="group relative overflow-hidden border-border/60 p-8 transition-all duration-300 hover:border-primary/30">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  {item.icon}
                </div>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground/50">{item.num}</span>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Features ────── */}
      <section id="features" className="border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Built for the staffroom</h2>
            <p className="mt-3 text-muted-foreground">No IT setup, no accounts, no extra hardware</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Works with any MFD", desc: "Scan-to-email, scan-to-folder, USB — whatever your school photocopier supports, it works." },
              { title: "Batch upload", desc: "Scan a whole class set and upload them all at once. Each assignment processes independently." },
              { title: "No sign-up needed", desc: "No login, no setup, no IT request. Just open the page and drag in your scans." },
              { title: "Click to copy", desc: "Extracted text copies to your clipboard in one click. Paste straight into your marking scheme or LMS." },
              { title: "Works in any browser", desc: "All processing runs on the server. Use it on a Chromebook, iPad, or staff-room PC." },
              { title: "Privacy-first", desc: "Images are processed and immediately discarded. Nothing stored long-term — ever." },
            ].map((feat) => (
              <Card key={feat.title} className="border-border/60 p-6 transition-all duration-300 hover:border-primary/30">
                <h3 className="mb-2 font-semibold text-foreground">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Try It ────── */}
      <section id="try-it" className="border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4 rounded-full px-5 py-1.5 text-xs font-medium text-accent">
              🧪 Try it
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Try it with a real scan</h2>
            <p className="mt-3 text-muted-foreground">
              Grab a student assignment from your school MFD and drop it below
            </p>
          </div>

          <Card className="glow border-border/60 p-8">
            <ScanUpload />
          </Card>
        </div>
      </section>

      {/* ────── Footer ────── */}
      <footer className="border-t border-border/60 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <IconScan className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground">Grade</span>
          </div>
          <p className="text-muted-foreground/70">Powered by Tesseract OCR & Next.js</p>
          <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} — just a test</p>
        </div>
      </footer>
    </>
  );
}