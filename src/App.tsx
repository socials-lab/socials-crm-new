import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { SOPDataProvider } from "@/hooks/useSOPData";
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
import MyProfile from "./pages/MyProfile";
import Recruitment from "./pages/Recruitment";
import Meetings from "./pages/Meetings";
import ApplicantOnboardingForm from "./pages/ApplicantOnboardingForm";
import NotFound from "./pages/NotFound";
import OnboardingForm from "./pages/OnboardingForm";
import Notifications from "./pages/Notifications";
import Feedback from "./pages/Feedback";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import PublicOfferPage from "./pages/PublicOfferPage";
import PublicModificationPage from "./pages/PublicModificationPage";
import ExtraWorkApproval from "./pages/ExtraWorkApproval";
import PublicCreativeBoostPage from "./pages/PublicCreativeBoostPage";
import Modifications from "./pages/Modifications";
import Upsells from "./pages/Upsells";
import Academy from "./pages/Academy";
import SOP from "./pages/SOP";
import PublicSOPPage from "./pages/PublicSOPPage";

function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.status === 401 || err.code === '401' || err.code === 'PGRST301') return true;
    const msg = String(err.message ?? '');
    if (msg.includes('JWT expired') || msg.includes('Invalid Refresh Token') || msg.includes('refresh_token_not_found')) return true;
  }
  return false;
}

let authErrorRedirecting = false;

function handleAuthError(error: unknown) {
  if (!isAuthError(error) || authErrorRedirecting) return;
  // Don't redirect if already on auth pages
  if (window.location.pathname.startsWith('/auth')) return;
  authErrorRedirecting = true;
  toast.error('Session expired. Please sign in again.');
  window.location.href = '/auth';
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => handleAuthError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => handleAuthError(error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when switching tabs back
      refetchOnReconnect: true, // Do refetch when network reconnects
      retry: (failureCount, error) => {
        // Don't retry auth errors — the session is dead
        if (isAuthError(error)) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});

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
                    <SOPDataProvider>
                    <TooltipProvider>
                      <BrowserRouter>
                        <Routes>
                          {/* Public routes */}
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/onboarding/:leadId" element={<OnboardingForm />} />
                          <Route path="/applicant-onboarding/:applicantId" element={<ApplicantOnboardingForm />} />
                          <Route path="/offer/:token" element={<PublicOfferPage />} />
                          <Route path="/offer-test" element={<PublicOfferPage testToken="test-nabidka-123" />} />
                          <Route path="/modification/:token" element={<PublicModificationPage />} />
                          <Route path="/extra-work-approval/:token" element={<ExtraWorkApproval />} />
                          <Route path="/creative-boost-share/:token" element={<PublicCreativeBoostPage />} />
                          <Route path="/sop-share/:token" element={<PublicSOPPage />} />

                          {/* Protected routes */}
                          <Route element={<RouteGuard><AppLayout /></RouteGuard>}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/my-work" element={<MyWork />} />
                            <Route path="/my-profile" element={<MyProfile />} />
                            <Route path="/leads" element={<Leads />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/contacts" element={<Contacts />} />
                            <Route path="/engagements" element={<Engagements />} />
                            <Route path="/modifications" element={<Modifications />} />
                            <Route path="/extra-work" element={<ExtraWork />} />
                            <Route path="/invoicing" element={<Invoicing />} />
                            <Route path="/creative-boost" element={<CreativeBoost />} />
                            <Route path="/meetings" element={<Meetings />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/colleagues" element={<Colleagues />} />
                            <Route path="/recruitment" element={<Recruitment />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/upsells" element={<Upsells />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/feedback" element={<Feedback />} />
                            <Route path="/academy" element={<Academy />} />
                            <Route path="/sop" element={<SOP />} />
                            <Route path="/sop/:articleId" element={<SOP />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                      <Sonner />
                    </TooltipProvider>
                    </SOPDataProvider>
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
