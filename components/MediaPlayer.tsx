'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { MediaMeta } from '@/lib/storage';
import { getMediaBlobUrl } from '@/lib/storage';
import { useMediaSession, setPlaybackState } from '@/lib/useMediaSession';

export default function MediaPlayer({
  item,
  onClose,
}: {
  item: MediaMeta;
  onClose: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    let url: string | null = null;
    getMediaBlobUrl(item.id).then((blobUrl) => {
      url = blobUrl;
      setSrc(blobUrl);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.id]);

  useMediaSession({
    title: item.title,
    artist: 'Video Vault',
    onPlay: () => {
      mediaRef.current?.play();
      setPlaybackState('playing');
    },
    onPause: () => {
      mediaRef.current?.pause();
      setPlaybackState('paused');
    },
    onSeek: (time) => {
      if (mediaRef.current) mediaRef.current.currentTime = time;
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950 flex flex-col">
      <div className="flex items-center justify-between px-6 pt-safe pt-6 pb-4">
        <p className="text-sm text-charcoal-600 truncate pr-4">{item.title}</p>
        <button onClick={onClose} className="text-charcoal-600 active:text-white shrink-0">
          <X size={22} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        {src && item.type === 'video' && (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            controls
            playsInline
            className="w-full max-h-[70vh] rounded-2xl bg-black"
            onPlay={() => setPlaybackState('playing')}
            onPause={() => setPlaybackState('paused')}
          />
        )}

        {src && item.type === 'audio' && (
          <div className="w-full">
            <div className="aspect-square w-full max-w-xs mx-auto rounded-2xl bg-charcoal-900 border border-charcoal-700 flex items-center justify-center mb-8">
              <div className="w-16 h-16 rounded-full border-2 border-accent/40" />
            </div>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={src}
              controls
              className="w-full"
              onPlay={() => setPlaybackState('playing')}
              onPause={() => setPlaybackState('paused')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
