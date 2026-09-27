import { Directory, File, Paths } from 'expo-file-system';
import { v5 as uuidv5 } from 'uuid';
import type { Exercise } from '../models/Exercise';
const pending = new Map<string, Promise<string>>();

/** Cache copies only; exercise ID/name/source media always remain the API values. */
export async function cacheExerciseImage(uri: string): Promise<string> {
  if (!/^https?:/.test(uri)) return uri;
  if (pending.has(uri)) return pending.get(uri)!;
  const task = (async () => {
    const directory = new Directory(Paths.document, 'exercise-media');
    directory.create({ idempotent: true, intermediates: true });
    const file = new File(directory, `${uuidv5(uri, uuidv5.URL)}.${uri.match(/\.(gif|png|webp|jpeg|jpg)(?:\?|$)/i)?.[1] ?? 'jpg'}`);
    if (file.exists && file.size > 0) return file.uri;
    try {
      await File.downloadFileAsync(uri, file, { idempotent: true });
      return file.uri;
    } catch (error) {
      if (file.exists) file.delete();
      throw error;
    }
  })();
  pending.set(uri, task);
  try { return await task; } finally { pending.delete(uri); }
}
export async function prepareExerciseImages(exercises: Exercise[]): Promise<void> {
  const images = [...new Set(exercises.map(e => e.startImage || e.gifUrl).filter((uri): uri is string => !!uri))];
  for (let index = 0; index < images.length; index += 4) {
    try { await Promise.all(images.slice(index, index + 4).map(cacheExerciseImage)); }
    catch { throw new Error('Não foi possível carregar as imagens dos exercícios. Conecte-se e tente novamente.'); }
  }
}
