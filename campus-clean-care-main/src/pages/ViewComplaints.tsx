import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Search, ExternalLink } from "lucide-react";

import { supabase } from "@/lib/supabase";

interface Complaint {
  id: string;
  title: string;
  location: string;
  status: string;
  date: string;
  userName: string;
  userId: string;
  photoUrl?: string;
}

const ViewComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchComplaints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        // Generate signed URLs for all photos in parallel
        const mappedComplaints = await Promise.all(data.map(async (c: any) => {
          let photoUrl = null;
          if (c.photo_name) {
            // Generate a signed URL valid for 1 hour
            const { data: signedData } = await supabase.storage
              .from('complaint-photos')
              .createSignedUrl(c.photo_name, 3600);
            photoUrl = signedData?.signedUrl;
          }

          return {
            id: c.id,
            title: c.title,
            location: c.location,
            status: c.status,
            date: c.created_at,
            userId: c.user_id,
            userName: session.user.user_metadata.full_name || "User",
            photoUrl: photoUrl
          };
        }));
        setComplaints(mappedComplaints);
      }
    };

    fetchComplaints();
  }, [navigate]);

  const filteredComplaints = complaints.filter((complaint) =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    if (status === "Pending") {
      return <Badge variant="destructive">Pending</Badge>;
    } else if (status === "Resolved") {
      return <Badge className="bg-success text-success-foreground">Resolved</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Complaints</h1>
          <p className="text-muted-foreground">Track all your submitted complaints</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Complaints Overview</CardTitle>
            <CardDescription>
              Search and filter your complaints
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, location, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No complaints found. Start by raising your first complaint!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Complaint ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplaints.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">#{complaint.id.slice(-6)}</TableCell>
                        <TableCell className="font-medium">{complaint.title}</TableCell>
                        <TableCell>{complaint.location}</TableCell>
                        <TableCell>{getStatusBadge(complaint.status)}</TableCell>
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
                        <TableCell className="text-muted-foreground">
                          {new Date(complaint.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewComplaints;
