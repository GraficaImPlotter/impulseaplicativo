import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// ── Lazy-loaded pages (code splitting) ──────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Sales = lazy(() => import("./pages/Sales"));
const Projects = lazy(() => import("./pages/Projects"));
const Funnel = lazy(() => import("./pages/Funnel"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Financial = lazy(() => import("./pages/Financial"));
const FinancialReceivables = lazy(() => import("./pages/FinancialReceivables"));
const FinancialPayables = lazy(() => import("./pages/FinancialPayables"));
const SolarCalculator = lazy(() => import("./pages/SolarCalculator"));
const Settings = lazy(() => import("./pages/Settings"));
const Employees = lazy(() => import("./pages/Employees"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Agenda = lazy(() => import("./pages/Agenda"));
const DevSettings = lazy(() => import("./pages/DevSettings"));
const MyArea = lazy(() => import("./pages/MyArea"));
const QuoteSignature = lazy(() => import("./pages/QuoteSignature"));
const ServiceOrders = lazy(() => import("./pages/ServiceOrders"));
const DroneServices = lazy(() => import("./pages/DroneServices"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ── QueryClient with global cache defaults ──────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 min — avoid redundant refetches
      gcTime: 10 * 60 * 1000,         // 10 min — keep in cache
      retry: 1,                        // Only 1 retry instead of 3
      refetchOnWindowFocus: false,     // Don't refetch on tab focus
    },
  },
});

// ── Page loading fallback ───────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              {/* Public route for client signature */}
              <Route path="/orcamento/:token" element={<QuoteSignature />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute allowedRoles={['MASTER', 'ENGENHEIRO', 'VENDEDOR', 'FINANCEIRO', 'COMPRAS']}><Sales /></ProtectedRoute>} />
              <Route path="/funnel" element={<ProtectedRoute><Funnel /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV']}><Suppliers /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV', 'COMPRAS']}><Inventory /></ProtectedRoute>} />
              <Route path="/financial" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV', 'FINANCEIRO']}><Financial /></ProtectedRoute>} />
              <Route path="/financial/receivables" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV', 'FINANCEIRO']}><FinancialReceivables /></ProtectedRoute>} />
              <Route path="/financial/payables" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV', 'FINANCEIRO']}><FinancialPayables /></ProtectedRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><SolarCalculator /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV']}><Settings /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute allowedRoles={['MASTER', 'DEV']}><Employees /></ProtectedRoute>} />
              <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
              <Route path="/my-area" element={<ProtectedRoute><MyArea /></ProtectedRoute>} />
              <Route path="/service-orders" element={<ProtectedRoute><ServiceOrders /></ProtectedRoute>} />
              <Route path="/drone" element={<ProtectedRoute><DroneServices /></ProtectedRoute>} />
              <Route path="/dev" element={<ProtectedRoute allowedRoles={['DEV']}><DevSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
