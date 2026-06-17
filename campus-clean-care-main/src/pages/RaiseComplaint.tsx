import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Upload, Camera, X, RefreshCw, ImageIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Category, Priority } from "@/types";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";
import { notifyAllAdmins } from "@/hooks/use-notifications";

type EvidenceMode = "upload" | "camera";

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<EvidenceMode>("upload");

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // base64 preview
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    category: "" as Category,
    priority: "Medium" as Priority,
    description: "",
    photo: null as File | null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Access Restricted",
          description: "Please sign up to raise a complaint",
          variant: "destructive",
        });
        navigate("/signup");
      }
    });
  }, [navigate, toast]);

  // ── Camera helpers ────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
      }
    } catch (err: any) {
      toast({
        title: "Camera Error",
        description: err.message || "Could not access camera. Please allow camera permission.",
        variant: "destructive",
      });
      setEvidenceMode("upload");
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  // Start / stop camera when mode changes
  useEffect(() => {
    if (evidenceMode === "camera") {
      setCapturedImage(null);
      setFormData((fd) => ({ ...fd, photo: null }));
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => {
      // Cleanup on unmount
      if (evidenceMode === "camera") stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenceMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);

    // Convert dataURL → File for upload
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        setFormData((fd) => ({ ...fd, photo: file }));
      }
    }, "image/jpeg", 0.9);

    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setFormData((fd) => ({ ...fd, photo: null }));
    startCamera();
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.title?.trim() || !formData.category || !formData.location?.trim() || !formData.description?.trim() || !formData.photo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and provide a photo (upload or capture).",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const file = formData.photo;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("complaint-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("complaints").insert({
        user_id: session.user.id,
        user_email: session.user.email,
        user_name: session.user.user_metadata?.full_name || "Unknown User",
        title: formData.title,
        location: formData.location,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        status: "Pending",
        photo_name: filePath,
      });

      if (dbError) throw dbError;

      // Notify all admins about the new complaint
      await notifyAllAdmins(
        "🆕 New Complaint Raised",
        `"${formData.title}" was reported at ${formData.location} (${formData.category} · ${formData.priority} priority).`
      );

      toast({
        title: "Success!",
        description: "Complaint and photo submitted successfully!",
      });

      navigate("/view-complaints");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit complaint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Raise a Complaint</h1>
            <p className="text-muted-foreground">Help us maintain campus hygiene by reporting issues</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Complaint Details</CardTitle>
              <CardDescription>Fill in the form below to submit your complaint</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Complaint Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief title of the issue"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, category: value as Category })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, location: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hostel">Hostel</SelectItem>
                      <SelectItem value="Canteen">Canteen</SelectItem>
                      <SelectItem value="Classroom">Classroom</SelectItem>
                      <SelectItem value="Library">Library</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the sanitization issue in detail..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* ── Photo Evidence ────────────────────────────────── */}
                <div className="space-y-3">
                  <Label>Photo Evidence *</Label>

                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={evidenceMode === "upload" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEvidenceMode("upload")}
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Upload Photo
                    </Button>
                    <Button
                      type="button"
                      variant={evidenceMode === "camera" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEvidenceMode("camera")}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Use Camera
                    </Button>
                  </div>

                  {/* ── Upload mode ── */}
                  {evidenceMode === "upload" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                        className="cursor-pointer"
                      />
                      {formData.photo && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {formData.photo.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Camera mode ── */}
                  {evidenceMode === "camera" && (
                    <div className="rounded-lg overflow-hidden border border-border bg-black relative">
                      {/* Hidden canvas for capture */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Captured preview */}
                      {capturedImage ? (
                        <div className="relative">
                          <img
                            src={capturedImage}
                            alt="Captured evidence"
                            className="w-full object-cover rounded-lg"
                            style={{ maxHeight: "360px" }}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={retakePhoto}
                              className="flex items-center gap-1 shadow-lg"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Retake
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setCapturedImage(null);
                                setFormData((fd) => ({ ...fd, photo: null }));
                                setEvidenceMode("upload");
                              }}
                              className="shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                            <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                              ✓ Photo captured
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Live viewfinder */
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-lg"
                            style={{ maxHeight: "360px", objectFit: "cover" }}
                          />
                          {!isCameraReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                              Starting camera…
                            </div>
                          )}
                          {/* Viewfinder corners */}
                          {isCameraReady && (
                            <>
                              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl" />
                              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr" />
                              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl" />
                              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br" />
                            </>
                          )}
                          {/* Capture button */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              disabled={!isCameraReady}
                              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              title="Capture Photo"
                            >
                              <Camera className="h-7 w-7 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* ─────────────────────────────────────────────────── */}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Submitting…" : "Submit Complaint"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RaiseComplaint;
