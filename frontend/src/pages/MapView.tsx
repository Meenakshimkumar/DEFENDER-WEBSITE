import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MapPin, Video, Wifi, Circle } from "lucide-react";

const MapView = () => {
  const [pins, setPins] = useState([
    { id: 1, top: 25, left: 33, type: "primary" },
    { id: 2, top: 33, left: 75, type: "secondary" },
    { id: 3, top: 75, left: 25, type: "warm" }
  ]);

  const [activeSensors, setActiveSensors] = useState(4);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Start webcam stream for live background
    const startLiveFeed = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Map video play error:", e));
        }
      } catch (err) {
        console.error("Failed to access webcam for live feed:", err);
      }
    };

    startLiveFeed();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Simulate pins moving slightly to show live tracking
    const intervalId = setInterval(() => {
      setPins(currentPins => currentPins.map(pin => {
        // Randomly drift by -2% to 2%
        const driftTop = (Math.random() - 0.5) * 4;
        const driftLeft = (Math.random() - 0.5) * 4;

        return {
          ...pin,
          top: Math.max(10, Math.min(90, pin.top + driftTop)),
          left: Math.max(10, Math.min(90, pin.left + driftLeft))
        };
      }));

      // Randomly fluctuate active sensors
      if (Math.random() > 0.7) {
        setActiveSensors(prev => Math.max(2, Math.min(8, prev + (Math.random() > 0.5 ? 1 : -1))));
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Map View" />

      <div className="p-4 animate-fade-in">
        {/* Map Container */}
        <div className="relative rounded-2xl overflow-hidden h-[420px] md:h-[600px] lg:h-[70vh] shadow-xl border-2 border-border max-w-4xl mx-auto bg-black">
          {/* Live Webcam Feed Background */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />

          {/* Fallback pattern / Overlay */}
          <div className="absolute inset-0 bg-secondary/10 mix-blend-overlay">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(10)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute w-full border-t border-primary/30"
                  style={{ top: `${i * 10}%` }}
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute h-full border-l border-primary/30"
                  style={{ left: `${i * 10}%` }}
                />
              ))}
            </div>

            {/* Dynamic Map Pins */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                className="absolute transition-all duration-1000 ease-in-out"
                style={{ top: `${pin.top}%`, left: `${pin.left}%` }}
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full gradient-${pin.type} flex items-center justify-center shadow-lg animate-pulse-glow`}>
                    <Circle className={`w-3 h-3 text-white fill-current`} />
                  </div>
                </div>
              </div>
            ))}

            {/* Main Camera Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative animate-float">
                <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center shadow-xl glow-accent">
                  <Video className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-semibold text-foreground">Live Feed Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
              <Wifi className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-foreground">Connected</span>
            </div>
            <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-foreground">{activeSensors} Active</span>
            </div>
          </div>

          {/* Map Label */}
          <div className="absolute bottom-4 right-4 glass px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Wildlife Zone</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-card rounded-xl border border-border shadow-sm max-w-lg mx-auto md:max-w-none">
          <h3 className="text-sm font-bold text-foreground mb-3">Map Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full gradient-accent" />
              <span className="text-xs text-muted-foreground">Live Camera</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full gradient-primary" />
              <span className="text-xs text-muted-foreground">Sensor Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full gradient-secondary" />
              <span className="text-xs text-muted-foreground">Detection Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full gradient-warm" />
              <span className="text-xs text-muted-foreground">Alert Area</span>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MapView;