import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Upload } from "lucide-react";

import { supabase } from "@/lib/supabase";

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    photo: null as File | null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Strict validation
    if (!formData.title?.trim() || !formData.location?.trim() || !formData.description?.trim() || !formData.photo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields (Title, Location, Description) and upload a photo.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 1. Upload photo to Supabase Storage
      const file = formData.photo;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Save Complaint with Photo Path (Not URL, so we can sign it later)
      const { error: dbError } = await supabase.from('complaints').insert({
        user_id: session.user.id,
        user_email: session.user.email,
        user_name: session.user.user_metadata?.full_name || "Unknown User",
        title: formData.title,
        location: formData.location,
        description: formData.description,
        status: "Pending",
        photo_name: filePath, // Store the path (e.g. "user_id/image.png")
      });

      if (dbError) throw dbError;

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

                <div className="space-y-2">
                  <Label htmlFor="photo">Photo Evidence *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                      className="cursor-pointer"
                      required
                    />
                    {formData.photo && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {formData.photo.name}
                      </p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Complaint"}
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
