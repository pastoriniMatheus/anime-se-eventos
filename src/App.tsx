
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import LeadForm from "@/pages/LeadForm";
import Index from "@/pages/Index";
import QRCode from "@/pages/QRCode";
import Settings from "@/pages/Settings";
import Messages from "@/pages/Messages";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import SecretInstall from "@/pages/SecretInstall";
import Apresentacao from "@/pages/Apresentacao";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/apresentacao" element={<Apresentacao />} />
            <Route path="/form/:eventId?" element={<LeadForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/install" element={<SecretInstall />} />
            
            {/* Rotas autenticadas */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/qr-codes" element={<QRCode />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/messages" element={<Messages />} />
            
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
