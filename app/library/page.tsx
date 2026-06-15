'use client';

import { useEffect, useState, useCallback } from 'react';
import { listMedia, type MediaMeta } from '@/lib/storage';
import LibraryItem from '@/components/LibraryItem';
import MediaPlayer from '@/components/MediaPlayer';

type Segment = 'video' | 'audio';

export default function LibraryPage() {
  const [items, setItems] = useState<MediaMeta[]>([]);
  const [segment, setSegment] = useState<Segment>('video');
  const [playing, setPlaying] = useState<MediaMeta | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const all = await listMedia();
    setItems(all);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = items.filter((item) => item.type === segment);

  return (
    <div className="px-6 pt-12 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Library</h1>
        <p className="text-sm text-charcoal-600 mt-1">Everything you've saved, stored on this device.</p>
      </header>

      <div className="flex gap-2 mb-6 bg-charcoal-900 border border-charcoal-700 rounded-2xl p-1">
        {(['video', 'audio'] as Segment[]).map((seg) => (
          <button
            key={seg}
            onClick={() => setSegment(seg)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              segment === seg
                ? 'bg-charcoal-700 text-white'
                : 'text-charcoal-600'
            }`}
          >
            {seg === 'video' ? 'Videos' : 'Music'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loaded && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-charcoal-600">
              No {segment === 'video' ? 'videos' : 'tracks'} saved yet.
            </p>
          </div>
        )}

        {filtered.map((item) => (
          <LibraryItem
            key={item.id}
            item={item}
            onPlay={setPlaying}
            onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
          />
        ))}
      </div>

      {playing && <MediaPlayer item={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
