import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    // Save to temp directory
    const tmpDir = "/tmp";
    const ext = file.name.split(".").pop() || "png";
    const inputPath = path.join(tmpDir, `scan_${Date.now()}.${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    // Run Tesseract OCR
    const text = execSync(`tesseract "${inputPath}" stdout -l eng 2>/dev/null`, {
      timeout: 30_000,
    });
    const decoded = text.toString("utf-8").trim();

    // Cleanup
    try { fs.unlinkSync(inputPath); } catch {}

    if (!decoded) {
      return NextResponse.json({ error: "No text detected in image" }, { status: 422 });
    }

    return NextResponse.json({ text: decoded });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OCR processing failed" },
      { status: 500 },
    );
  }
}

export const bodyParserSizeLimit = "20mb";
export const maxDuration = 30;