
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-secondary/50 border-t border-border pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            <span className="font-bold text-xl">BMS Clean Care</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Empowering our community to build a cleaner, safer, and more sustainable campus environment together.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-6">Quick Links</h3>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
                            <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
                            <li><Link to="/signup" className="text-muted-foreground hover:text-primary transition-colors">Sign Up</Link></li>
                            <li><Link to="/raise-complaint" className="text-muted-foreground hover:text-primary transition-colors">Raise Complaint</Link></li>
                            <li><Link to="/feedback" className="text-muted-foreground hover:text-primary transition-colors">Feedback</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-bold text-lg mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-muted-foreground">
                                <MapPin className="h-5 w-5 text-primary shrink-0" />
                                <span>BMS Institute of Technology,<br />Bangalore, Karnataka</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+91 9663845311</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>help@bmsit.in</span>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="font-bold text-lg mb-6">Follow Us</h3>
                        <div className="flex gap-4">
                            <a href="#" className="bg-background p-2 rounded-full shadow hover:text-primary hover:-translate-y-1 transition-all"><Facebook className="h-5 w-5" /></a>
                            <a href="#" className="bg-background p-2 rounded-full shadow hover:text-primary hover:-translate-y-1 transition-all"><Twitter className="h-5 w-5" /></a>
                            <a href="#" className="bg-background p-2 rounded-full shadow hover:text-primary hover:-translate-y-1 transition-all"><Instagram className="h-5 w-5" /></a>
                            <a href="#" className="bg-background p-2 rounded-full shadow hover:text-primary hover:-translate-y-1 transition-all"><Linkedin className="h-5 w-5" /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border/50 pt-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <p>&copy; {new Date().getFullYear()} Campus Clean Care. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by <span className="font-semibold text-foreground">Campus Tech Team</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
