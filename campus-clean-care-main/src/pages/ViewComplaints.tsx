import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Search, ExternalLink, CheckCircle, PlayCircle, Camera, Upload, ImageIcon, RefreshCw, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Complaint } from "@/types";
import { sendNotification } from "@/hooks/use-notifications";

type EvidenceMode = "upload" | "camera";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Low': return 'bg-green-500 hover:bg-green-600';
    case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'High': return 'bg-orange-500 hover:bg-orange-600';
    case 'Critical': return 'bg-red-500 hover:bg-red-600';
    default: return 'bg-gray-500';
  }
};

const ViewComplaints = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog state for Staff
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '' as any,
    resolution_notes: ''
  });

  // Resolution photo state
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null);
  const [evidenceMode, setEvidenceMode] = useState<EvidenceMode>("upload");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `resolution-${Date.now()}.jpg`, { type: "image/jpeg" });
        setResolutionPhoto(file);
      }
    }, "image/jpeg", 0.9);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResolutionPhoto(null);
    startCamera();
  };

  const resetPhotoState = () => {
    stopCamera();
    setCapturedImage(null);
    setResolutionPhoto(null);
    setEvidenceMode("upload");
    setIsCameraReady(false);
  };

  // Start / stop camera when mode changes
  useEffect(() => {
    if (evidenceMode === "camera" && isDialogOpen && updateForm.status === "Resolved") {
      setCapturedImage(null);
      setResolutionPhoto(null);
      startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenceMode, isDialogOpen]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const role = session.user.user_metadata?.role;
      setUserRole(role || "");

      let query = supabase.from('complaints').select('*');
      if (role === 'Staff') {
        query = query.eq('assigned_to', session.user.id);
      } else {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      if (data) {
        const mappedComplaints = await Promise.all(data.map(async (c: any) => {
          let photoUrl = null;
          if (c.photo_name) {
            const { data: sd } = await supabase.storage
              .from('complaint-photos')
              .createSignedUrl(c.photo_name, 3600);
            photoUrl = sd?.signedUrl;
          }

          let resolutionPhotoUrl = null;
          if (c.resolution_photo_name) {
            const { data: rd } = await supabase.storage
              .from('complaint-photos')
              .createSignedUrl(c.resolution_photo_name, 3600);
            resolutionPhotoUrl = rd?.signedUrl;
          }

          return {
            ...c,
            status: c.status as any,
            priority: c.priority as any,
            category: c.category as any,
            photoUrl,
            resolutionPhotoUrl,
          };
        }));
        setComplaints(mappedComplaints);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [navigate]);

  // ── Dialog open / close ───────────────────────────────────────────────────

  const handleUpdateStatus = (complaint: Complaint) => {
    resetPhotoState();
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status as any,
      resolution_notes: complaint.resolution_notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) resetPhotoState();
    setIsDialogOpen(open);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleUpdateSubmit = async () => {
    if (!selectedComplaint) return;
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const updates: any = {
        status: updateForm.status,
        resolution_notes: updateForm.resolution_notes || null,
        updated_at: new Date().toISOString()
      };

      if (updateForm.status === 'Resolved') {
        updates.resolved_at = new Date().toISOString();

        // Upload resolution photo if provided
        if (resolutionPhoto) {
          const ext = resolutionPhoto.name.split('.').pop();
          const filePath = `${session.user.id}/resolution-${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('complaint-photos')
            .upload(filePath, resolutionPhoto);
          if (uploadError) throw uploadError;
          updates.resolution_photo_name = filePath;
        }

        // Notify the original complaint raiser
        if (selectedComplaint.user_id) {
          await sendNotification(
            selectedComplaint.user_id,
            "✅ Your Complaint Has Been Resolved",
            `Your complaint "${selectedComplaint.title}" at ${selectedComplaint.location} has been resolved. ${updateForm.resolution_notes ? `Note: ${updateForm.resolution_notes}` : ""}`.trim(),
            "success",
            selectedComplaint.id
          );
        }
      }

      const { error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      toast({
        title: "✅ Task Updated",
        description: updateForm.status === 'Resolved'
          ? "Marked as resolved with evidence."
          : "Status updated successfully.",
      });
      setIsDialogOpen(false);
      resetPhotoState();
      fetchComplaints();
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const filteredComplaints = complaints.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    if (status === "Pending")
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Pending</Badge>;
    if (status === "In Progress")
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">In Progress</Badge>;
    if (status === "Resolved")
      return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Resolved</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {userRole === 'Staff' ? 'Your Assigned Tasks' : 'Your Complaints'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'Staff'
              ? 'Manage and resolve sanitization tasks assigned to you'
              : 'Track all your submitted complaints'}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{userRole === 'Staff' ? 'Tasks Overview' : 'Complaints Overview'}</CardTitle>
            <CardDescription>Search and filter {userRole === 'Staff' ? 'tasks' : 'complaints'}</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No {userRole === 'Staff' ? 'tasks' : 'complaints'} found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Work Done Photo</TableHead>
                      <TableHead>Date</TableHead>
                      {userRole === 'Staff' && <TableHead>Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplaints.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">#{complaint.id.slice(-6)}</TableCell>
                        <TableCell className="font-medium">{complaint.title}</TableCell>
                        <TableCell>{complaint.location}</TableCell>
                        <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                        <TableCell>{complaint.category || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${getPriorityColor(complaint.priority)} border-0`}>
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        {/* Original complaint photo */}
                        <TableCell>
                          {complaint.photoUrl ? (
                            <a href={complaint.photoUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" /> View
                              </Button>
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">No photo</span>
                          )}
                        </TableCell>
                        {/* Resolution evidence photo — visible to ALL roles */}
                        <TableCell>
                          {complaint.status === 'Resolved' && complaint.resolutionPhotoUrl ? (
                            <a href={complaint.resolutionPhotoUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {userRole === 'Staff' ? 'Done Photo' : 'View Proof'}
                              </Button>
                            </a>
                          ) : complaint.status === 'Resolved' ? (
                            <span className="text-muted-foreground text-sm italic">No photo</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </TableCell>
                        {userRole === 'Staff' && (
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(complaint)}>
                              Manage
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Update Task Dialog ─────────────────────────────────────────── */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Task Status</DialogTitle>
              <DialogDescription>
                Update the progress of this sanitization task.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Status buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant={updateForm.status === 'In Progress' ? 'default' : 'outline'}
                  onClick={() => {
                    setUpdateForm({ ...updateForm, status: 'In Progress' });
                    resetPhotoState();
                  }}
                  className="flex-1"
                >
                  <PlayCircle className="mr-2 h-4 w-4" /> In Progress
                </Button>
                <Button
                  type="button"
                  variant={updateForm.status === 'Resolved' ? 'default' : 'outline'}
                  onClick={() => setUpdateForm({ ...updateForm, status: 'Resolved' })}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Resolved
                </Button>
              </div>

              {/* Resolution Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Resolution Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe what was done…"
                  value={updateForm.resolution_notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resolution_notes: e.target.value })}
                />
              </div>

              {/* ── Resolution Photo (only when marking Resolved) ── */}
              {updateForm.status === 'Resolved' && (
                <div className="grid gap-3">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    Done-Work Evidence Photo
                    <span className="text-xs text-muted-foreground font-normal">(optional but recommended)</span>
                  </Label>

                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={evidenceMode === "upload" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEvidenceMode("upload")}
                      className="flex items-center gap-1"
                    >
                      <ImageIcon className="h-4 w-4" /> Upload
                    </Button>
                    <Button
                      type="button"
                      variant={evidenceMode === "camera" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEvidenceMode("camera")}
                      className="flex items-center gap-1"
                    >
                      <Camera className="h-4 w-4" /> Live Camera
                    </Button>
                  </div>

                  {/* Upload mode */}
                  {evidenceMode === "upload" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <Input
                        id="resolution-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setResolutionPhoto(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {resolutionPhoto && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          ✓ {resolutionPhoto.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Camera mode */}
                  {evidenceMode === "camera" && (
                    <div className="rounded-lg overflow-hidden border border-border bg-black relative">
                      <canvas ref={canvasRef} className="hidden" />

                      {capturedImage ? (
                        /* Captured preview */
                        <div className="relative">
                          <img
                            src={capturedImage}
                            alt="Resolution evidence"
                            className="w-full object-cover rounded-lg"
                            style={{ maxHeight: "280px" }}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={retakePhoto}
                              className="flex items-center gap-1 shadow-lg"
                            >
                              <RefreshCw className="h-3 w-3" /> Retake
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setCapturedImage(null);
                                setResolutionPhoto(null);
                                setEvidenceMode("upload");
                              }}
                              className="shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                            <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                              ✓ Evidence captured
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
                            style={{ maxHeight: "280px", objectFit: "cover" }}
                          />
                          {!isCameraReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm rounded-lg">
                              Starting camera…
                            </div>
                          )}
                          {isCameraReady && (
                            <>
                              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/70 rounded-tl" />
                              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/70 rounded-tr" />
                              <div className="absolute bottom-10 left-3 w-5 h-5 border-b-2 border-l-2 border-white/70 rounded-bl" />
                              <div className="absolute bottom-10 right-3 w-5 h-5 border-b-2 border-r-2 border-white/70 rounded-br" />
                            </>
                          )}
                          {/* Shutter button */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              disabled={!isCameraReady}
                              className="w-13 h-13 w-14 h-14 rounded-full bg-white border-4 border-gray-300 shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              title="Capture Photo"
                            >
                              <Camera className="h-6 w-6 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => { resetPhotoState(); setIsDialogOpen(false); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSubmit} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ViewComplaints;
