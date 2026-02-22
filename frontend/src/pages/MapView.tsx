import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Video, Wifi, Activity } from "lucide-react";

const PI_IP = "http://192.168.2.187:5000";
const INFERENCE_SIZE = 224;

const CLASS_NAMES: Record<number, string> = {
  0: "Buffalo",
  1: "Elephant",
  2: "Rhino",
  3: "Zebra"
};

const COLORS = ["#00FFFF", "#FF4500", "#FFD700", "#00FF00"];

interface DetectionData {
  frame_id: number;
  timestamp: number;
  boxes: Array<{
    label: number;
    prob: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

const MapView = () => {
  const videoRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState({ fps: 0, detections: 0, connected: false });
  const lastFrameIdRef = useRef<number>(-1);

  useEffect(() => {
    let intervalId: number;

    const syncCanvasSize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.clientWidth;
        canvasRef.current.height = videoRef.current.clientHeight;
      }
    };

    window.addEventListener('resize', syncCanvasSize);

    // Initial sync slightly delayed so element mounts with correct size
    setTimeout(syncCanvasSize, 100);

    const updateInference = async () => {
      try {
        const res = await fetch(`${PI_IP}/data`, { cache: "no-store", mode: 'cors' });
        if (!res.ok) throw new Error("Network issue");

        const data: DetectionData = await res.json();

        if (!data || !data.frame_id) return;

        // Drop stale frames
        const now = Date.now() / 1000;
        if (now - data.timestamp > 1.0) return;

        // Skip if same frame
        if (data.frame_id === lastFrameIdRef.current) return;
        lastFrameIdRef.current = data.frame_id;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Re-sync size natively before drawing to prevent scaling artifacts
        syncCanvasSize();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const boxes = data.boxes || [];
        setMetrics({ fps: data.frame_id, detections: boxes.length, connected: true });

        const scaleX = canvas.width / INFERENCE_SIZE;
        const scaleY = canvas.height / INFERENCE_SIZE;

        boxes.forEach(box => {
          const x = box.x * scaleX;
          const y = box.y * scaleY;
          const w = box.w * scaleX;
          const h = box.h * scaleY;

          const label = CLASS_NAMES[box.label] || `Class ${box.label}`;
          const color = COLORS[box.label % COLORS.length];
          const prob = (box.prob * 100).toFixed(0);

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = color;
          ctx.font = "bold 14px Arial";
          const labelText = `${label} ${prob}%`;
          const textWidth = ctx.measureText(labelText).width;

          ctx.fillRect(x, y - 22, textWidth + 10, 22);

          ctx.fillStyle = "#000000";
          ctx.fillText(labelText, x + 5, y - 6);
        });

      } catch (err) {
        setMetrics(m => ({ ...m, connected: false }));
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    intervalId = window.setInterval(updateInference, 30);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', syncCanvasSize);
    };
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
              Direct connection to <b>{PI_IP}</b> handling decoupled 224x224 NCNN bounding boxes.
            </p>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-border w-full max-w-3xl mx-auto bg-black flex items-center justify-center group">

          {/* 1. Underlying Clean Video Stream */}
          <img
            ref={videoRef}
            src={`${PI_IP}/stream`}
            alt="Raspberry Pi Offline"
            className="w-full h-auto object-contain block"
            style={{ maxWidth: '672px' }}
            onLoad={() => {
              // Trigger sync immediately when image bounds are known
              if (videoRef.current && canvasRef.current) {
                canvasRef.current.width = videoRef.current.clientWidth;
                canvasRef.current.height = videoRef.current.clientHeight;
              }
            }}
          />

          {/* 2. Transparent React Canvas Overlay exactly matching intrinsic dimensions */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 right-0 mx-auto pointer-events-none z-10"
            style={{ maxWidth: '672px' }}
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