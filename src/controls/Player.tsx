import React, { useId } from "react";
import { Slider } from "./Slider.tsx";
import type { TimeParameter } from "../animate/time.ts";
import type { PlaybackState } from "../animate/clock.ts";

export interface PlayerProps {
  timeline: TimeParameter;
  state: PlaybackState;
  toggle: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  setLoop: (enabled: boolean) => void;
}

export function Player({ timeline, state, toggle, seek, setSpeed, setLoop }: PlayerProps) {
  const id = useId();
  const status = state.playing ? (state.active ? "Playing" : "Paused while hidden") : "Paused";
  return (
    <div className="vellum-player" role="group" aria-label="Animation controls">
      <div className="vellum-player__actions">
        <button type="button" className="vellum-player__button" onClick={toggle} aria-pressed={state.playing}>
          {state.playing ? "Pause" : "Play"}
        </button>
        <button type="button" className="vellum-player__button" onClick={() => seek(0)}>Restart</button>
        <span role="status" className="vellum-player__status">{status}</span>
      </div>
      <Slider
        id={`${id}-time`} name={timeline.name}
        label={timeline.config.label ?? "Time"} labelKind={timeline.config.label ? timeline.config.labelKind : "text"}
        min={0} max={timeline.config.duration} step={0.01}
        value={state.time} onChange={seek} format={(value) => `${value.toFixed(2)} s`}
      />
      <div className="vellum-player__settings">
        <label htmlFor={`${id}-speed`}>Speed</label>
        <select id={`${id}-speed`} value={state.speed} onChange={(event) => setSpeed(Number(event.target.value))}>
          {[0.25, 0.5, 1, 2].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
        </select>
        <label className="vellum-player__loop">
          <input type="checkbox" checked={state.loop} onChange={(event) => setLoop(event.target.checked)} /> Loop
        </label>
      </div>
    </div>
  );
}
