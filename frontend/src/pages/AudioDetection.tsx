import { useState, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Upload, Activity, Loader2, AlertCircle, Play, Square, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const AudioDetection = () => {
    const { toast } = useToast();

    // Media states
    const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Inference states
    const [isDetecting, setIsDetecting] = useState(false);
    const [result, setResult] = useState<any[] | null>(null);
    const [identifiedAnimal, setIdentifiedAnimal] = useState<string | null>(null);
    const [identifiedConfidence, setIdentifiedConfidence] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedAudio(file);
            setError(null);
            setResult(null);

            const objectUrl = URL.createObjectURL(file);
            setAudioUrl(objectUrl);
        }
    };

    const clearSelection = () => {
        setSelectedAudio(null);
        setAudioUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const startRecording = async () => {
        try {
            clearSelection();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const objectUrl = URL.createObjectURL(audioBlob);
                setAudioUrl(objectUrl);

                // Convert blob to file for the backend
                const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
                setSelectedAudio(file);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError(null);

            // Timer for UI
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Please allow microphone access to record audio.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDetect = async () => {
        if (!selectedAudio) {
            setError("Please select or record an audio clip first.");
            return;
        }

        setIsDetecting(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", selectedAudio);

        try {
            const response = await fetch("http://localhost:5000/api/detect-audio", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Raw backend data:", JSON.stringify(data, null, 2));

            // data.results is the flat array of predictions
            if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                setResult(data.results);
                setIdentifiedAnimal(data.identified_animal || data.results[0].label);
                setIdentifiedConfidence(data.confidence !== undefined ? data.confidence : data.results[0].score);
            } else {
                setResult([]);
                setIdentifiedAnimal(null);
                setIdentifiedConfidence(null);
                console.warn("Backend returned an empty results payload.", data);
            }

            toast({
                title: "Analysis Complete",
                description: "Audio classification successful.",
                variant: "default",
            });

        } catch (err) {
            console.error("Detection error:", err);
            setError("Failed to analyze audio. Ensure the Python backend is running.");
            toast({
                title: "Analysis Failed",
                description: "Failed to connect to the backend server.",
                variant: "destructive",
            });
        } finally {
            setIsDetecting(false);
        }
    };

    return (
        <>
            <MobileLayout>
                <PageHeader title="DEFENDER - Audio Listen" showBack={true} />

                <div className="p-4 space-y-6 animate-fade-in pb-20">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg gradient-secondary flex items-center justify-center shadow-md">
                                <Volume2 className="w-4 h-4 text-secondary-foreground" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Environmental Audio</h2>
                        </div>

                        <Card className="border-border shadow-lg overflow-hidden bg-card transition-all hover:shadow-xl">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg">Audio Classifier</CardTitle>
                                <CardDescription>Record ambient sounds or upload a clip to detect wildlife calls and environmental anomalies.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">

                                {error && (
                                    <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-6">

                                    {/* Audio Recording UI */}
                                    {!audioUrl && (
                                        <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center bg-muted/10 flex flex-col items-center">

                                            {!isRecording ? (
                                                <>
                                                    <Button
                                                        variant="default"
                                                        size="lg"
                                                        className="rounded-full w-20 h-20 shadow-lg glow-primary gradient-primary"
                                                        onClick={startRecording}
                                                    >
                                                        <Mic className="w-10 h-10 text-primary-foreground" />
                                                    </Button>
                                                    <h3 className="text-sm font-semibold mt-4 mb-1">Tap to Record</h3>
                                                    <p className="text-xs text-muted-foreground">Capture live sound</p>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
                                                    <div className="relative mb-4">
                                                        <Button
                                                            variant="destructive"
                                                            size="lg"
                                                            className="rounded-full w-20 h-20 shadow-lg animate-pulse"
                                                            onClick={stopRecording}
                                                        >
                                                            <Square className="w-8 h-8 text-destructive-foreground fill-current" />
                                                        </Button>
                                                        <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping opacity-50 pointer-events-none"></div>
                                                    </div>

                                                    <h3 className="text-lg font-bold text-destructive mb-1">{formatTime(recordingTime)}</h3>
                                                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                                        <Activity className="w-3 h-3 text-destructive animate-pulse" /> Recording...
                                                    </p>
                                                </div>
                                            )}

                                            {!isRecording && (
                                                <>
                                                    <div className="relative w-full flex items-center py-6">
                                                        <div className="flex-grow border-t border-muted/50"></div>
                                                        <span className="flex-shrink-0 mx-4 text-xs font-semibold text-muted-foreground">OR UPLOAD</span>
                                                        <div className="flex-grow border-t border-muted/50"></div>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Upload className="mr-2 w-4 h-4" /> Select Audio File
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />

                                    {/* Preview & Results Area */}
                                    {audioUrl && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="rounded-xl overflow-hidden border bg-muted/30 p-4 flex flex-col items-center justify-center">

                                                <div className="w-full mb-4">
                                                    <audio controls src={audioUrl} className="w-full outline-none" />
                                                </div>

                                                {isDetecting && (
                                                    <div className="flex flex-col items-center justify-center py-6">
                                                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                                                        <p className="font-semibold text-sm text-primary animate-pulse tracking-wide">Processing audio spectrogram...</p>
                                                    </div>
                                                )}

                                                {!isDetecting && result && (
                                                    <div className="w-full space-y-3 bg-card border rounded-lg p-4 mt-2">
                                                        {identifiedAnimal && (
                                                            <div className="mb-6 mt-2 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 shadow-sm flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                                                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-200 mb-3 shadow-inner text-emerald-700">
                                                                    <Volume2 className="w-8 h-8 text-emerald-700 animate-pulse" />
                                                                </div>
                                                                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-1">Identified Sound</h3>
                                                                <p className="text-4xl font-black capitalize text-emerald-600 mb-2">
                                                                    {identifiedAnimal.replace(/_/g, " ")}
                                                                </p>
                                                                {identifiedConfidence !== null && (
                                                                    <div className="inline-flex items-center gap-2 bg-emerald-200/50 px-3 py-1 rounded-full text-emerald-800 font-semibold text-sm">
                                                                        <span>Confidence:</span>
                                                                        <span>{(identifiedConfidence * 100).toFixed(1)}%</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <h4 className="font-bold border-b pb-2 mb-3 text-sm flex items-center gap-2">
                                                            <Activity className="w-4 h-4 text-primary" />
                                                            Classification Results
                                                        </h4>
                                                        {result.slice(0, 3).map((lbl: any, idx) => (
                                                            <div key={idx} className="flex flex-col gap-1">
                                                                <div className="flex justify-between items-center text-sm font-medium">
                                                                    <span className="capitalize">{lbl.label}</span>
                                                                    <span>{(lbl.score * 100).toFixed(1)}%</span>
                                                                </div>
                                                                <div className="w-full bg-muted rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-primary/40'}`}
                                                                        style={{ width: `${lbl.score * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full flex gap-2 items-center"
                                                    onClick={clearSelection}
                                                    disabled={isDetecting}
                                                >
                                                    Reset Audio
                                                </Button>

                                                <Button
                                                    onClick={handleDetect}
                                                    disabled={isDetecting || !!result}
                                                    className={`w-full flex gap-2 transition-all ${!!result ? "" : "gradient-secondary text-secondary-foreground shadow-md hover:scale-[1.02]"
                                                        }`}
                                                >
                                                    <Volume2 className="w-4 h-4" />
                                                    {isDetecting ? "Analyzing..." : "Analyze Audio"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </MobileLayout>
        </>
    );
};

export default AudioDetection;
