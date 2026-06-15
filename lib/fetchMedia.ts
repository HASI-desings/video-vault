export interface FetchProgress {
  loaded: number;
  total: number;
}

export interface FetchResult {
  blob: Blob;
  mimeType: string;
  type: 'video' | 'audio';
  size: number;
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m3u8', '.mkv'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];

export function guessTypeFromUrl(url: string): 'video' | 'audio' | 'unknown' {
  const lower = url.toLowerCase().split('?')[0];
  if (VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'video';
  if (AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'audio';
  return 'unknown';
}

export function guessTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : u.hostname;
  } catch {
    return 'Untitled media';
  }
}

/**
 * Fetches a direct media URL as a Blob from the client.
 * Will fail for cross-origin URLs that don't send permissive CORS headers —
 * this is a browser security restriction and cannot be bypassed client-side.
 */
export async function fetchMediaAsBlob(
  url: string,
  onProgress?: (progress: FetchProgress) => void
): Promise<FetchResult> {
  let response: Response;
  try {
    response = await fetch(url, { mode: 'cors' });
  } catch (err) {
    throw new Error(
      'Could not reach this URL from the browser. The source server likely does not allow cross-origin downloads (CORS), or the link is invalid.'
    );
  }

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isMedia =
    contentType.startsWith('video/') ||
    contentType.startsWith('audio/') ||
    contentType.includes('mpegurl') ||
    guessTypeFromUrl(url) !== 'unknown';

  if (!isMedia) {
    throw new Error(
      `This URL did not return a media file (content-type: "${contentType || 'unknown'}"). Provide a direct link to an .mp4, .m3u8, .mp3, or similar file.`
    );
  }

  const contentLength = Number(response.headers.get('content-length') || 0);

  if (!response.body || !onProgress) {
    const blob = await response.blob();
    return finalizeResult(blob, contentType, url);
  }

  // Stream with progress reporting
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress({ loaded, total: contentLength });
    }
  }

  const blob = new Blob(chunks as BlobPart[], { type: contentType });
  return finalizeResult(blob, contentType, url);
}

function finalizeResult(blob: Blob, contentType: string, url: string): FetchResult {
  let type: 'video' | 'audio' = 'video';
  let mimeType = contentType;

  if (contentType.startsWith('audio/')) {
    type = 'audio';
  } else if (contentType.startsWith('video/')) {
    type = 'video';
  } else {
    const guessed = guessTypeFromUrl(url);
    type = guessed === 'audio' ? 'audio' : 'video';
    if (!mimeType) {
      mimeType = type === 'audio' ? 'audio/mpeg' : 'video/mp4';
    }
  }

  return { blob, mimeType, type, size: blob.size };
}

/**
 * Reads media duration by loading it into a temporary media element.
 */
export function getMediaDuration(blob: Blob, type: 'video' | 'audio'): Promise<number | undefined> {
  return new Promise((resolve) => {
    const el = document.createElement(type === 'audio' ? 'audio' : 'video');
    const url = URL.createObjectURL(blob);
    el.preload = 'metadata';
    el.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    el.onloadedmetadata = () => {
      const duration = Number.isFinite(el.duration) ? el.duration : undefined;
      cleanup();
      resolve(duration);
    };
    el.onerror = () => {
      cleanup();
      resolve(undefined);
    };

    // Safety timeout
    setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 5000);
  });
}
