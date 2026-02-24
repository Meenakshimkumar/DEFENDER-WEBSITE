import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Phone, PhoneCall } from "lucide-react";

export function GlobalAlertSound() {
    const lastEventIdRef = useRef<number | null>(null);
    const { toast } = useToast();
    const [isFlashing, setIsFlashing] = useState(false);

    // State for the simulated farmer's phone
    const [phoneAlert, setPhoneAlert] = useState<any>(null);
    const phoneTimerRef = useRef<NodeJS.Timeout | null>(null);

    const playBeep = () => {
        try {
            const alertSound = new Audio('/alert.wav');
            alertSound.volume = 0.5;
            alertSound.play().catch((e) => console.log("Audio play blocked", e));
        } catch (e) {
            console.error("Error playing notification sound", e);
        }
    };

    const playPhoneRing = () => {
        try {
            // A standard simulated phone ringing sound
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.type = 'sine';
            osc2.type = 'sine';

            // UK/Europe style ring: 400Hz + 450Hz
            osc1.frequency.value = 400;
            osc2.frequency.value = 450;

            const now = audioCtx.currentTime;

            // Ring pattern: 0.4s on, 0.2s off, 0.4s on, 2s off
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
            gain.gain.setValueAtTime(0.5, now + 0.4);
            gain.gain.linearRampToValueAtTime(0, now + 0.45);

            gain.gain.setValueAtTime(0, now + 0.65);
            gain.gain.linearRampToValueAtTime(0.5, now + 0.7);
            gain.gain.setValueAtTime(0.5, now + 1.1);
            gain.gain.linearRampToValueAtTime(0, now + 1.15);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.2);
            osc2.stop(now + 1.2);
        } catch (e) { }
    };

    // --- PRACTICAL NATIVE DETERRENTS EXPERIMENT ---
    const playSiren = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            gain.gain.value = 0.4;

            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(600, now);
            for (let i = 0; i < 5; i++) {
                osc.frequency.linearRampToValueAtTime(1400, now + i + 0.5);
                osc.frequency.linearRampToValueAtTime(600, now + i + 1.0);
            }

            osc.start(now);
            osc.stop(now + 5);
        } catch (e) { }
    };

    const playUltrasonic = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            gain.gain.value = 0.8;

            osc.frequency.setValueAtTime(17500, audioCtx.currentTime);

            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 5);
        } catch (e) { }
    };

    const playBeeSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(65, audioCtx.currentTime);

            const lfo = audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(45, audioCtx.currentTime);
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 0.5;

            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);

            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);

            osc.start(audioCtx.currentTime);
            lfo.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 5);
            lfo.stop(audioCtx.currentTime + 5);
        } catch (e) { }
    };

    const triggerFlashlight = () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 5000);
    };

    const executeDeterrent = (deterrent: string) => {
        if (!deterrent || deterrent === "None") return;

        const d = deterrent.toLowerCase();

        if (d.includes('siren')) playSiren();
        else if (d.includes('ultrasonic')) playUltrasonic();
        else if (d.includes('bee')) playBeeSound();

        if (d.includes('flash') || d.includes('strobe')) {
            triggerFlashlight();
        }
    };

    useEffect(() => {
        const checkNewEvents = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/events');
                if (!response.ok) return;
                const events = await response.json();

                if (events && events.length > 0) {
                    const latestEvent = events[0];

                    if (lastEventIdRef.current === null) {
                        lastEventIdRef.current = latestEvent.id;
                    } else if (latestEvent.id !== lastEventIdRef.current) {
                        lastEventIdRef.current = latestEvent.id;

                        if (latestEvent.severity === 'high' || latestEvent.severity === 'medium') {
                            playBeep();

                            if (latestEvent.deterrent) {
                                executeDeterrent(latestEvent.deterrent);
                            }

                            toast({
                                title: `${latestEvent.emoji} New Detection: ${latestEvent.animal}`,
                                description: latestEvent.subtext || `Severity: ${latestEvent.severity.toUpperCase()}`,
                                variant: latestEvent.severity === 'high' ? 'destructive' : 'default',
                                duration: 5000,
                            });

                            // Trigger Farmer Phone Call simulation for HIGH and MEDIUM severity
                            if (latestEvent.severity === 'high' || latestEvent.severity === 'medium') {
                                setPhoneAlert(latestEvent);
                                playPhoneRing();

                                // Auto-ring again after 3 seconds if not dismissed
                                const ringInterval = setInterval(playPhoneRing, 3000);

                                // Dismiss after 15 seconds automatically
                                if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
                                phoneTimerRef.current = setTimeout(() => {
                                    setPhoneAlert(null);
                                    clearInterval(ringInterval);
                                }, 15000);

                                // Save the interval pointer inside the state or ref to clear it on manual dismiss
                                (window as any)._phoneRingInterval = ringInterval;
                            }
                        }
                    }
                }
            } catch (error) {
            }
        };

        const interval = setInterval(checkNewEvents, 3000);
        return () => clearInterval(interval);
    }, [toast]);

    const dismissPhone = () => {
        setPhoneAlert(null);
        if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
        if ((window as any)._phoneRingInterval) clearInterval((window as any)._phoneRingInterval);
    };

    return (
        <>
            {/* Visual Screen Flash Strobe */}
            {isFlashing && (
                <>
                    <style>{`
                        @keyframes strobeFx {
                            0% { background-color: rgba(255, 255, 255, 0.9); opacity: 1; }
                            50% { background-color: rgba(0, 0, 0, 0.1); opacity: 0.2; }
                            100% { background-color: rgba(255, 0, 0, 0.8); opacity: 1; }
                        }
                    `}</style>
                    <div
                        className="fixed inset-0 pointer-events-none z-[9998]"
                        style={{ animation: 'strobeFx 0.08s infinite alternate' }}
                    />
                </>
            )}

            {/* Simulated Farmer Phone UI */}
            {phoneAlert && (
                <div className="fixed bottom-6 right-6 w-72 h-[32rem] bg-slate-900 border-[8px] border-slate-800 rounded-[3rem] shadow-2xl z-[9999] overflow-hidden flex flex-col items-center p-6 animate-in slide-in-from-bottom-24 fade-in duration-500 pb-10">
                    {/* Phone Notch/Island */}
                    <div className="absolute top-0 w-24 h-6 bg-slate-800 rounded-b-2xl mb-4"></div>

                    <p className="text-slate-400 text-xs mt-6 mb-10 tracking-widest uppercase">Farmer's Phone</p>

                    <div className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(239,68,68,0.6)] mb-4">
                        <PhoneCall className="w-10 h-10 text-destructive-foreground animate-pulse" />
                    </div>

                    <h3 className="text-white text-xl font-bold mb-1 tracking-tight">DEFENDER IVR</h3>
                    <p className="text-red-400 font-bold text-sm mb-8 animate-pulse tracking-widest">INCOMING CALL...</p>

                    <div className="bg-slate-800/80 w-full rounded-2xl p-4 mb-auto text-center border border-slate-700 backdrop-blur-md">
                        <span className="text-5xl block mb-3 drop-shadow-md">{phoneAlert.emoji}</span>
                        <p className="text-white font-bold text-lg">{phoneAlert.animal} Intrusion!</p>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">Automated IVR call triggered by Edge AI pipeline.</p>
                    </div>

                    {/* Call Actions */}
                    <div className="flex gap-8 w-full justify-center mt-6">
                        <button
                            onClick={dismissPhone}
                            className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg active:scale-95"
                        >
                            <Phone className="w-7 h-7 text-white rotate-[135deg]" />
                        </button>
                        <button
                            onClick={() => {
                                alert("IVR Voice: 'Warning. High severity intrusion detected on sector 4.'");
                                dismissPhone();
                            }}
                            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 outline-none animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)] active:scale-95"
                        >
                            <Phone className="w-7 h-7 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
