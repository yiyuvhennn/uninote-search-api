import { PDFParse } from "pdf-parse";

export class PdfParseError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PdfParseError";
    this.statusCode = statusCode;
  }
}

/**
 * extractTextFromPdf
 *
 * 接收 multer 上傳後存在記憶體的 PDF buffer，並嘗試擷取文字。
 * 這裡只支援文字型 PDF；掃描圖片型 PDF 不做 OCR，會回傳清楚錯誤訊息。
 */
export async function extractTextFromPdf(file: Express.Multer.File) {
  if (file.mimetype !== "application/pdf") {
    throw new PdfParseError("只支援 PDF 檔案，請重新選擇 .pdf 檔。");
  }

  const parser = new PDFParse({ data: file.buffer });

  try {
    const result = await parser.getText();
    const text = result.text
      .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      throw new PdfParseError(
        "目前尚未支援掃描型 PDF。請上傳可選取文字的文字型 PDF。"
      );
    }

    return text;
  } catch (error) {
    if (error instanceof PdfParseError) {
      throw error;
    }

    console.error("Parse PDF error:", error);
    throw new PdfParseError("PDF 解析失敗，請確認檔案是否為有效的文字型 PDF。");
  } finally {
    await parser.destroy();
  }
}
