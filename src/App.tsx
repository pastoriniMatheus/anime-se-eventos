
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import QRCode from "./pages/QRCode";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import LeadForm from "./pages/LeadForm";
import Login from "./pages/Login";
import Apresentacao from "./pages/Apresentacao";
import NotFound from "./pages/NotFound";
import SecretInstall from "./pages/SecretInstall";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (typeof status === 'number' && status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  console.log('[ProtectedRoute] User:', user);
  console.log('[ProtectedRoute] Loading:', loading);
  
  if (loading) {
    console.log('[ProtectedRoute] Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('[ProtectedRoute] Usuário autenticado, mostrando conteúdo');
  return <>{children}</>;
}

function AppRoutes() {
  console.log('[AppRoutes] Renderizando rotas...');
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/apresentacao" element={<Apresentacao />} />
      <Route path="/form" element={<LeadForm />} />
      <Route path="/secret-install" element={<SecretInstall />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="qr-code" element={<QRCode />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  console.log('[App] Iniciando aplicação...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
