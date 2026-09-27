import { Directory, File, Paths } from 'expo-file-system';

/** Profile and feed are local in this app. Store files outside the evictable cache. */
export async function persistImage(uri: string): Promise<string> {
  if (uri.startsWith('asset:') || uri.startsWith('http')) return uri;
  const directory = new Directory(Paths.document, 'dallas-media');
  directory.create({ idempotent: true, intermediates: true });
  if (uri.startsWith(directory.uri)) return uri;
  const extension = uri.split('?')[0].match(/\.(jpg|jpeg|png|webp|heic)$/i)?.[1] ?? 'png';
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
  new File(uri).copy(destination);
  return destination.uri;
}
export async function resolveImage(uri: string): Promise<string> { return uri; }
