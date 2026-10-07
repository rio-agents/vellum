export interface FrameScheduler {
  now: () => number;
  request: (callback: (timestamp: number) => void) => number;
  cancel: (id: number) => void;
}

export interface PlaybackState {
  time: number;
  playing: boolean;
  active: boolean;
  speed: number;
  loop: boolean;
}

export interface PlaybackClockOptions {
  duration: number;
  time: number;
  loop?: boolean;
  scheduler: FrameScheduler;
  onChange: (state: PlaybackState) => void;
}

/** Elapsed-time playback, with an injectable clock for deterministic tests. */
export class PlaybackClock {
  private duration: number;
  private scheduler: FrameScheduler;
  private onChange: (state: PlaybackState) => void;
  private state: PlaybackState;
  private frame: number | undefined;
  private anchorTime = 0;
  private anchorTimestamp = 0;
  private disposed = false;

  constructor(options: PlaybackClockOptions) {
    if (!Number.isFinite(options.duration) || options.duration <= 0) {
      throw new Error("Playback duration must be finite and positive.");
    }
    this.duration = options.duration;
    this.scheduler = options.scheduler;
    this.onChange = options.onChange;
    this.state = {
      time: this.clamp(options.time), playing: false, active: true,
      speed: 1, loop: options.loop ?? false,
    };
  }

  get snapshot(): PlaybackState { return { ...this.state }; }

  play(): void {
    if (this.disposed || this.state.playing) return;
    if (this.state.time === this.duration) this.state.time = 0;
    this.state.playing = true;
    this.anchor();
    this.emit();
    this.schedule();
  }

  pause(): void {
    if (this.disposed) return;
    this.advance(this.scheduler.now());
    this.state.playing = false;
    this.cancel();
    this.emit();
  }

  seek(time: number): void {
    if (this.disposed) return;
    this.state.time = this.clamp(time);
    if (!this.state.loop && this.state.time === this.duration) {
      this.state.playing = false;
      this.cancel();
    }
    this.anchor();
    this.emit();
  }

  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) throw new Error("Playback speed must be finite and positive.");
    if (this.disposed) return;
    this.advance(this.scheduler.now());
    this.state.speed = speed;
    this.anchor();
    this.emit();
  }

  setLoop(loop: boolean): void {
    if (this.disposed) return;
    this.advance(this.scheduler.now());
    this.state.loop = loop;
    this.anchor();
    this.emit();
  }

  /** Suspend offscreen/hidden playback without accumulating hidden time. */
  setActive(active: boolean): void {
    if (this.disposed || active === this.state.active) return;
    this.advance(this.scheduler.now());
    this.state.active = active;
    this.cancel();
    this.anchor();
    this.emit();
    this.schedule();
  }

  dispose(): void {
    this.disposed = true;
    this.cancel();
  }

  private clamp(time: number): number {
    return Math.max(0, Math.min(this.duration, Number.isFinite(time) ? time : 0));
  }

  private anchor(): void {
    this.anchorTime = this.state.time;
    this.anchorTimestamp = this.scheduler.now();
  }

  private advance(timestamp: number): void {
    if (!this.state.playing || !this.state.active) return;
    const elapsed = Math.max(0, timestamp - this.anchorTimestamp) / 1000;
    const next = this.anchorTime + elapsed * this.state.speed;
    if (next >= this.duration) {
      this.state.time = this.state.loop ? next % this.duration : this.duration;
      if (!this.state.loop) this.state.playing = false;
    } else {
      this.state.time = next;
    }
  }

  private emit(): void { this.onChange(this.snapshot); }

  private cancel(): void {
    if (this.frame !== undefined) this.scheduler.cancel(this.frame);
    this.frame = undefined;
  }

  private schedule(): void {
    if (this.disposed || !this.state.playing || !this.state.active || this.frame !== undefined) return;
    this.frame = this.scheduler.request((timestamp) => {
      this.frame = undefined;
      if (this.disposed) return;
      this.advance(timestamp);
      this.emit();
      this.schedule();
    });
  }
}
