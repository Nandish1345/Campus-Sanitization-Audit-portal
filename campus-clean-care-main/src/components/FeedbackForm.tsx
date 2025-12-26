
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

const FeedbackForm = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!formData.message.trim()) {
            toast({
                title: "Message Required",
                description: "Please enter your feedback message.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.from('feedback').insert({
                email: formData.email || null,
                message: formData.message,
            });

            if (error) throw error;

            toast({
                title: "Thank you!",
                description: "Your feedback has been submitted successfully.",
            });

            setFormData({ email: "", message: "" });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit feedback",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    <CardTitle>We Value Your Feedback</CardTitle>
                </div>
                <CardDescription>
                    Help us improve Campus Clean Care. Let us know what you think!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                            id="message"
                            placeholder="Tell us what you like or what we can improve..."
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                        {isLoading ? "Submitting..." : "Submit Feedback"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default FeedbackForm;
