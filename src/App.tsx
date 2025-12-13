import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { AuthProvider } from "@/hooks/useAuth";
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
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
                  
                  {/* Protected routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<RouteGuard><Dashboard /></RouteGuard>} />
                    <Route path="/my-work" element={<RouteGuard><MyWork /></RouteGuard>} />
                    <Route path="/leads" element={<RouteGuard><Leads /></RouteGuard>} />
                    <Route path="/clients" element={<RouteGuard><Clients /></RouteGuard>} />
                    <Route path="/contacts" element={<RouteGuard><Contacts /></RouteGuard>} />
                    <Route path="/engagements" element={<RouteGuard><Engagements /></RouteGuard>} />
                    <Route path="/extra-work" element={<RouteGuard><ExtraWork /></RouteGuard>} />
                    <Route path="/invoicing" element={<RouteGuard><Invoicing /></RouteGuard>} />
                    <Route path="/creative-boost" element={<RouteGuard><CreativeBoost /></RouteGuard>} />
                    <Route path="/services" element={<RouteGuard><Services /></RouteGuard>} />
                    <Route path="/colleagues" element={<RouteGuard><Colleagues /></RouteGuard>} />
                    <Route path="/analytics" element={<RouteGuard><Analytics /></RouteGuard>} />
                    <Route path="/settings" element={<RouteGuard><Settings /></RouteGuard>} />
                    <Route path="/notifications" element={<RouteGuard><Notifications /></RouteGuard>} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LeadsDataProvider>
        </CreativeBoostProvider>
      </CRMDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
