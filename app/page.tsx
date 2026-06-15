'use client';

import { useState, useCallback } from 'react';
import { Link2, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import {
  fetchMediaAsBlob,
  getMediaDuration,
  guessTitleFromUrl,
  type FetchProgress,
} from '@/lib/fetchMedia';
import { saveMedia, generateId } from '@/lib/storage';
import { useWakeLock } from '@/lib/useWakeLock';

type Status = 'idle' | 'downloading' | 'success' | 'error';

export default function DownloaderPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const wakeLock = useWakeLock();

  const handleDownload = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus('downloading');
    setError(null);
    setProgress(null);

    await wakeLock.acquire();

    try {
      const result = await fetchMediaAsBlob(trimmed, setProgress);
      const duration = await getMediaDuration(result.blob, result.type);
      const title = guessTitleFromUrl(trimmed);

      await saveMedia({
        id: generateId(),
        title,
        sourceUrl: trimmed,
        type: result.type,
        mimeType: result.mimeType,
        size: result.size,
        duration,
        createdAt: Date.now(),
        blob: result.blob,
      });

      setSavedTitle(title);
      setStatus('success');
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    } finally {
      await wakeLock.release();
    }
  }, [url, wakeLock]);

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.loaded / progress.total) * 100)
      : null;

  return (
    <div className="px-6 pt-12 max-w-md mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Vault</h1>
        <p className="text-sm text-charcoal-600 mt-1">
          Paste a direct media link to save it to your offline library.
        </p>
      </header>

      <div className="relative">
        <Link2
          size={18}
          strokeWidth={1.75}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-600"
        />
        <input
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://example.com/video.mp4"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={status === 'downloading'}
          className="w-full bg-charcoal-900 border border-charcoal-700 rounded-2xl py-4 pl-11 pr-4 text-sm text-white placeholder:text-charcoal-600 focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={status === 'downloading' || !url.trim()}
        className="mt-4 w-full bg-accent text-charcoal-950 font-medium rounded-2xl py-4 text-sm tracking-wide transition-opacity disabled:opacity-30 active:opacity-80 flex items-center justify-center gap-2"
      >
        {status === 'downloading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {percent !== null ? `Downloading ${percent}%` : 'Downloading…'}
          </>
        ) : (
          'Save to Vault'
        )}
      </button>

      {status === 'success' && savedTitle && (
        <div className="mt-6 flex items-start gap-3 bg-charcoal-900 border border-charcoal-700 rounded-2xl p-4">
          <CheckCircle2 size={18} className="text-accent mt-0.5 shrink-0" strokeWidth={1.75} />
          <div className="text-sm">
            <p className="text-white">Saved to your library</p>
            <p className="text-charcoal-600 mt-0.5 truncate">{savedTitle}</p>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="mt-6 flex items-start gap-3 bg-charcoal-900 border border-charcoal-700 rounded-2xl p-4">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" strokeWidth={1.75} />
          <div className="text-sm">
            <p className="text-white">Couldn't save this link</p>
            <p className="text-charcoal-600 mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-10 flex items-start gap-3 text-charcoal-600">
        <Lock size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
        <p className="text-xs leading-relaxed">
          Files are saved privately to this device's storage. Nothing is uploaded to a server
          unless you choose to share it. Direct media links work best — pages that block
          cross-origin downloads (most streaming sites and social platforms) can't be saved
          this way.
        </p>
      </div>
    </div>
  );
}
