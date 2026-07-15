import path from "node:path";

const PDF_MAGIC_NUMBER = "%PDF-";

/**
 * validatePdfExtension
 *
 * 檢查使用者上傳的檔名是否以 .pdf 結尾，避免只靠瀏覽器提供的 mimetype 判斷檔案。
 */
export function validatePdfExtension(filename: string) {
  return path.extname(filename).toLowerCase() === ".pdf";
}

/**
 * validatePdfMimeType
 *
 * 檢查 multer 取得的 mimetype 是否為 application/pdf。
 */
export function validatePdfMimeType(mimetype: string) {
  return mimetype === "application/pdf";
}

/**
 * validatePdfMagicNumber
 *
 * 檢查檔案內容開頭是否符合 PDF magic number：%PDF-。
 */
export function validatePdfMagicNumber(buffer: Buffer) {
  return buffer.subarray(0, PDF_MAGIC_NUMBER.length).toString("utf8") === PDF_MAGIC_NUMBER;
}

/**
 * sanitizeOriginalFilename
 *
 * 將原始檔名轉成安全、可記錄的檔名，避免直接信任使用者提供的路徑或特殊字元。
 */
export function sanitizeOriginalFilename(filename: string) {
  const baseName = path.basename(filename).trim();
  const parsed = path.parse(baseName);
  const safeStem = parsed.name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 120);
  const safeExt = parsed.ext.toLowerCase() === ".pdf" ? ".pdf" : "";

  return `${safeStem || "uploaded"}${safeExt}`;
}
