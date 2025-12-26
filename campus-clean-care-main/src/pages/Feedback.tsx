
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeedbackForm from "@/components/FeedbackForm";

const Feedback = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-32 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Feedback</h1>
                    <p className="text-muted-foreground text-lg">
                        Your input helps us create a better environment for everyone.
                    </p>
                </div>
                <div className="w-full">
                    <FeedbackForm />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Feedback;
