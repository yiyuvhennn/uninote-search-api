import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function getUploadDirectory() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

export function parseStoredPdfReference(fileUrl: string | null | undefined) {
  if (!fileUrl?.startsWith("uploaded-pdf:")) return null;

  const [, storageName, encodedOriginalName] = fileUrl.split(":");
  if (!storageName || !/^[a-f0-9-]+\.pdf$/i.test(storageName)) return null;

  return {
    storageName,
    originalName: encodedOriginalName
      ? decodeURIComponent(encodedOriginalName)
      : "document.pdf",
    absolutePath: path.join(getUploadDirectory(), storageName),
  };
}

export async function savePdfFile(buffer: Buffer, originalName: string) {
  const storageName = `${randomUUID()}.pdf`;
  const directory = getUploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storageName), buffer, { flag: "wx" });

  return `uploaded-pdf:${storageName}:${encodeURIComponent(originalName)}`;
}

export async function removeStoredPdf(fileUrl: string | null | undefined) {
  const reference = parseStoredPdfReference(fileUrl);
  if (!reference) return;

  try {
    await unlink(reference.absolutePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
}
