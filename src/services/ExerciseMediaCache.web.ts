import type { Exercise } from '../models/Exercise';
const urls = new Map<string, string>();
export async function cacheExerciseImage(uri: string): Promise<string> {
  if (!/^https?:/.test(uri)) return uri;
  const existing = urls.get(uri);
  if (existing) return existing;
  const cache = await caches.open('dallas-exercise-media-v1');
  let response = await cache.match(uri);
  if (!response) {
    response = await fetch(uri);
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Imagem indisponível');
    await cache.put(uri, response.clone());
  }
  const url = URL.createObjectURL(await response.blob());
  urls.set(uri, url);
  return url;
}
export async function prepareExerciseImages(exercises: Exercise[]): Promise<void> {
  const images = [...new Set(exercises.map(e => e.startImage || e.gifUrl).filter((uri): uri is string => !!uri))];
  for (let index = 0; index < images.length; index += 4) {
    try { await Promise.all(images.slice(index, index + 4).map(cacheExerciseImage)); }
    catch { throw new Error('Não foi possível carregar as imagens dos exercícios. Conecte-se e tente novamente.'); }
  }
}
