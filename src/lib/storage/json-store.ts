import fs from 'fs';
import path from 'path';
import os from 'os';

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

/**
 * Resolves the persistent data directory for single-instance VPS deployments.
 * Set DATA_DIR in environment to point to a mounted persistent volume if needed.
 */
export function getDataDir(): string {
  // On Vercel serverless functions, the root filesystem is strictly read-only except os.tmpdir()
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'ganesh-data');
  }

  const configured = process.env.DATA_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }
  return path.join(process.cwd(), '.data');
}

export function getDataFilePath(filename: string): string {
  return path.join(getDataDir(), filename);
}

export function getTmpFilePath(filename: string): string {
  return path.join(os.tmpdir(), filename);
}

export function isTestStorageBypassed(): boolean {
  return isTestEnv;
}

export function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[JSON Store] Failed to read ${filePath}:`, err);
    return null;
  }
}

/**
 * Reads persisted JSON prioritizing the VPS persistent DATA_DIR first,
 * falling back to os.tmpdir() only when primary disk storage is absent.
 */
export function readPersistedJson<T>(filename: string, tmpFallbackFilename?: string): T | null {
  if (isTestEnv) return null;

  const primary = readJsonFile<T>(getDataFilePath(filename));
  if (primary !== null) return primary;

  if (tmpFallbackFilename) {
    return readJsonFile<T>(getTmpFilePath(tmpFallbackFilename));
  }
  return null;
}

/**
 * Writes JSON atomically via temp file + rename so crashes or restarts
 * on a VPS never leave a partially written or corrupted JSON file.
 */
export function writeJsonAtomic(filePath: string, data: unknown): boolean {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const tempPath = `${filePath}.tmp.${process.pid}.${Math.random().toString(36).slice(2, 8)}`;

  try {
    fs.writeFileSync(tempPath, jsonStr, 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
    throw err;
  }
}

/**
 * Persists JSON to DATA_DIR atomically, falling back to os.tmpdir()
 * only if DATA_DIR is read-only.
 */
export function writePersistedJson(
  filename: string,
  data: unknown,
  tmpFallbackFilename?: string
): boolean {
  if (isTestEnv) return false;

  const primaryPath = getDataFilePath(filename);
  try {
    return writeJsonAtomic(primaryPath, data);
  } catch (err) {
    const fallbackName = tmpFallbackFilename || filename;
    try {
      return writeJsonAtomic(getTmpFilePath(fallbackName), data);
    } catch (tmpErr) {
      console.warn(`[JSON Store] Failed writing primary (${primaryPath}) and fallback (${fallbackName}):`, tmpErr);
      return false;
    }
  }
}

export function isDataDirWritable(): boolean {
  const dir = getDataDir();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

