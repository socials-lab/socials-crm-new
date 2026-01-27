import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Users, Shield, Coins } from 'lucide-react';
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
import { ColleagueForm } from '@/components/forms/ColleagueForm';
import { UserManagement } from '@/components/settings/UserManagement';
import { ColleagueCard } from '@/components/colleagues/ColleagueCard';
import type { ColleagueStatus, Colleague } from '@/types/crm';
import { toast } from 'sonner';
import { CreativeBoostProvider, useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { supabase } from '@/integrations/supabase/client';
import { TeamEarningsOverview } from '@/components/colleagues/TeamEarningsOverview';
import { enrichColleaguesWithDemoData } from '@/utils/colleagueDemoData';

function ColleaguesContent() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const tabParam = searchParams.get('tab');
  const highlightedRef = useRef<HTMLDivElement>(null);
  
  const { isSuperAdmin: superAdmin, canSeeFinancials } = useUserRole();

  const { 
    colleagues: rawColleagues, 
    engagements, 
    assignments, 
    clients,
    addColleague,
    updateColleague,
    updateAssignment,
  } = useCRMData();
  
  // Enrich colleagues with demo data for display
  const colleagues = useMemo(() => enrichColleaguesWithDemoData(rawColleagues), [rawColleagues]);
  
  const { getColleagueCredits, getColleagueCreditsYear, getColleagueCreditsDetail } = useCreativeBoostData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ColleagueStatus | 'all'>('all');
  const [expandedColleagueId, setExpandedColleagueId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColleague, setEditingColleague] = useState<Colleague | null>(null);

  // Handle highlight from URL
  useEffect(() => {
    if (highlightId) {
      setExpandedColleagueId(highlightId);
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightId]);

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

  const handleFormSubmit = async (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'> & { invite_to_crm?: boolean; role?: string }) => {
    const { invite_to_crm, role, ...colleagueData } = data;
    
    if (editingColleague) {
      updateColleague(editingColleague.id, colleagueData);
      toast.success('Kolega byl upraven');
    } else {
      // If invite_to_crm is checked, use edge function (creates colleague + user + sends email)
      if (invite_to_crm && role) {
        try {
          const nameParts = colleagueData.full_name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const { data: responseData, error } = await supabase.functions.invoke('invite-user', {
            body: {
              email: colleagueData.email,
              firstName,
              lastName,
              role,
              position: colleagueData.position,
              seniority: colleagueData.seniority,
              phone: colleagueData.phone,
              notes: colleagueData.notes,
              is_freelancer: colleagueData.is_freelancer,
              internal_hourly_cost: colleagueData.internal_hourly_cost,
              monthly_fixed_cost: colleagueData.monthly_fixed_cost,
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
        } catch (error: any) {
          console.error('Error inviting user:', error);
          toast.error(error.message || 'Nepodařilo se pozvat uživatele');
        }
      } else {
        // No invite - just create colleague locally
        addColleague(colleagueData);
        toast.success('Kolega byl vytvořen');
      }
    }
    setIsFormOpen(false);
    setEditingColleague(null);
  };

  const handleUpdateAssignment = (assignmentId: string, data: { monthly_cost: number }) => {
    updateAssignment(assignmentId, data);
    toast.success('Odměna aktualizována');
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="👥 Správa" 
        titleAccent="týmu"
        description="Kolegové, přístupy a oprávnění"
      />

      <Tabs defaultValue={tabParam === 'access' && superAdmin ? 'access' : tabParam === 'earnings' && superAdmin ? 'earnings' : 'team'} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Přehled týmu
          </TabsTrigger>
          {superAdmin && (
            <TabsTrigger value="earnings" className="gap-2">
              <Coins className="h-4 w-4" />
              Odměny týmu
            </TabsTrigger>
          )}
          {superAdmin && (
            <TabsTrigger value="access" className="gap-2">
              <Shield className="h-4 w-4" />
              Správa přístupů
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Hledat kolegy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ColleagueStatus | 'all')}>
                <SelectTrigger className="w-[160px]">
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
              <Button className="gap-2" onClick={handleAddColleague}>
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
                    canSeeFinancials={canSeeFinancials}
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

      {filteredColleagues.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Žádní kolegové neodpovídají vašim kritériím
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
          <TabsContent value="earnings" className="space-y-4">
            <TeamEarningsOverview />
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
