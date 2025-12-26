
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface Feedback {
    id: string;
    created_at: string;
    email?: string;
    message: string;
}

interface AdminFeedbackListProps {
    feedback: Feedback[];
}

const AdminFeedbackList = ({ feedback }: AdminFeedbackListProps) => {
    return (
        <Card>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedback.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    No feedback yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            feedback.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell>
                                        {new Date(f.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{f.email || "Anonymous"}</TableCell>
                                    <TableCell className="max-w-md">{f.message}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
};

export default AdminFeedbackList;
