const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/x-ofx",
  "application/vnd.intu.qfx",
  "application/vnd.intu.qbo",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const validateIntakeFile = (file: File) => {
  if (file.size <= 0) throw new Error("The selected file is empty.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Files must be 20 MB or smaller.");
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, PDF, CSV, TXT, DOCX, XLSX, OFX, QFX, or QBO file.");
  }
};

export const sha256File = async (file: File) => {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const safeStorageFilename = (name: string) => {
  const cleaned = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.replace(/-+/g, "-").slice(-120) || "document";
};
