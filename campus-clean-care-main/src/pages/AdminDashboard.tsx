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
import { ExternalLink, Check, X, Clock, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminFeedbackList from "@/components/AdminFeedbackList";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Complaint, UserProfile, Priority, Status, Category } from "@/types";
import { PRIORITIES, STATUSES } from "@/lib/constants";

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
    const [staffMembers, setStaffMembers] = useState<UserProfile[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);

    // Dialog State
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        status: '' as Status,
        priority: '' as Priority,
        assigned_to: '' as string,
        resolution_notes: '' as string
    });

    // Add Staff State
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', department: '' });
    const [isCreatingStaff, setIsCreatingStaff] = useState(false);

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
        setUserRole(role);
        fetchStaff();
        fetchAllComplaints();
        fetchFeedback();
    };

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'Staff');

            if (error) console.error("Error fetching staff:", error);
            if (data) setStaffMembers(data as UserProfile[]);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
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

                    // Fetch assigned staff name if available
                    let assignedToName = "Unassigned";
                    if (c.assigned_to) {
                        const { data: staffData } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', c.assigned_to)
                            .single();
                        if (staffData) assignedToName = staffData.full_name;
                    }

                    return {
                        id: c.id,
                        title: c.title,
                        location: c.location,
                        status: c.status as Status,
                        priority: c.priority as Priority,
                        category: c.category as Category,
                        description: c.description,
                        created_at: c.created_at,
                        user_id: c.user_id,
                        photoUrl,
                        user_name: c.user_name || "Unknown",
                        user_email: c.user_email,
                        assigned_to: c.assigned_to,
                        assigned_to_name: assignedToName,
                        resolution_notes: c.resolution_notes,
                        resolved_at: c.resolved_at
                    };
                }));
                // Manual Sort by Date Descending
                setComplaints(mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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

    const handleEditClick = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setUpdateForm({
            status: complaint.status as Status,
            priority: complaint.priority as Priority,
            assigned_to: complaint.assigned_to || '',
            resolution_notes: complaint.resolution_notes || ''
        });
        setIsDialogOpen(true);
    };

    const handleUpdateSubmit = async () => {
        if (!selectedComplaint) return;

        try {
            const updates: any = {
                status: updateForm.status,
                priority: updateForm.priority,
                assigned_to: (updateForm.assigned_to === 'unassigned' || !updateForm.assigned_to) ? null : updateForm.assigned_to,
                resolution_notes: updateForm.resolution_notes || null
            };

            if (updateForm.status === 'Resolved' && !selectedComplaint.resolved_at) {
                updates.resolved_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('complaints')
                .update(updates)
                .eq('id', selectedComplaint.id);

            if (error) throw error;

            toast({ title: "Success", description: "Complaint updated successfully" });
            setIsDialogOpen(false);
            fetchAllComplaints(); // Refresh list
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaff.name || !newStaff.email || !newStaff.password || !newStaff.department) {
            toast({ title: "Error", description: "All fields are required", variant: "destructive" });
            return;
        }
        setIsCreatingStaff(true);
        try {
            const { error } = await supabase.rpc('create_staff_user', {
                staff_email: newStaff.email,
                staff_password: newStaff.password,
                staff_name: newStaff.name,
                staff_department: newStaff.department
            });
            if (error) throw error;
            
            toast({ title: "Success", description: "Staff account created successfully!" });
            setIsAddStaffOpen(false);
            setNewStaff({ name: '', email: '', password: '', department: '' });
            fetchStaff(); // Refresh staff list so they appear in assignments
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingStaff(false);
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
                    <Button onClick={() => setIsAddStaffOpen(true)} className="gap-2">
                        <UserPlus className="h-4 w-4" /> Add Staff
                    </Button>
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
                            <TabsContent value="all"><ComplaintTable complaints={complaints} onEdit={handleEditClick} /></TabsContent>
                            <TabsContent value="pending"><ComplaintTable complaints={pendingComplaints} onEdit={handleEditClick} /></TabsContent>
                            <TabsContent value="resolved"><ComplaintTable complaints={resolvedComplaints} onEdit={handleEditClick} /></TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="feedback">
                        <AdminFeedbackList feedback={feedback} />
                    </TabsContent>
                </Tabs>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Update Complaint</DialogTitle>
                            <DialogDescription>
                                Modify status, priority, assignment, and add notes.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedComplaint && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">Status</Label>
                                    <Select
                                        value={updateForm.status}
                                        onValueChange={(val) => setUpdateForm({ ...updateForm, status: val as Status })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="priority" className="text-right">Priority</Label>
                                    <Select
                                        value={updateForm.priority}
                                        onValueChange={(val) => setUpdateForm({ ...updateForm, priority: val as Priority })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="assign" className="text-right">Assign To</Label>
                                    <Select
                                        value={updateForm.assigned_to}
                                        onValueChange={(val) => setUpdateForm({ ...updateForm, assigned_to: val })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {staffMembers.map(staff => (
                                                <SelectItem key={staff.id} value={staff.id}>
                                                    {staff.full_name} ({staff.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="notes" className="text-right">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        className="col-span-3"
                                        placeholder="Add resolution details..."
                                        value={updateForm.resolution_notes}
                                        onChange={(e) => setUpdateForm({ ...updateForm, resolution_notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateSubmit}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Staff Dialog */}
                <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>
                                Create a new staff account. They will be able to log in with these credentials.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddStaff}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="staff-name">Full Name</Label>
                                    <Input id="staff-name" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} placeholder="Jane Doe" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="staff-email">Email</Label>
                                    <Input id="staff-email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} placeholder="staff@campus.edu" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="staff-password">Password</Label>
                                    <Input id="staff-password" type="password" value={newStaff.password} onChange={(e) => setNewStaff({...newStaff, password: e.target.value})} placeholder="Strong password" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="staff-department">Department</Label>
                                    <Input id="staff-department" value={newStaff.department} onChange={(e) => setNewStaff({...newStaff, department: e.target.value})} placeholder="e.g. Facilities" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddStaffOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isCreatingStaff}>
                                    {isCreatingStaff ? "Creating..." : "Create Staff"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

// Sub-component for table
const ComplaintTable = ({ complaints, onEdit }: { complaints: Complaint[], onEdit: (c: Complaint) => void }) => {
    if (complaints.length === 0) return <div className="text-center py-8 text-muted-foreground">No complaints found.</div>;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Low': return 'bg-green-500 hover:bg-green-600';
            case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'High': return 'bg-orange-500 hover:bg-orange-600';
            case 'Critical': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Card>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Evidence</TableHead>
                            <TableHead>Title & Description</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Assignment</TableHead>
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
                                        <span className="font-medium text-sm">{c.user_name || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground">{c.user_email}</span>
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
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold">{c.category || 'Uncategorized'}</span>
                                        <span className="text-xs text-muted-foreground">{c.location}</span>
                                        <Badge className={`w-fit text-[10px] ${getPriorityColor(c.priority)} border-0`}>{c.priority}</Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{c.assigned_to_name || "Unassigned"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                                <TableCell><StatusBadge status={c.status} /></TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => onEdit(c)}>
                                        Manage
                                    </Button>
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
