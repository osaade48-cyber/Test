"use client";

import { useCallback, useState } from "react";
import { SceneView } from "@/components/three/SceneView";
import type { Focus } from "@/components/three/CameraRig";
import type { Config } from "@/lib/configurator";

const VIEWS: Focus[] = ["overview", "front", "left", "interior", "plaque", "hero"];

export function RenderStill({ config, dusk, doorOpen, view }: { config: Config; dusk: boolean; doorOpen: boolean; view: string }) {
  const focus = (VIEWS as string[]).includes(view) ? (view as Focus) : "overview";
  // Signals automated screenshot tools that the frame is complete.
  const [freeze, setFreeze] = useState(false);
  const onReady = useCallback(() => {
    // Let shadows, bloom and the fade-in settle, then hold the frame.
    setTimeout(() => setFreeze(true), 2000);
    setTimeout(() => document.documentElement.setAttribute("data-render-ready", "true"), 3800);
  }, []);
  return (
    <SceneView
      className="h-svh w-full"
      config={config}
      dusk={dusk}
      doorOpen={doorOpen}
      mode="still"
      focus={focus}
      tone={dusk ? "dark" : "light"}
      onReady={onReady}
      freeze={freeze}
    />
  );
}
