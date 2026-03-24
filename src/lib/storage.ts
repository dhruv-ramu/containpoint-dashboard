import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

function getStoragePath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  await ensureUploadDir();
  const storageKey = `${randomUUID()}${ext ? `.${ext}` : ""}`;
  const fullPath = getStoragePath(storageKey);
  await writeFile(fullPath, buffer);
  return storageKey;
}

export async function getFile(storageKey: string): Promise<Buffer | null> {
  try {
    const fullPath = getStoragePath(storageKey);
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<boolean> {
  try {
    const fullPath = getStoragePath(storageKey);
    await unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}

export function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  return map[mimeType] ?? "bin";
}
