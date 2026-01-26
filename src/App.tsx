import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { AuthProvider } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/useUserRole";
import { CRMDataProvider } from "@/hooks/useCRMData";
import { LeadsDataProvider } from "@/hooks/useLeadsData";
import { CreativeBoostProvider } from "@/hooks/useCreativeBoostData";
import { ApplicantsDataProvider } from "@/hooks/useApplicantsData";
import { MeetingsDataProvider } from "@/hooks/useMeetingsData";
import { FeedbackProvider } from "@/hooks/useFeedbackData";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Contacts from "./pages/Contacts";
import Leads from "./pages/Leads";
import Engagements from "./pages/Engagements";
import Modifications from "./pages/Modifications";
import Invoicing from "./pages/Invoicing";
import CreativeBoost from "./pages/CreativeBoost";
import Services from "./pages/Services";
import Colleagues from "./pages/Colleagues";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ExtraWork from "./pages/ExtraWork";
import MyWork from "./pages/MyWork";
import Recruitment from "./pages/Recruitment";
import Meetings from "./pages/Meetings";
import Upsells from "./pages/Upsells";
import ApplicantOnboardingForm from "./pages/ApplicantOnboardingForm";
import NotFound from "./pages/NotFound";
import OnboardingForm from "./pages/OnboardingForm";
import Notifications from "./pages/Notifications";
import Feedback from "./pages/Feedback";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import PublicOfferPage from "./pages/PublicOfferPage";
import UpgradeOfferPage from "./pages/UpgradeOfferPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserRoleProvider>
        <CRMDataProvider>
          <CreativeBoostProvider>
            <LeadsDataProvider>
              <ApplicantsDataProvider>
                <MeetingsDataProvider>
                  <FeedbackProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <Routes>
                          {/* Public routes */}
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/onboarding/:leadId" element={<OnboardingForm />} />
                          <Route path="/applicant-onboarding/:applicantId" element={<ApplicantOnboardingForm />} />
                          <Route path="/offer/:token" element={<PublicOfferPage />} />
                          <Route path="/offer-test" element={<PublicOfferPage testToken="test-nabidka-123" />} />
                          <Route path="/upgrade/:token" element={<UpgradeOfferPage />} />
                          
                          {/* Protected routes */}
                          <Route element={<RouteGuard><AppLayout /></RouteGuard>}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/my-work" element={<MyWork />} />
                            <Route path="/leads" element={<Leads />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/contacts" element={<Contacts />} />
                            <Route path="/engagements" element={<Engagements />} />
                            <Route path="/modifications" element={<Modifications />} />
                            <Route path="/extra-work" element={<ExtraWork />} />
                            <Route path="/upsells" element={<Upsells />} />
                            <Route path="/invoicing" element={<Invoicing />} />
                            <Route path="/creative-boost" element={<CreativeBoost />} />
                            <Route path="/meetings" element={<Meetings />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/colleagues" element={<Colleagues />} />
                            <Route path="/recruitment" element={<Recruitment />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/feedback" element={<Feedback />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </TooltipProvider>
                  </FeedbackProvider>
                </MeetingsDataProvider>
              </ApplicantsDataProvider>
            </LeadsDataProvider>
          </CreativeBoostProvider>
        </CRMDataProvider>
      </UserRoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
