import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Focus, Loader2, AlertCircle, X, StopCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Detection = () => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attach stream when camera becomes active and ref is available
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [isCameraActive]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setError(null);
      setResultImageUrl(null);

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResultImageUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startCamera = async () => {
    try {
      clearSelection();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true // Use default camera to avoid black screen on desktop
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Please allow camera access to use this feature.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setSelectedImage(file);

            const objectUrl = URL.createObjectURL(blob);
            setPreviewUrl(objectUrl);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    setIsDetecting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      const response = await fetch("http://localhost:5000/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // The backend returns an image directly
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResultImageUrl(imageUrl);

      toast({
        title: "Detection Complete",
        description: "YOLO inference successfully processed your image.",
        variant: "default",
      });

    } catch (err) {
      console.error("Detection error:", err);
      setError("Failed to process image. Ensure the Python backend is running on port 5000.");
      toast({
        title: "Detection Failed",
        description: "Failed to connect to the backend server.",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Detector" showBack={true} />

      <div className="p-4 space-y-6 animate-fade-in pb-20">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-md">
              <Focus className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">AI Intrusion Detection</h2>
          </div>

          <Card className="border-border shadow-lg overflow-hidden bg-card transition-all hover:shadow-xl">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">YOLO Inference</CardTitle>
              <CardDescription>Upload an image or frame for real-time object detection analysis.</CardDescription>
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
                {/* Camera View */}
                {isCameraActive && !previewUrl && !resultImageUrl && (
                  <div className="relative rounded-xl overflow-hidden border bg-black flex flex-col items-center justify-center min-h-[300px]">
                    <video
                      ref={videoRef}
                      className="w-full h-[60vh] object-cover"
                      playsInline
                      muted
                      autoPlay
                    />

                    {/* Hidden canvas for capturing the frame */}
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full w-12 h-12 shadow-lg"
                        onClick={stopCamera}
                      >
                        <X className="w-6 h-6" />
                      </Button>
                      <Button
                        size="icon"
                        className="rounded-full w-16 h-16 shadow-lg border-4 border-white bg-primary hover:bg-primary/90"
                        onClick={captureImage}
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                {!isCameraActive && !previewUrl && !resultImageUrl && (
                  <div
                    className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:bg-muted/40 hover:border-primary/50 transition-colors group flex flex-col items-center"
                  >
                    <div
                      className="w-full flex-1 mb-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">Tap to Upload Media</h3>
                      <p className="text-xs text-muted-foreground">Supported format: JPG, PNG</p>
                    </div>

                    <div className="relative w-full flex items-center py-4">
                      <div className="flex-grow border-t border-muted/50"></div>
                      <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground">OR</span>
                      <div className="flex-grow border-t border-muted/50"></div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={(e) => { e.stopPropagation(); startCamera(); }}
                    >
                      <Camera className="mr-2 w-4 h-4" /> Open Web Camera
                    </Button>
                  </div>
                )}

                {/* Preview / Result Area */}
                {(!isCameraActive && (previewUrl || resultImageUrl)) && (
                  <div className="relative rounded-xl overflow-hidden border bg-black/5 flex items-center justify-center min-h-[300px]">
                    <img
                      src={resultImageUrl || previewUrl!}
                      alt="Detection Preview"
                      className="max-w-full max-h-[60vh] object-contain animate-in fade-in zoom-in-95 duration-300"
                    />

                    {isDetecting && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="relative mb-4">
                          <Loader2 className="w-12 h-12 text-primary animate-spin" />
                          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-ping opacity-30"></div>
                        </div>
                        <p className="font-semibold text-primary animate-pulse tracking-wide">Running YOLO Model...</p>
                      </div>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant={previewUrl ? "outline" : "secondary"}
                    className="w-full flex gap-2 items-center"
                    onClick={previewUrl ? clearSelection : () => startCamera()}
                    disabled={isDetecting || isCameraActive}
                  >
                    {previewUrl ? (
                      "Clear Selection"
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Capture Image
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleDetect}
                    disabled={!selectedImage || isDetecting || !!resultImageUrl}
                    className={`w-full flex gap-2 transition-all ${(!selectedImage || !!resultImageUrl) ? "" : "gradient-primary text-primary-foreground shadow-md glow-primary hover:scale-[1.02]"
                      }`}
                  >
                    <Focus className="w-4 h-4" />
                    {isDetecting ? "Processing..." : "Run Detection"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Detection;
