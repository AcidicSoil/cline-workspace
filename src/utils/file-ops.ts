import fs from 'fs/promises';
import path from 'path';

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

export async function renderTemplate(src: string, dest: string, context: Record<string, string>): Promise<void> {
  await ensureDir(path.dirname(dest));
  let content = await fs.readFile(src, 'utf-8');
  
  for (const [key, value] of Object.entries(context)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(placeholder, value);
  }

  await fs.writeFile(dest, content);
}
