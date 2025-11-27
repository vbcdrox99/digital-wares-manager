import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import FAQPage from "./pages/FAQPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RafflePage from "./pages/RafflePage";
import SellPage from "./pages/SellPage";
import SellerDemoPage from "./pages/SellerDemoPage";
import SellerAreaPage from "./pages/SellerAreaPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos por 5 min
      gcTime: 10 * 60 * 1000, // 10 minutos - dados mantidos em cache por 10 min
      refetchOnWindowFocus: false, // Não recarregar ao focar na janela
      refetchOnMount: false, // Não recarregar ao montar se dados estão frescos
      retry: 2, // Tentar novamente 2 vezes em caso de erro
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Delay exponencial
    },
    mutations: {
      retry: 1, // Tentar novamente 1 vez para mutations
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/sorteio" element={<RafflePage />} />
              <Route path="/item/:id" element={<ItemDetailPage />} />
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/quero-vender" element={<SellPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/seller/:id" element={<SellerDemoPage />} />
              <Route path="/area-do-vendedor" element={
                <ProtectedRoute>
                  <SellerAreaPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <Index />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
