'use client';

import { useEffect } from 'react';

interface MediaSessionConfig {
  title: string;
  artist?: string;
  artwork?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
}

export function useMediaSession(config: MediaSessionConfig | null) {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !config) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: config.title,
      artist: config.artist || 'Video Vault',
      artwork: config.artwork
        ? [
            { src: config.artwork, sizes: '512x512', type: 'image/png' },
          ]
        : [],
    });

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => config.onPlay?.()],
      ['pause', () => config.onPause?.()],
      ['nexttrack', () => config.onNext?.()],
      ['previoustrack', () => config.onPrevious?.()],
      [
        'seekto',
        (details) => {
          if (details.seekTime != null) config.onSeek?.(details.seekTime);
        },
      ],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions unsupported on some browsers — ignore.
      }
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, [config]);
}

export function setPlaybackState(state: 'playing' | 'paused' | 'none') {
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}
