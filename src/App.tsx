
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import QRCode from "./pages/QRCode";
import LeadForm from "./pages/LeadForm";
import Apresentacao from "./pages/Apresentacao";
import SecretInstall from "./pages/SecretInstall";
import APIs from "./pages/APIs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/apis" element={<APIs />} />
            <Route path="/qr-code" element={<QRCode />} />
            <Route path="/qr/:trackingId" element={<LeadForm />} />
            <Route path="/evento/:eventId" element={<LeadForm />} />
            <Route path="/apresentacao/:eventId" element={<Apresentacao />} />
            <Route path="/secret-install" element={<SecretInstall />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
