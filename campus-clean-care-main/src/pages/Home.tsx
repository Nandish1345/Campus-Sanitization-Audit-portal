import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Brain, CheckCircle, Upload, ArrowRight, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const Home = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Get form data
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

    try {
      const { error } = await supabase.from('feedback').insert([
        { email: email || null, message }
      ]);

      if (error) throw error;

      toast({
        title: "Feedback Sent!",
        description: "Thank you for helping us improve the campus.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-16">
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 hover:bg-primary/20 transition-colors">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold text-sm tracking-wide">Join the Clean Campus Inititaive</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold mb-8 text-foreground tracking-tight leading-tight">
            Keep Our Campus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Clean & Safe</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Empowering students and faculty to create a healthier environment. Report issues instantly and track their resolution in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                Raise a Complaint <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/50 transition-all duration-300">
                Sign Up Now
              </Button>
            </Link>
          </div>

          <div className="mt-16 relative w-full h-[400px] rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
            <img
              src="/hero-image.png"
              alt="Clean Campus"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 max-w-5xl mx-auto border-y border-border/50 py-12">
          {[
            { label: "Complaints Resolved", value: "500+", color: "text-green-500" },
            { label: "Active Students", value: "2,000+", color: "text-blue-500" },
            { label: "Avg. Resolution Time", value: "24hrs", color: "text-orange-500" },
            { label: "Cleanliness Rating", value: "4.8/5", color: "text-purple-500" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-muted-foreground font-medium text-sm uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quotes Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Why It Matters</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { quote: "Cleanliness is the hallmark of a perfect standard. The best quality inspectors are the students themselves.", author: "Campus Dean" },
              { quote: "A clean environment nurtures a clear mind. Small actions lead to big changes.", author: "Student Council" },
              { quote: "Sustainability isn't just a goal; it's a way of living on campus.", author: "Green Club" }
            ].map((item, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all hover:shadow-lg group">
                <CardContent className="pt-8 px-8">
                  <Quote className="h-10 w-10 text-primary/20 mb-4 group-hover:text-primary/40 transition-colors" />
                  <p className="text-lg text-foreground italic mb-6 leading-relaxed">"{item.quote}"</p>
                  <p className="text-sm font-bold text-primary">— {item.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to make a difference</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

            <div className="text-center group">
              <div className="w-24 h-24 bg-background border-4 border-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Snap & Upload</h3>
              <p className="text-muted-foreground leading-relaxed px-4">Take a photo of the issue. Whether it's litter, a spill, or maintenance needed.</p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-background border-4 border-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed px-4">Our system categorizes the complaint and assigns it to the right department instantly.</p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-background border-4 border-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Resolved</h3>
              <p className="text-muted-foreground leading-relaxed px-4">Admins take action. You get notified when the clean-up is complete.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is my identity anonymous?</AccordionTrigger>
              <AccordionContent>
                By default, your name and email are shared with admins to ensure the authenticity of the complaint. However, public reports do not display your personal details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How long does it take to resolve a complaint?</AccordionTrigger>
              <AccordionContent>
                Most complaints are acknowledged within 24 hours. Resolution time varies depending on the complexity of the issue, but typical turnaround is 1-3 days.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I upload detailed photos?</AccordionTrigger>
              <AccordionContent>
                Yes! It is highly recommended to upload clear photos as evidence. This helps the cleaning staff locate and understand the issue faster.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Who sees my complaints?</AccordionTrigger>
              <AccordionContent>
                Only authorized Campus Admin staff and the maintenance team have access to the full details of your complaint.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Feedback Section */}
        <div className="max-w-xl mx-auto mb-20">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Have Feedback?</h2>
                <p className="text-muted-foreground">We'd love to hear your suggestions for a cleaner campus.</p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email (Optional)</label>
                  <Input id="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Your Feedback</label>
                  <Textarea id="message" placeholder="Tell us what we can do better..." required className="min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full">Submit Feedback</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default Home;
