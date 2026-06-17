import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import RaiseComplaint from "./pages/RaiseComplaint";
import ViewComplaints from "./pages/ViewComplaints";
import Feedback from "./pages/Feedback";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/raise-complaint" element={<RaiseComplaint />} />
          <Route path="/view-complaints" element={<ViewComplaints />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
