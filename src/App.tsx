import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
// TEMPORARILY DISABLED - Supabase dependencies
// import { RouteGuard } from "@/components/layout/RouteGuard";
// import { AuthProvider } from "@/hooks/useAuth";
import { CRMDataProvider } from "@/hooks/useCRMData";
import { LeadsDataProvider } from "@/hooks/useLeadsData";
import { CreativeBoostProvider } from "@/hooks/useCreativeBoostData";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Contacts from "./pages/Contacts";
import Leads from "./pages/Leads";
import Engagements from "./pages/Engagements";
import Invoicing from "./pages/Invoicing";
import CreativeBoost from "./pages/CreativeBoost";
import Services from "./pages/Services";
import Colleagues from "./pages/Colleagues";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ExtraWork from "./pages/ExtraWork";
import MyWork from "./pages/MyWork";
import NotFound from "./pages/NotFound";
import OnboardingForm from "./pages/OnboardingForm";
import Notifications from "./pages/Notifications";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

// App component with all providers
// NOTE: AuthProvider and RouteGuard temporarily disabled
const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* TEMPORARILY DISABLED - AuthProvider */}
    <CRMDataProvider>
      <CreativeBoostProvider>
        <LeadsDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding/:leadId" element={<OnboardingForm />} />
              
              {/* Routes - RouteGuard temporarily disabled */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/my-work" element={<MyWork />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/engagements" element={<Engagements />} />
                <Route path="/extra-work" element={<ExtraWork />} />
                <Route path="/invoicing" element={<Invoicing />} />
                <Route path="/creative-boost" element={<CreativeBoost />} />
                <Route path="/services" element={<Services />} />
                <Route path="/colleagues" element={<Colleagues />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LeadsDataProvider>
    </CreativeBoostProvider>
  </CRMDataProvider>
  </QueryClientProvider>
);

export default App;
