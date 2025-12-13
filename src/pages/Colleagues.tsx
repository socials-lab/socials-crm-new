import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronUp, Mail, CreditCard, Pencil, Zap, Sparkles, Briefcase, Check, X, ExternalLink, Users, Shield, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
import { Badge } from '@/components/ui/badge';
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
import { AddCRMUserDialog } from '@/components/settings/AddCRMUserDialog';
import type { ColleagueStatus, Seniority, Colleague } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreativeBoostProvider, useCreativeBoostData } from '@/hooks/useCreativeBoostData';

const seniorityColors: Record<Seniority, string> = {
  junior: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  mid: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  senior: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  partner: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
};

const seniorityLabels: Record<Seniority, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  partner: 'Partner',
};

function ColleaguesContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const tabParam = searchParams.get('tab');
  const highlightedRef = useRef<HTMLDivElement>(null);
  
  const { isSuperAdmin: superAdmin, canSeeFinancials } = useUserRole();

  const { 
    colleagues, 
    engagements, 
    assignments, 
    clients,
    addColleague,
    updateColleague,
    updateAssignment,
  } = useCRMData();
  
  const { getColleagueCredits, getColleagueCreditsYear, getColleagueCreditsDetail } = useCreativeBoostData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ColleagueStatus | 'all'>('all');
  const [expandedColleagueId, setExpandedColleagueId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColleague, setEditingColleague] = useState<Colleague | null>(null);
  
  // Inline editing for assignment costs (super admin only)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<string>('');
  
  // Invite user dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

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

  const handleEditColleague = (colleague: Colleague, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingColleague(colleague);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingColleague) {
      updateColleague(editingColleague.id, data);
      toast.success('Kolega byl upraven');
    } else {
      addColleague(data);
      toast.success('Kolega byl vytvořen');
    }
    setIsFormOpen(false);
    setEditingColleague(null);
  };

  const handleSaveAssignmentCost = (assignmentId: string) => {
    const cost = parseFloat(tempCost) || 0;
    updateAssignment(assignmentId, { monthly_cost: cost });
    setEditingAssignmentId(null);
    toast.success('Odměna aktualizována');
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="👥 Správa" 
        titleAccent="týmu"
        description="Kolegové, přístupy a oprávnění"
      />

      <Tabs defaultValue={tabParam === 'access' && superAdmin ? 'access' : 'team'} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Přehled týmu
          </TabsTrigger>
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
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Pozvat uživatele
                </Button>
                <Button className="gap-2" onClick={handleAddColleague}>
                  <Plus className="h-4 w-4" />
                  Přidat kolegu
                </Button>
              </div>
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
            <Card 
              key={colleague.id}
              ref={highlightId === colleague.id ? highlightedRef : null}
              className={cn(
                "overflow-hidden transition-all",
                highlightId === colleague.id && "ring-2 ring-primary"
              )}
            >
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(colleague.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {colleague.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{colleague.full_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{colleague.position}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-4">
                    {/* CRM Access Badge - shows if colleague has profile_id linked */}
                    {superAdmin && colleague.profile_id && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        CRM přístup
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", seniorityColors[colleague.seniority])}
                    >
                      {seniorityLabels[colleague.seniority]}
                    </Badge>
                    {monthCredits > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Kredity/měsíc
                        </p>
                        <p className="text-sm font-medium">{monthCredits}</p>
                      </div>
                    )}
                    {superAdmin && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Měsíční odměna</p>
                        <p className="text-sm font-semibold">{details.totalMonthlyEarnings.toLocaleString()} CZK</p>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={colleague.status} />
                  {superAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={(e) => handleEditColleague(colleague, e)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="border-t bg-muted/30 pt-4">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Kontaktní údaje
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Email:</span> 
                          <a href={`mailto:${colleague.email}`} className="text-primary hover:underline">
                            {colleague.email}
                          </a>
                        </p>
                        {colleague.phone && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Telefon:</span>
                            <a href={`tel:${colleague.phone}`} className="text-primary hover:underline">
                              {colleague.phone}
                            </a>
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Pozice:</span>
                          {colleague.position}
                        </p>
                      </div>
                    </div>

                    {superAdmin && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Finanční údaje
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-background border">
                            <p className="text-xs text-muted-foreground">Hodinová sazba</p>
                            <p className="text-lg font-semibold">
                              {colleague.internal_hourly_cost.toLocaleString()} CZK/hod
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Creative Boost Credits */}
                    {(monthCredits > 0 || yearCredits > 0) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          Creative Boost kredity
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-background border">
                            <p className="text-xs text-muted-foreground">Tento měsíc</p>
                            <p className="text-lg font-semibold">{monthCredits} kreditů</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background border">
                            <p className="text-xs text-muted-foreground">Celkem za rok {currentYear}</p>
                            <p className="text-lg font-semibold">{yearCredits} kreditů</p>
                          </div>
                        </div>
                        {creditsDetail.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Rozpis tento měsíc:</p>
                            {creditsDetail.map((detail, idx) => (
                              <div key={idx} className="text-sm flex justify-between p-2 rounded bg-background border">
                                <span className="truncate">{detail.clientName} – {detail.outputTypeName}</span>
                                <span className="font-medium flex items-center gap-1">
                                  {detail.expressCount > 0 && <Zap className="h-3 w-3 text-amber-500" />}
                                  {detail.totalCredits}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assigned Engagements - Super Admin Only with editable costs */}
                  {superAdmin && details.clientData.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Přiřazené zakázky ({details.clientData.length})
                      </h4>
                      <div className="space-y-2">
                        {details.clientData.map(({ client, engagement, assignment }) => (
                          <div 
                            key={assignment.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-background border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {client.brand_name.charAt(0)}
                              </div>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/engagements?highlight=${engagement.id}`);
                                  }}
                                  className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  {engagement.name}
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                                <p className="text-xs text-muted-foreground">
                                  {client.brand_name} • {assignment.role_on_engagement}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {editingAssignmentId === assignment.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    type="number"
                                    value={tempCost}
                                    onChange={(e) => setTempCost(e.target.value)}
                                    className="h-7 w-24 text-sm"
                                    placeholder="0"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveAssignmentCost(assignment.id);
                                      } else if (e.key === 'Escape') {
                                        setEditingAssignmentId(null);
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">CZK</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-status-active"
                                    onClick={() => handleSaveAssignmentCost(assignment.id)}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setEditingAssignmentId(null)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAssignmentId(assignment.id);
                                    setTempCost(String(assignment.monthly_cost || 0));
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium hover:bg-muted transition-colors group"
                                  title="Klikněte pro úpravu odměny"
                                >
                                  <span>{(assignment.monthly_cost || 0).toLocaleString()} CZK/měs</span>
                                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total summary */}
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Celková měsíční odměna</p>
                          <p className="text-lg font-bold text-primary">
                            {details.totalMonthlyEarnings.toLocaleString()} CZK
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
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
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AddCRMUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onAdd={() => {
          // Refresh will happen automatically via useCRMData
        }}
      />
        </TabsContent>

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
