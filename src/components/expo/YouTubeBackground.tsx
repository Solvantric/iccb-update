"use client";
/**
 * Muted, looping YouTube background that only plays a chosen clip (start → end seconds).
 * Uses the IFrame Player API to jump back to `start` when `end` is reached, and fades the video in
 * once it is actually playing (the poster image shows until then).
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type YTPlayer = {
  mute: () => void;
  playVideo: () => void;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
};
type YTNamespace = {
  Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { PLAYING: number; ENDED: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function YouTubeBackground({ videoId, start, end, poster, title }: { videoId: string; start: number; end: number; poster: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const host = hostRef.current;
    loadApi().then((YT) => {
      if (cancelled || !host) return;
      // the API replaces this element with its iframe, so React never owns it
      const target = document.createElement("div");
      host.appendChild(target);
      playerRef.current = new YT.Player(target, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1,
          playsinline: 1, rel: 0, start, end, loop: 0,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.mute();
            e.target.seekTo(start, true);
            e.target.playVideo();
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === YT.PlayerState.ENDED) {
              e.target.seekTo(start, true);
              e.target.playVideo();
            }
          },
        },
      });
      // keep the clip inside start → end
      timer = setInterval(() => {
        const p = playerRef.current;
        if (!p?.getCurrentTime) return;
        if (p.getCurrentTime() >= end - 0.3) p.seekTo(start, true);
      }, 250);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      if (host) host.innerHTML = "";
    };
  }, [videoId, start, end]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden>
      <Image src={poster} alt="" fill priority sizes="100vw" className={`object-cover transition-opacity duration-1000 ${playing ? "opacity-0" : "opacity-100"}`} />
      {/* 16:9 iframe scaled to always cover the hero */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-screen min-w-[177.78vh] -translate-x-1/2 -translate-y-1/2 scale-[1.15] transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"}`}
      >
        <div ref={hostRef} title={title} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
      </div>
    </div>
  );
}
