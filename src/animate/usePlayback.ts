import { useEffect, useRef, useState } from "react";
import { PlaybackClock, type PlaybackState } from "./clock.ts";
import type { TimeParameter } from "./time.ts";

export function usePlayback(
  timeline: TimeParameter | undefined,
  time: number,
  onTimeChange: (time: number) => void,
  element: HTMLElement,
) {
  const clockRef = useRef<PlaybackClock | null>(null);
  const changeRef = useRef(onTimeChange);
  changeRef.current = onTimeChange;
  const [state, setState] = useState<PlaybackState>({
    time, playing: false, active: true, speed: 1, loop: timeline?.config.loop ?? false,
  });
  const name = timeline?.name;
  const duration = timeline?.config.duration;
  const loop = timeline?.config.loop;

  useEffect(() => {
    if (duration === undefined) return;
    const clock = new PlaybackClock({
      duration, time, loop,
      scheduler: {
        now: () => performance.now(),
        request: (callback) => requestAnimationFrame(callback),
        cancel: (id) => cancelAnimationFrame(id),
      },
      onChange: (next) => {
        setState(next);
        changeRef.current(next.time);
      },
    });
    clockRef.current = clock;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = typeof IntersectionObserver === "undefined";
    const visibility = () => clock.setActive(inView && !document.hidden);
    const reducedMotion = () => { if (motion.matches) clock.pause(); };
    const observer = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      visibility();
    });
    observer?.observe(element);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", reducedMotion);
    return () => {
      clock.dispose();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", reducedMotion);
      clockRef.current = null;
    };
    // Time changes update this clock through seek; they do not recreate it.
  }, [name, duration, loop, element]);

  useEffect(() => {
    const clock = clockRef.current;
    if (clock && clock.snapshot.time !== time) clock.seek(time);
  }, [time]);

  return {
    state,
    toggle: () => {
      const clock = clockRef.current;
      if (clock?.snapshot.playing) clock.pause(); else clock?.play();
    },
    seek: (next: number) => {
      clockRef.current?.pause();
      clockRef.current?.seek(next);
    },
    setSpeed: (speed: number) => clockRef.current?.setSpeed(speed),
    setLoop: (enabled: boolean) => clockRef.current?.setLoop(enabled),
  };
}
