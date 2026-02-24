import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Video, Wifi, Activity } from "lucide-react";

// --- CONFIGURATION ---
const PI_IP = "http://100.122.74.118:5000";

const MapView = () => {
  const [metrics, setMetrics] = useState({ fps: "--", detections: 0, connected: false });
  const lastFrameIdRef = useRef<number>(-1);

  useEffect(() => {
    let intervalId: number;

    const updateInference = async () => {
      try {
        const res = await fetch(`${PI_IP}/data`, { cache: "no-store", mode: 'cors' });
        if (!res.ok) throw new Error("Network issue");

        const data: any = await res.json();

        if (!data || data.frame_id === undefined) return;

        // Skip if same frame
        if (data.frame_id === lastFrameIdRef.current) return;
        lastFrameIdRef.current = data.frame_id;

        const boxes = data.boxes || [];
        setMetrics({ fps: data.frame_id.toString(), detections: boxes.length, connected: true });

      } catch (err) {
        setMetrics(m => ({ ...m, connected: false }));
      }
    };

    // Lightweight poll strictly for the UI labels (fps, num detections)
    intervalId = window.setInterval(updateInference, 500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - NCNN Edge" />

      <div className="p-4 animate-fade-in flex flex-col gap-4">
        {/* Helper Banner */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
          <div className="mt-0.5">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Raspberry Pi Stream</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Live feed from <b>{PI_IP}</b>. Bounding boxes are directly rendered natively onto the video by the Edge device.
            </p>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-border w-full max-w-3xl mx-auto bg-[#0a0a0a] flex items-center justify-center group min-h-[300px]">

          {/* 1. Underlying Video Stream (Already contains detection boxes) */}
          <img
            src={`${PI_IP}/stream`}
            alt="Raspberry Pi Stream"
            className="w-full h-auto object-contain block"
            style={{
              maxWidth: '672px',
              imageRendering: 'pixelated'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).alt = "Awaiting connection to Raspberry Pi Edge Pipeline...";
            }}
          />

          {/* Status Bar Overlay Top left */}
          <div className="absolute top-4 left-4 flex gap-2 z-20 pointer-events-none">
            <div className={`glass px-3 py-2 rounded-xl flex items-center gap-2 ${!metrics.connected && 'opacity-50'}`}>
              <Wifi className={`w-4 h-4 ${metrics.connected ? 'text-success animate-pulse' : 'text-destructive'}`} />
              <span className={`text-xs font-semibold ${metrics.connected ? 'text-foreground' : 'text-destructive'}`}>
                {metrics.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Analytics Pillar Top Right */}
          <div className="absolute top-4 right-4 flex gap-2 z-20 pointer-events-none">
            <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground min-w-[120px] text-right">
                Frame: {metrics.fps} | Det: {metrics.detections}
              </span>
            </div>
          </div>

        </div>
      </div>
    </MobileLayout>
  );
};

export default MapView;