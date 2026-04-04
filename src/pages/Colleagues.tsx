import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Users, Shield, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useImpersonation } from '@/hooks/useImpersonation';
import { ColleagueForm } from '@/components/forms/ColleagueForm';
import { UserManagement } from '@/components/settings/UserManagement';
import { ColleagueCard } from '@/components/colleagues/ColleagueCard';
import type { ColleagueStatus, Colleague } from '@/types/crm';
import { toast } from 'sonner';
import { CreativeBoostProvider, useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import { TeamInvoicingOverview } from '@/components/colleagues/TeamInvoicingOverview';

type ColleaguesTab = 'team' | 'invoicing' | 'access';

function resolveTab(tabParam: string | null, isSuperAdmin: boolean): ColleaguesTab {
  if (!isSuperAdmin) {
    return 'team';
  }
  if (tabParam === 'access' || tabParam === 'invoicing' || tabParam === 'team') {
    return tabParam;
  }
  return 'team';
}

function ColleaguesContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const tabParam = searchParams.get('tab');
  const highlightedRef = useRef<HTMLDivElement>(null);
  
  const { isSuperAdmin: superAdmin, canSeeFinancials } = useUserRole();
  const { isImpersonating, stopImpersonation } = useImpersonation();
  const canViewFinancials = superAdmin || canSeeFinancials;
  const [activeTab, setActiveTab] = useState<ColleaguesTab>(() => resolveTab(tabParam, superAdmin));

  const {
    colleagues,
    engagements,
    assignments,
    clients,
    isLoading: crmLoading,
    updateColleague,
    updateAssignment,
  } = useCRMData();
  
  const { getColleagueCredits, getColleagueCreditsYear, getColleagueCreditsDetail } = useCreativeBoostData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ColleagueStatus | 'all'>('all');
  const [expandedColleagueId, setExpandedColleagueId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColleague, setEditingColleague] = useState<Colleague | null>(null);

  // Handle highlight from URL and when switching back to team tab.
  useEffect(() => {
    if (highlightId && activeTab === 'team') {
      setExpandedColleagueId(highlightId);
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightId, activeTab]);

  // Keep tabs in sync with URL param changes (e.g. "Zobrazit kartu kolegy").
  useEffect(() => {
    setActiveTab(resolveTab(tabParam, superAdmin));
  }, [tabParam, superAdmin]);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const filteredColleagues = useMemo(() => {
    return colleagues.filter(colleague => {
      const matchesSearch = 
        colleague.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        colleague.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        colleague.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || colleague.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [colleagues, searchQuery, statusFilter]);

  const getColleagueDetails = (colleagueId: string) => {
    const colleagueAssignments = assignments.filter(
      a => a.colleague_id === colleagueId && !a.end_date
    );
    
    const clientData: { client: typeof clients[0], engagement: typeof engagements[0], assignment: typeof assignments[0] }[] = [];
    let totalMonthlyEarnings = 0;
    
    colleagueAssignments.forEach(assignment => {
      const engagement = engagements.find(e => e.id === assignment.engagement_id);
      if (engagement) {
        const client = clients.find(c => c.id === engagement.client_id);
        if (client) {
          clientData.push({ client, engagement, assignment });
          totalMonthlyEarnings += assignment.monthly_cost || 0;
        }
      }
    });
    
    return { 
      assignmentCount: colleagueAssignments.length,
      totalMonthlyEarnings,
      clientData
    };
  };

  const toggleExpand = (colleagueId: string) => {
    setExpandedColleagueId(expandedColleagueId === colleagueId ? null : colleagueId);
  };

  const handleAddColleague = () => {
    setEditingColleague(null);
    setIsFormOpen(true);
  };

  const handleEditColleague = (colleague: Colleague) => {
    setEditingColleague(colleague);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'> & { role?: string }) => {
    const { role, ...colleagueData } = data;

    try {
      if (editingColleague) {
        await updateColleague(editingColleague.id, colleagueData);
      } else {
        const nameParts = colleagueData.full_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: responseData, error } = await invokeWithTimeout<{ error?: string }>('invite-user', {
          body: {
            email: colleagueData.email,
            firstName,
            lastName,
            role: role || 'specialist',
            position: colleagueData.position,
            seniority: colleagueData.seniority,
            phone: colleagueData.phone,
            notes: colleagueData.notes,
            is_freelancer: colleagueData.is_freelancer,
            internal_hourly_cost: colleagueData.internal_hourly_cost,
            monthly_fixed_cost: colleagueData.monthly_fixed_cost,
            min_monthly_reward: colleagueData.min_monthly_reward,
            max_engagements: colleagueData.max_engagements,
          },
        });

        if (error) {
          const errorMessage = error.message || 'Nepodařilo se pozvat uživatele';
          throw new Error(errorMessage);
        }

        if (responseData?.error) {
          throw new Error(responseData.error);
        }

        toast.success(`Kolega vytvořen a pozvánka odeslána na ${colleagueData.email}`);
      }

      setIsFormOpen(false);
      setEditingColleague(null);
    } catch (error: any) {
      console.error('Error saving colleague:', error);
      toast.error(error?.message || 'Nepodařilo se uložit kolegu');
    }
  };

  const handleUpdateAssignment = (assignmentId: string, data: { monthly_cost: number }) => {
    updateAssignment(assignmentId, data);
    toast.success('Odměna aktualizována');
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all';

  return (
    <div className="space-y-4 animate-fade-in p-4 sm:space-y-6 sm:p-6">
      <PageHeader 
        title="👥 Správa" 
        titleAccent="týmu"
        description="Kolegové, přístupy a oprávnění"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextTab = value as ColleaguesTab;
          setActiveTab(nextTab);

          // Keep URL in sync with selected tab so cross-tab navigation can reliably trigger.
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('tab', nextTab);
          setSearchParams(nextParams, { replace: true });
        }}
        className="w-full"
      >
        <TabsList className="mb-4 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="team" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Přehled</span>
            <span className="sm:hidden">Tým</span>
          </TabsTrigger>
          {superAdmin && (
            <TabsTrigger value="invoicing" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Odměny + výkazy
            </TabsTrigger>
          )}
          {superAdmin && (
            <TabsTrigger value="access" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Přístupy</span>
              <span className="sm:hidden">Správa</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="team" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Hledat kolegy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ColleagueStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Všechny statusy</SelectItem>
                  <SelectItem value="active">Aktivní</SelectItem>
                  <SelectItem value="on_hold">Pozastaveno</SelectItem>
                  <SelectItem value="left">Odešel/la</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {superAdmin && (
              <Button className="gap-2 w-full sm:w-auto" onClick={handleAddColleague}>
                <Plus className="h-4 w-4" />
                Přidat kolegu
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {filteredColleagues.map((colleague) => {
              const details = getColleagueDetails(colleague.id);
              const isExpanded = expandedColleagueId === colleague.id;
              const monthCredits = getColleagueCredits(colleague.id, currentYear, currentMonth);
              const yearCredits = getColleagueCreditsYear(colleague.id, currentYear);
              const creditsDetail = getColleagueCreditsDetail(colleague.id, currentYear, currentMonth);

              return (
                <div 
                  key={colleague.id}
                  ref={highlightId === colleague.id ? highlightedRef : null}
                >
                  <ColleagueCard
                    colleague={colleague}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(colleague.id)}
                    onEdit={superAdmin ? handleEditColleague : undefined}
                    isSuperAdmin={superAdmin}
                    canSeeFinancials={canViewFinancials}
                    highlighted={highlightId === colleague.id}
                    details={details}
                    monthCredits={monthCredits}
                    yearCredits={yearCredits}
                    creditsDetail={creditsDetail}
                    onUpdateAssignment={handleUpdateAssignment}
                  />
                </div>
              );
            })}
          </div>

      {!crmLoading && filteredColleagues.length === 0 && (
        <div className="py-12 text-center text-muted-foreground space-y-3">
          {colleagues.length === 0 ? (
            <>
              <p>
                {isImpersonating
                  ? 'Impersonovaný účet aktuálně nevidí žádné kolegy.'
                  : 'Aktuální účet nevidí žádné kolegy.'}
              </p>
              {isImpersonating && (
                <div>
                  <Button variant="outline" size="sm" onClick={stopImpersonation}>
                    Ukončit impersonaci
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p>
              {hasActiveFilters
                ? 'Žádní kolegové neodpovídají vašim kritériím'
                : 'V seznamu kolegů nejsou dostupná data.'}
            </p>
          )}
        </div>
      )}

      {crmLoading && (
        <div className="py-12 text-center text-muted-foreground">
          Načítání kolegů...
        </div>
      )}

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingColleague ? 'Upravit kolegu' : 'Nový kolega'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ColleagueForm
              colleague={editingColleague || undefined}
              onSubmit={handleFormSubmit as any}
              onCancel={() => setIsFormOpen(false)}
              showInviteOption={superAdmin && !editingColleague}
            />
          </div>
        </SheetContent>
      </Sheet>


        </TabsContent>

        {superAdmin && (
          <TabsContent value="invoicing" className="space-y-4">
            <TeamInvoicingOverview />
          </TabsContent>
        )}

        {superAdmin && (
          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function Colleagues() {
  return (
    <CreativeBoostProvider>
      <ColleaguesContent />
    </CreativeBoostProvider>
  );
}
