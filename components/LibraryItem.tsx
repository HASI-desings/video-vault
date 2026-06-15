'use client';

import { useState } from 'react';
import { Play, Share, Trash2, Film, Music } from 'lucide-react';
import type { MediaMeta } from '@/lib/storage';
import { getMediaBlobUrl, getMedia, deleteMedia } from '@/lib/storage';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LibraryItem({
  item,
  onPlay,
  onDeleted,
}: {
  item: MediaMeta;
  onPlay: (item: MediaMeta) => void;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const record = await getMedia(item.id);
      if (!record) return;

      const file = new File([record.blob], item.title, { type: record.mimeType });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: item.title });
      } else {
        // Fallback: trigger a manual download via temporary anchor.
        const url = URL.createObjectURL(record.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled share — ignore.
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteMedia(item.id);
    onDeleted(item.id);
  };

  return (
    <div className="flex items-center gap-3 bg-charcoal-900 border border-charcoal-700 rounded-2xl p-3">
      <button
        onClick={() => onPlay(item)}
        className="shrink-0 w-12 h-12 rounded-xl bg-charcoal-800 flex items-center justify-center active:opacity-70"
      >
        {item.type === 'video' ? (
          <Film size={18} className="text-accent" strokeWidth={1.75} />
        ) : (
          <Music size={18} className="text-accent" strokeWidth={1.75} />
        )}
      </button>

      <button onClick={() => onPlay(item)} className="flex-1 text-left min-w-0">
        <p className="text-sm text-white truncate">{item.title}</p>
        <p className="text-xs text-charcoal-600 mt-0.5">
          {formatSize(item.size)} · {formatDuration(item.duration)}
        </p>
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onPlay(item)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal-600 active:text-accent"
        >
          <Play size={16} strokeWidth={1.75} />
        </button>
        <button
          onClick={handleShare}
          disabled={busy}
          className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal-600 active:text-accent"
        >
          <Share size={16} strokeWidth={1.75} />
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal-600 active:text-red-400"
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
