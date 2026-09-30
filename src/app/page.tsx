"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";

type ScanRecord = {
  id: string;
  filename: string;
  text: string;
  status: "processing" | "done" | "error";
  created_at: string;
};

export default function Home() {
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

      const placeholder: ScanRecord = {
        id: crypto.randomUUID(),
        filename: file.name,
        text: "",
        status: "processing",
        created_at: new Date().toISOString(),
      };
      setScans((prev) => [placeholder, ...prev]);

      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        setScans((prev) =>
          prev.map((s) =>
            s.id === placeholder.id
              ? { ...s, text: data.text || data.error, status: data.text ? "done" : "error" }
              : s,
          ),
        );
      } catch {
        setScans((prev) =>
          prev.map((s) =>
            s.id === placeholder.id ? { ...s, text: "Upload failed", status: "error" } : s,
          ),
        );
      }
    }

    setUploading(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
    },
    [handleFiles],
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Scan</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload scanned documents from your school MFD and extract text with OCR
        </p>
      </div>

      {/* Upload dropzone */}
      <Card className="mb-10">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => (document.getElementById("file-input") as HTMLInputElement)?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <div className="mb-4 text-6xl">📄</div>
          <p className="text-xl font-semibold">
            {dragOver ? "Drop files here" : "Click or drag scanned images here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PNG, JPEG, TIFF from your school photocopier
          </p>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onFileSelect}
          />
        </div>
      </Card>

      {/* Uploading indicator */}
      {uploading && (
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Processing scans through OCR...</p>
          </div>
        </Card>
      )}

      {/* Results table */}
      {scans.length > 0 && (
        <Card>
          <div className="px-6 py-4">
            <h2 className="mb-2 text-xl font-semibold">Recent scans</h2>
            <p className="text-sm text-muted-foreground">
              Click a row to copy the extracted text
            </p>
          </div>
          <Table>
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  File
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                  Extracted text
                </th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr
                  key={scan.id}
                  onClick={() => {
                    if (scan.text) navigator.clipboard.writeText(scan.text);
                  }}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-muted/20"
                >
                  <td className="px-6 py-3 text-sm font-medium">{scan.filename}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={
                        scan.status === "done"
                          ? "default"
                          : scan.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {scan.status}
                    </Badge>
                  </td>
                  <td className="max-w-md truncate px-6 py-3 text-sm text-muted-foreground">
                    {scan.text || "..."}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        Powered by Tesseract OCR &middot; All processing happens on the server
      </footer>
    </div>
  );
}