import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { supabase, useSupabaseStorage } from "./supabase-server";

const BUCKET = "uploads";
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

function contentTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    bin: "application/octet-stream",
  };
  return map[ext?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

export async function ensureUploadDir() {
  if (useSupabaseStorage) return;
  await mkdir(UPLOAD_DIR, { recursive: true });
}

function getStoragePath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  const storageKey = `${randomUUID()}${ext ? `.${ext}` : ""}`;

  if (useSupabaseStorage && supabase) {
    const contentType = contentTypeFromExt(ext);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, buffer, {
        contentType,
        upsert: false,
      });
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    return storageKey;
  }

  await ensureUploadDir();
  const fullPath = getStoragePath(storageKey);
  await writeFile(fullPath, buffer);
  return storageKey;
}

export async function getFile(storageKey: string): Promise<Buffer | null> {
  if (useSupabaseStorage && supabase) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(storageKey);
    if (error || !data) return null;
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  try {
    const fullPath = getStoragePath(storageKey);
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<boolean> {
  if (useSupabaseStorage && supabase) {
    const { error } = await supabase.storage.from(BUCKET).remove([storageKey]);
    return !error;
  }

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
    "text/plain": "txt",
    "text/csv": "csv",
  };
  return map[mimeType] ?? "bin";
}
