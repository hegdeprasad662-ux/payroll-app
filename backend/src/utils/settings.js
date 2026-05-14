import { prisma } from './prisma.js';
import { DEFAULT_SETTINGS } from '../config/index.js';

/** Merge DB-stored settings over defaults. Numeric values are parsed. */
export async function getSettings() {
  const rows = await prisma.setting.findMany();
  const settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    const n = Number(r.value);
    settings[r.key] = isNaN(n) ? r.value : n;
  }
  return settings;
}

export async function setSetting(key, value) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value: String(value) },
    update: { value: String(value) },
  });
}
