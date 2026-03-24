"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  dates: string[];
  value: string;
  onChange: (date: string) => void;
}

export function TimeSlider({ dates, value, onChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef = useRef(0);

  // Keep idxRef in sync with the externally-controlled value
  const currentIndex = dates.indexOf(value);
  useEffect(() => {
    if (currentIndex >= 0) idxRef.current = currentIndex;
  }, [currentIndex]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (dates.length < 2) return;
    // Start from beginning if at end, otherwise continue from current
    let startIdx = idxRef.current < dates.length - 1 ? idxRef.current : 0;
    if (startIdx === 0) onChange(dates[0]);
    idxRef.current = startIdx;
    setPlaying(true);

    intervalRef.current = setInterval(() => {
      const next = idxRef.current + 1;
      if (next >= dates.length) {
        setPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      idxRef.current = next;
      onChange(dates[next]);
    }, 400);
  }, [dates, onChange]);

  const reset = useCallback(() => {
    stop();
    if (dates.length > 0) onChange(dates[dates.length - 1]);
  }, [dates, onChange, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (dates.length < 2) return null;

  const formatLabel = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-pm-border-base bg-pm-bg-card px-3 py-2">
      <div className="flex items-center gap-1">
        <button
          onClick={playing ? stop : play}
          className="flex h-7 w-7 items-center justify-center rounded-md text-pm-fg-muted transition-colors hover:bg-pm-bg-elevated hover:text-pm-fg-base"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={reset}
          className="flex h-7 w-7 items-center justify-center rounded-md text-pm-fg-muted transition-colors hover:bg-pm-bg-elevated hover:text-pm-fg-base"
          title="Reset to latest"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={dates.length - 1}
        value={currentIndex >= 0 ? currentIndex : dates.length - 1}
        onChange={(e) => {
          if (playing) stop();
          onChange(dates[Number(e.target.value)]);
        }}
        className="time-slider h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-pm-bg-elevated outline-none [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-pm-bg-card [&::-moz-range-thumb]:bg-pm-brand [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-pm-bg-card [&::-webkit-slider-thumb]:bg-pm-brand"
      />

      <span className="min-w-[100px] text-right text-xs tabular-nums text-pm-fg-muted">
        {value ? formatLabel(value) : formatLabel(dates[dates.length - 1])}
      </span>
    </div>
  );
}
