export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
export type Category = 'Cleaning' | 'Electrical' | 'Plumbing' | 'Water' | 'Furniture' | 'Others';
export type Role = 'Student' | 'Lecturer' | 'Admin' | 'Staff';

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: Role;
    department: string;
    created_at: string;
}

export interface Complaint {
    id: string;
    title: string;
    description: string;
    location: string;
    status: Status;
    priority: Priority;
    category: Category;

    // User info (Requester)
    user_id: string;
    user_name?: string;
    user_email?: string;

    // Evidence
    photo_name?: string;
    photoUrl?: string; // Signed URL for display

    // Assignment & Resolution
    assigned_to?: string | null; // UUID
    assigned_to_name?: string; // Helper for display
    assigned_to_user?: UserProfile; // Joined profile
    resolution_notes?: string | null;
    resolved_at?: string | null;
    resolution_photo_name?: string | null;  // Staff's "done work" evidence
    resolutionPhotoUrl?: string | null;     // Signed URL for display

    // Timestamps
    created_at: string;
    updated_at?: string;
}

export interface DashboardStats {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
}

export type NotificationType = 'info' | 'success' | 'warning';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    complaint_id?: string | null;
    created_at: string;
}
