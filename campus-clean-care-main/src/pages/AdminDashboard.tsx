import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ExternalLink, Check, X, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminFeedbackList from "@/components/AdminFeedbackList";

interface Complaint {
    id: string;
    title: string;
    location: string;
    status: string;
    date: string;
    user_id: string;
    description: string;
    photo_name?: string;
    photoUrl?: string; // Signed URL
    userName?: string; // To display who raised it
    userEmail?: string;
}

interface Feedback {
    id: string;
    created_at: string;
    email?: string;
    message: string;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("");

    const [feedback, setFeedback] = useState<Feedback[]>([]);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/login");
            return;
        }

        const role = session.user.user_metadata?.role;
        if (role !== "Admin") {
            toast({
                title: "Access Denied",
                description: "You do not have permission to view this page.",
                variant: "destructive",
            });
            navigate("/dashboard");
            return;
        }

        setUserRole(role);
        fetchAllComplaints();
        fetchFeedback();
    };

    const fetchAllComplaints = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped = await Promise.all(data.map(async (c: any) => {
                    let photoUrl = null;
                    if (c.photo_name) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('complaint-photos')
                            .createSignedUrl(c.photo_name, 3600);
                        if (signedError) console.error(signedError);
                        photoUrl = signedData?.signedUrl;
                    }
                    return {
                        id: c.id,
                        title: c.title,
                        location: c.location,
                        status: c.status,
                        description: c.description,
                        date: c.created_at,
                        user_id: c.user_id,
                        photoUrl,
                        userName: c.user_name || "Unknown",
                        userEmail: c.user_email
                    };
                }));
                setComplaints(mapped);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setFeedback(data);
        } catch (error: any) {
            console.error("Error fetching feedback:", error);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Status Updated", description: `Complaint marked as ${newStatus}` });
            setComplaints(complaints.map(c => c.id === id ? { ...c, status: newStatus } : c));
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    };

    if (!userRole) return null;

    const pendingComplaints = complaints.filter(c => c.status === "Pending");
    const resolvedComplaints = complaints.filter(c => c.status === "Resolved");

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage and resolve campus issues</p>
                    </div>
                </div>

                <Tabs defaultValue="complaints" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="complaints">Complaints</TabsTrigger>
                        <TabsTrigger value="feedback">User Feedback</TabsTrigger>
                    </TabsList>

                    <TabsContent value="complaints">
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="mb-4 bg-muted/50">
                                <TabsTrigger value="all">All ({complaints.length})</TabsTrigger>
                                <TabsTrigger value="pending">Pending ({pendingComplaints.length})</TabsTrigger>
                                <TabsTrigger value="resolved">Resolved ({resolvedComplaints.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all"><ComplaintTable complaints={complaints} onUpdateStatus={updateStatus} /></TabsContent>
                            <TabsContent value="pending"><ComplaintTable complaints={pendingComplaints} onUpdateStatus={updateStatus} /></TabsContent>
                            <TabsContent value="resolved"><ComplaintTable complaints={resolvedComplaints} onUpdateStatus={updateStatus} /></TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="feedback">
                        <AdminFeedbackList feedback={feedback} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

// Sub-component for table
const ComplaintTable = ({ complaints, onUpdateStatus }: { complaints: Complaint[], onUpdateStatus: (id: string, status: string) => void }) => {
    if (complaints.length === 0) return <div className="text-center py-8 text-muted-foreground">No complaints found.</div>;

    return (
        <Card>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Evidence</TableHead>
                            <TableHead>Title & Description</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {complaints.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{c.userName || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground">{c.userEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {c.photoUrl ? (
                                        <a href={c.photoUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={c.photoUrl} alt="Evidence" className="h-16 w-24 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                                        </a>
                                    ) : <span className="text-xs text-muted-foreground">No IMG</span>}
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <div className="font-semibold">{c.title}</div>
                                    <div className="text-sm text-muted-foreground truncate" title={c.description}>{c.description}</div>
                                </TableCell>
                                <TableCell>{c.location}</TableCell>
                                <TableCell className="text-sm">{new Date(c.date).toLocaleDateString()}</TableCell>
                                <TableCell><StatusBadge status={c.status} /></TableCell>
                                <TableCell>
                                    <Select defaultValue={c.status} onValueChange={(val) => onUpdateStatus(c.id, val)}>
                                        <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "Pending": return <Badge variant="secondary">Pending</Badge>;
        case "Resolved": return <Badge className="bg-green-600">Resolved</Badge>;
        case "Rejected": return <Badge variant="destructive">Rejected</Badge>;
        case "In Progress": return <Badge className="bg-blue-600">In Progress</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

export default AdminDashboard;
