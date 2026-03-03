import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, ExternalLink, ChevronDown, ChevronUp, Mail, Phone, Calendar, Users, Pencil, Building2, FileText, UserPlus, Star, Key, Trash2, StickyNote, Crown, Database, Briefcase, Check, X, Loader2, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useFakturoid, type FakturoidSubjectData } from '@/hooks/useFakturoid';
import { ClientForm } from '@/components/forms/ClientForm';
import { AddContactDialog } from '@/components/clients/AddContactDialog';
import { LeadOriginSection } from '@/components/clients/LeadOriginSection';
import { useUserRole } from '@/hooks/useUserRole';
import type { ClientStatus, Client, ClientContact, ClientTier } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

const tierConfig: Record<ClientTier, { label: string; color: string; icon: string }> = {
  standard: { label: 'Standard', color: 'bg-muted text-muted-foreground', icon: '' },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🥇' },
  platinum: { label: 'Platinum', color: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200', icon: '💎' },
  diamond: { label: 'Diamond', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: '👑' },
};

const getAresUrl = (ico: string) => `https://ares.gov.cz/ekonomicke-subjekty/res/${ico}`;

// Reusable tier badge component with tooltip
function TierBadgeWithTooltip({ tier, compact = false }: { tier: ClientTier; compact?: boolean }) {
  if (!tier || tier === 'standard') return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn(tierConfig[tier].color, compact ? "text-xs py-0 px-2" : "", "cursor-help")}>
            {tierConfig[tier].icon} {tierConfig[tier].label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Informativní označení úrovně klienta</p>
          <p className="text-xs text-muted-foreground">(nemá vliv na funkce systému)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const ITEMS_PER_PAGE = 20;

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightedRef = useRef<HTMLDivElement>(null);
  const {
    clients,
    engagements,
    engagementServices,
    assignments,
    colleagues,
    services,
    addClient,
    updateClient,
    getContactsByClientId,
    addContact,
    updateContact,
    deleteContact,
    canDeleteContact,
    getEngagementsByClientId,
  } = useCRMData();

  const { isSuperAdmin: superAdmin, role } = useUserRole();
  const { leads } = useLeadsData();
  const getLeadByClientId = useCallback((clientId: string) => {
    return leads.find(lead => lead.converted_to_client_id === clientId);
  }, [leads]);
  // Allow editing for super admin or roles: admin, management, project_manager, specialist
  const canModifyContactsFlag = superAdmin || ['admin', 'management', 'project_manager', 'specialist'].includes(role || '');
  const { createSubjectInFakturoid, syncSubjectToFakturoid, getSubjectFromFakturoid, isLoading: isFakturoidLoading } = useFakturoid();
  const [creatingSubjectForClient, setCreatingSubjectForClient] = useState<string | null>(null);

  // Initialize state from URL params
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>(
    (searchParams.get('status') as ClientStatus | 'all') || 'all'
  );
  const [tierFilter, setTierFilter] = useState<ClientTier | 'all'>(
    (searchParams.get('tier') as ClientTier | 'all') || 'all'
  );
  const [page, setPage] = useState(1);

  // Debounce search input
  const searchQuery = useDebouncedValue(searchInput, 300);

  // Sync URL with filter state
  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      // Preserve highlight param
      const highlight = prev.get('highlight');
      if (highlight) newParams.set('highlight', highlight);
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Sync debounced search to URL
  useEffect(() => {
    updateUrlParams({ q: searchQuery || null });
  }, [searchQuery, updateUrlParams]);

  // Update URL when filters change
  const handleStatusChange = (value: ClientStatus | 'all') => {
    setStatusFilter(value);
    setPage(1);
    updateUrlParams({ status: value === 'all' ? null : value });
  };

  const handleTierChange = (value: ClientTier | 'all') => {
    setTierFilter(value);
    setPage(1);
    updateUrlParams({ tier: value === 'all' ? null : value });
  };

  // Check if any filters are active
  const hasActiveFilters = searchInput !== '' || statusFilter !== 'all' || tierFilter !== 'all';

  const clearAllFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setTierFilter('all');
    setPage(1);
    setSearchParams(prev => {
      const newParams = new URLSearchParams();
      // Preserve only highlight param
      const highlight = prev.get('highlight');
      if (highlight) newParams.set('highlight', highlight);
      return newParams;
    }, { replace: true });
  };
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Contact dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDialogClientId, setContactDialogClientId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  // Pinned notes editing state
  const [editingNotesClientId, setEditingNotesClientId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Billing email editing state
  const [editingBillingEmailClientId, setEditingBillingEmailClientId] = useState<string | null>(null);
  const [tempBillingEmail, setTempBillingEmail] = useState('');
  const [isSavingBillingEmail, setIsSavingBillingEmail] = useState(false);

  // Fakturoid dialog state
  const [fakturoidDialogOpen, setFakturoidDialogOpen] = useState(false);
  const [fakturoidSubject, setFakturoidSubject] = useState<FakturoidSubjectData | null>(null);
  const [fakturoidClientName, setFakturoidClientName] = useState<string>('');

  // Handle highlight from URL
  useEffect(() => {
    if (highlightId) {
      setExpandedClientId(highlightId);
      const timeoutId = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [highlightId]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const lowerSearch = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        client.name.toLowerCase().includes(lowerSearch) ||
        client.brand_name.toLowerCase().includes(lowerSearch) ||
        client.industry.toLowerCase().includes(lowerSearch) ||
        client.ico.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesTier = tierFilter === 'all' || client.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [clients, searchQuery, statusFilter, tierFilter]);

  // Reset to page 1 when debounced search changes (status/tier already reset in handlers)
  const prevSearchQuery = useRef(searchQuery);
  useEffect(() => {
    if (prevSearchQuery.current !== searchQuery) {
      setPage(1);
      prevSearchQuery.current = searchQuery;
    }
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, page]);

  // Memoize client details for all visible clients to prevent recalculation on every render
  const clientDetailsMap = useMemo(() => {
    const map = new Map<string, {
      activeCount: number;
      totalMonthlyFee: number;
      totalCost: number;
      clientServiceList: typeof services;
      assignedColleagues: typeof colleagues;
      engagements: typeof engagements;
      contacts: ReturnType<typeof getContactsByClientId>;
    }>();

    // Pre-compute maps for faster lookups
    const engagementsByClient = new Map<string, typeof engagements>();
    engagements.forEach(e => {
      const list = engagementsByClient.get(e.client_id) || [];
      list.push(e);
      engagementsByClient.set(e.client_id, list);
    });

    const assignmentsByEngagement = new Map<string, typeof assignments>();
    assignments.forEach(a => {
      const list = assignmentsByEngagement.get(a.engagement_id) || [];
      list.push(a);
      assignmentsByEngagement.set(a.engagement_id, list);
    });

    const serviceMap = new Map(services.map(s => [s.id, s]));
    const colleagueMap = new Map(colleagues.map(c => [c.id, c]));

    paginatedClients.forEach(client => {
      const clientEngagements = engagementsByClient.get(client.id) || [];
      const activeEngagements = clientEngagements.filter(e => e.status === 'active');
      const totalMonthlyFee = activeEngagements.reduce((sum, e) => sum + e.monthly_fee, 0);

      // Get services from engagement services
      const clientEngIds = new Set(clientEngagements.map(e => e.id));
      const clientServiceList = engagementServices
        .filter(es => clientEngIds.has(es.engagement_id) && es.is_active)
        .map(es => serviceMap.get(es.service_id))
        .filter(Boolean) as typeof services;

      const colleagueIds = new Set<string>();
      let totalCost = 0;

      clientEngagements.forEach(eng => {
        const engAssignments = (assignmentsByEngagement.get(eng.id) || [])
          .filter(a => !a.end_date);
        engAssignments.forEach(a => {
          colleagueIds.add(a.colleague_id);
          totalCost += a.monthly_cost || 0;
        });
      });

      const assignedColleagues = Array.from(colleagueIds)
        .map(id => colleagueMap.get(id))
        .filter(Boolean) as typeof colleagues;

      const contacts = getContactsByClientId(client.id);

      map.set(client.id, {
        activeCount: activeEngagements.length,
        totalMonthlyFee,
        totalCost,
        clientServiceList,
        assignedColleagues,
        engagements: clientEngagements,
        contacts,
      });
    });

    return map;
  }, [paginatedClients, engagements, engagementServices, assignments, services, colleagues, getContactsByClientId]);

  const getClientDetails = (clientId: string) => {
    return clientDetailsMap.get(clientId) || {
      activeCount: 0,
      totalMonthlyFee: 0,
      totalCost: 0,
      clientServiceList: [],
      assignedColleagues: [],
      engagements: [],
      contacts: [],
    };
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const BILLING_FIELDS = ['name', 'ico', 'dic', 'billing_street', 'billing_city', 
                          'billing_zip', 'billing_country', 'billing_email', 'website'] as const;

  const billingFieldsChanged = (original: Client, updated: Partial<Client>): boolean => {
    return BILLING_FIELDS.some(field => {
      const originalValue = original[field];
      const updatedValue = updated[field];
      return originalValue !== updatedValue;
    });
  };

  const handleFormSubmit = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingClient) {
        // Prevent marking client as "lost" if they have blocking engagements
        // FIX: Match backend logic - also check 'paused' and 'planned' statuses
        if (data.status === 'lost' && editingClient.status !== 'lost') {
          const clientEngagements = getEngagementsByClientId(editingClient.id);
          const hasBlockingEngagements = clientEngagements.some(
            e => ['active', 'paused', 'planned'].includes(e.status)
          );
          if (hasBlockingEngagements) {
            toast.error('Nelze označit klienta jako ztraceného, pokud má aktivní, pozastavené nebo plánované zakázky. Nejprve ukončete nebo zrušte všechny zakázky.');
            return;
          }
        }
        await updateClient(editingClient.id, data);

        // Sync to Fakturoid if linked and billing fields changed
        if (editingClient.fakturoid_subject_id && billingFieldsChanged(editingClient, data)) {
          try {
            await syncSubjectToFakturoid(editingClient.id);
          } catch (syncError) {
            console.error('Fakturoid sync error:', syncError);
            toast.warning('Klient uložen, ale synchronizace s Fakturoid selhala');
          }
        }

        toast.success('Klient byl upraven');
      } else {
        await addClient(data);
        // Note: success toast is shown by the mutation's onSuccess
      }
      setIsFormOpen(false);
      setEditingClient(null);
    } catch (error: unknown) {
      console.error('Error saving client:', error);
      let message = 'Neznámá chyba';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as { message?: string; code?: string; details?: string };
        if (err.code === '23505' || err.message?.includes('duplicate') || err.message?.includes('unique')) {
          message = 'Klient s tímto IČO již existuje';
        } else {
          message = err.message || err.details || JSON.stringify(error);
        }
      }
      toast.error(`Chyba při ukládání klienta: ${message}`);
    }
  };

  const handleAddContact = (clientId: string) => {
    setContactDialogClientId(clientId);
    setEditingContact(null);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: ClientContact) => {
    setContactDialogClientId(contact.client_id);
    setEditingContact(contact);
    setContactDialogOpen(true);
  };

  const handleContactSubmit = async (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, data);
        toast.success('Kontakt byl upraven');
      } else {
        await addContact(data);
        toast.success('Kontakt byl přidán');
      }
      // Dialog closing is now handled by AddContactDialog on success
    } catch (error) {
      console.error('Error saving contact:', error);
      const message = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Chyba při ukládání kontaktu: ${message}`);
      // Re-throw so AddContactDialog knows submission failed and keeps the form data
      throw error;
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteContactId) return;

    // Use centralized canDeleteContact utility for validation
    const { allowed, reason } = await canDeleteContact(deleteContactId);
    if (!allowed) {
      toast.error(reason || 'Kontakt nelze smazat');
      setDeleteContactId(null);
      return;
    }

    try {
      await deleteContact(deleteContactId);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    } finally {
      setDeleteContactId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🏢 Klienti" 
        titleAccent="agentury"
        description="Správa klientů a jejich projektů"
        actions={
          superAdmin && (
            <Button className="gap-2" onClick={handleAddClient}>
              <Plus className="h-4 w-4" />
              Přidat klienta
            </Button>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat klienty, IČO..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Vyhledat klienty"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrovat podle statusu">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny statusy</SelectItem>
            <SelectItem value="active">Aktivní</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="paused">Pozastaveno</SelectItem>
            <SelectItem value="potential">Potenciální</SelectItem>
            <SelectItem value="lost">Ztraceno</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={handleTierChange}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrovat podle tieru">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny tiery</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="gold">🥇 Gold</SelectItem>
            <SelectItem value="platinum">💎 Platinum</SelectItem>
            <SelectItem value="diamond">👑 Diamond</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Zrušit všechny filtry"
          >
            <FilterX className="h-4 w-4 mr-1" />
            Zrušit filtry
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {paginatedClients.map((client) => {
          const details = getClientDetails(client.id);
          const isExpanded = expandedClientId === client.id;

          return (
            <Card 
              key={client.id} 
              ref={highlightId === client.id ? highlightedRef : null}
              className={cn(
                "overflow-hidden transition-all",
                highlightId === client.id && "ring-2 ring-primary"
              )}
            >
              <div
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                onClick={() => toggleExpand(client.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(client.id);
                  }
                }}
                aria-expanded={expandedClientId === client.id}
                aria-label={`${client.brand_name} - ${expandedClientId === client.id ? 'sbalit' : 'rozbalit'}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    {client.brand_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{client.brand_name}</span>
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Otevřít web ${client.brand_name}`}
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{client.name}</p>
                    {/* Připnutá poznámka v zabaleném stavu */}
                    {client.pinned_notes && !isExpanded && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 truncate mt-0.5 flex items-center gap-1">
                        <StickyNote className="h-3 w-3 shrink-0" />
                        <span className="truncate">{client.pinned_notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{details.activeCount}</span>
                  </div>
                  <TierBadgeWithTooltip tier={client.tier} compact />
                  <StatusBadge status={client.status} />
                  {superAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleEditClient(client, e)}
                      aria-label={`Upravit klienta ${client.brand_name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={isExpanded ? 'Sbalit detail' : 'Rozbalit detail'}>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="border-t bg-muted/30 pt-4">
                  {/* Připnutá poznámka */}
                  <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                        <StickyNote className="h-4 w-4" />
                        Připnutá poznámka
                      </h4>
                      {editingNotesClientId !== client.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNotesClientId(client.id);
                            setTempNotes(client.pinned_notes || '');
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Upravit
                        </Button>
                      )}
                    </div>
                    {editingNotesClientId === client.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Přidejte poznámku..."
                          className="min-h-[80px] bg-background"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNotesClientId(null);
                              setTempNotes('');
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Zrušit
                          </Button>
                          <Button
                            size="sm"
                            className="h-7"
                            disabled={isSavingNotes}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setIsSavingNotes(true);
                              try {
                                await updateClient(client.id, { pinned_notes: tempNotes });
                                setEditingNotesClientId(null);
                                setTempNotes('');
                                toast.success('Poznámka uložena');
                              } catch (error) {
                                console.error('Failed to save notes:', error);
                                toast.error('Nepodařilo se uložit poznámku');
                              } finally {
                                setIsSavingNotes(false);
                              }
                            }}
                          >
                            {isSavingNotes ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                            Uložit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap">
                        {client.pinned_notes || <span className="italic text-yellow-700 dark:text-yellow-500">Žádná poznámka</span>}
                      </p>
                    )}
                  </div>

                  {/* Lead Origin Section */}
                  {(() => {
                    const originLead = getLeadByClientId(client.id);
                    if (!originLead) return null;
                    return (
                      <div className="mb-6">
                        <LeadOriginSection
                          lead={originLead}
                          onStopPropagation={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })()}

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Firemní údaje */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Firemní údaje
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">IČO:</span> 
                          <span className="font-mono">{client.ico}</span>
                          <a 
                            href={getAresUrl(client.ico)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:text-primary/80 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            title="Otevřít v ARES"
                          >
                            <Database className="h-3.5 w-3.5" />
                          </a>
                        </p>
                        {client.dic && (
                          <p><span className="text-muted-foreground">DIČ:</span> <span className="font-mono">{client.dic}</span></p>
                        )}
                        {client.website && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Web:</span>
                            <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              {client.website.replace(/^https?:\/\//, '')}
                            </a>
                          </p>
                        )}
                        <p><span className="text-muted-foreground">Odvětví:</span> {client.industry}</p>
                        {client.tier && client.tier !== 'standard' && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Tier:</span>
                            <TierBadgeWithTooltip tier={client.tier} />
                          </p>
                        )}
                        {client.sales_representative_id && (
                          <p className="flex items-center gap-2">
                            <Crown className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Sales:</span>
                            {colleagues.find(c => c.id === client.sales_representative_id)?.full_name || 'Neznámý'}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Spolupráce od:</span>
                          {new Date(client.start_date).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>

                    {/* Fakturační údaje */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Fakturační údaje
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {/* Fakturační email - editovatelný */}
                        <div className="flex items-start gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground mt-1" />
                          {editingBillingEmailClientId === client.id ? (
                            <div className="flex-1 space-y-2">
                              <Input
                                type="email"
                                value={tempBillingEmail}
                                onChange={(e) => setTempBillingEmail(e.target.value)}
                                placeholder="email@firma.cz"
                                className="h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBillingEmailClientId(null);
                                    setTempBillingEmail('');
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Zrušit
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  disabled={isSavingBillingEmail}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setIsSavingBillingEmail(true);
                                    try {
                                      await updateClient(client.id, { billing_email: tempBillingEmail || null });
                                      setEditingBillingEmailClientId(null);
                                      setTempBillingEmail('');
                                      toast.success('Fakturační email uložen');
                                    } catch (error) {
                                      console.error('Failed to save billing email:', error);
                                      toast.error('Nepodařilo se uložit fakturační email');
                                    } finally {
                                      setIsSavingBillingEmail(false);
                                    }
                                  }}
                                >
                                  {isSavingBillingEmail ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                  Uložit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1">
                              {client.billing_email ? (
                                <a href={`mailto:${client.billing_email}`} className="text-primary hover:underline">
                                  {client.billing_email}
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">Nevyplněno</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBillingEmailClientId(client.id);
                                  setTempBillingEmail(client.billing_email || '');
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Fakturační adresa */}
                        {client.billing_street && (
                          <div className="text-muted-foreground ml-5">
                            <p>{client.billing_street}</p>
                            <p>{client.billing_city}{client.billing_zip && `, ${client.billing_zip}`}</p>
                            {client.billing_country && <p>{client.billing_country}</p>}
                          </div>
                        )}
                        {/* Fakturoid connection status */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <span className="text-muted-foreground text-sm">Fakturoid:</span>
                          {client.fakturoid_subject_id ? (
                            <Badge 
                              variant="outline" 
                              className="text-green-600 border-green-300 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setFakturoidClientName(client.name);
                                setFakturoidDialogOpen(true);
                                const subject = await getSubjectFromFakturoid(client.fakturoid_subject_id!);
                                setFakturoidSubject(subject);
                              }}
                            >
                              Propojeno (ID: {client.fakturoid_subject_id})
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Nepropojeno
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setCreatingSubjectForClient(client.id);
                                  try {
                                    const result = await createSubjectInFakturoid(client.id);
                                    if (result?.fakturoid_subject_id) {
                                      await updateClient(client.id, { fakturoid_subject_id: result.fakturoid_subject_id });
                                    }
                                  } catch (error) {
                                    console.error('Failed to create Fakturoid subject:', error);
                                    // Error toast is already shown by useFakturoid hook
                                  } finally {
                                    setCreatingSubjectForClient(null);
                                  }
                                }}
                                disabled={creatingSubjectForClient === client.id}
                              >
                                {creatingSubjectForClient === client.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Vytvořit'
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kontakty */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Kontakty ({details.contacts.length})
                      </h4>
                      <div className="space-y-3">
                        {details.contacts.length > 0 ? (
                          details.contacts.slice(0, 3).map(contact => (
                            <div key={contact.id} className="p-2 rounded-lg bg-background border text-sm group">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{contact.name}</span>
                                  {contact.is_primary && (
                                    <span title="Primární kontakt">
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    </span>
                                  )}
                                  {contact.is_decision_maker && (
                                    <span title="Decision maker">
                                      <Key className="h-3 w-3 text-primary" />
                                    </span>
                                  )}
                                </div>
                                {canModifyContactsFlag && (
                                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditContact(contact);
                                      }}
                                      aria-label={`Upravit kontakt ${contact.name}`}
                                    >
                                      <Pencil className="h-3 w-3" aria-hidden="true" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteContactId(contact.id);
                                      }}
                                      aria-label={`Smazat kontakt ${contact.name}`}
                                    >
                                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {contact.position && (
                                <p className="text-muted-foreground text-xs">{contact.position}</p>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs">
                                {contact.email && (
                                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </a>
                                )}
                                {contact.phone && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Žádné kontakty</p>
                        )}
                        {details.contacts.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            + {details.contacts.length - 3} další kontakty
                          </p>
                        )}
                        {canModifyContactsFlag && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddContact(client.id);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            Přidat kontakt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {details.engagements.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Zakázky ({details.engagements.length})</h4>
                      <div className="space-y-2">
                        {details.engagements.map(eng => (
                          <div 
                            key={eng.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-background border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/engagements?highlight=${eng.id}`);
                            }}
                          >
                            <div>
                              <p className="font-medium text-sm">{eng.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {eng.type === 'retainer' ? 'Retainer' : eng.type === 'one_off' ? 'Jednorázově' : 'Interní'}
                                </Badge>
                                <StatusBadge status={eng.status} />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">
                                {eng.type === 'retainer' 
                                  ? `${eng.monthly_fee.toLocaleString()} ${eng.currency}/měs`
                                  : `${eng.one_off_fee.toLocaleString()} ${eng.currency}`
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                od {new Date(eng.start_date).toLocaleDateString('cs-CZ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Žádní klienti neodpovídají vašim kritériím
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Předchozí stránka"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Předchozí
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Stránka {page} z {totalPages}
            <span className="ml-2 text-xs">({filteredClients.length} klientů)</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Další stránka"
          >
            Další
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingClient ? 'Upravit klienta' : 'Nový klient'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ClientForm
              client={editingClient || undefined}
              hasEngagements={
                editingClient ? getEngagementsByClientId(editingClient.id).length > 0 : false
              }
              hasActiveEngagements={
                editingClient
                  ? getEngagementsByClientId(editingClient.id).some(
                      e => e.status === 'active' && e.contract_url
                    )
                  : false
              }
              isSuperAdmin={superAdmin}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {contactDialogClientId && (
        <AddContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          clientId={contactDialogClientId}
          contact={editingContact || undefined}
          onSubmit={handleContactSubmit}
        />
      )}

      <AlertDialog open={!!deleteContactId} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat kontakt?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Kontakt bude trvale odstraněn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fakturoid Subject Dialog */}
      <Dialog 
        open={fakturoidDialogOpen} 
        onOpenChange={(open) => {
          setFakturoidDialogOpen(open);
          if (!open) {
            setFakturoidSubject(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fakturoid - {fakturoidClientName}
            </DialogTitle>
          </DialogHeader>
          {isFakturoidLoading && !fakturoidSubject ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : fakturoidSubject ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Název:</span>
                  <span className="font-medium">{fakturoidSubject.name}</span>
                </div>
                {fakturoidSubject.registration_no && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IČO:</span>
                    <span className="font-medium">{fakturoidSubject.registration_no}</span>
                  </div>
                )}
                {fakturoidSubject.vat_no && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DIČ:</span>
                    <span className="font-medium">{fakturoidSubject.vat_no}</span>
                  </div>
                )}
                {fakturoidSubject.street && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ulice:</span>
                    <span className="font-medium">{fakturoidSubject.street}</span>
                  </div>
                )}
                {(fakturoidSubject.city || fakturoidSubject.zip) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Město:</span>
                    <span className="font-medium">
                      {fakturoidSubject.city}{fakturoidSubject.zip && `, ${fakturoidSubject.zip}`}
                    </span>
                  </div>
                )}
                {fakturoidSubject.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Země:</span>
                    <span className="font-medium">{fakturoidSubject.country}</span>
                  </div>
                )}
                {fakturoidSubject.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{fakturoidSubject.email}</span>
                  </div>
                )}
                {fakturoidSubject.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefon:</span>
                    <span className="font-medium">{fakturoidSubject.phone}</span>
                  </div>
                )}
                {fakturoidSubject.web && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Web:</span>
                    <span className="font-medium">{fakturoidSubject.web}</span>
                  </div>
                )}
                {fakturoidSubject.updated_at && (
                  <div className="flex justify-between pt-2 border-t text-xs">
                    <span className="text-muted-foreground">Poslední aktualizace:</span>
                    <span className="text-muted-foreground">
                      {new Date(fakturoidSubject.updated_at).toLocaleString('cs-CZ')}
                    </span>
                  </div>
                )}
              </div>
              {fakturoidSubject.html_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(fakturoidSubject.html_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Otevřít ve Fakturoid
                </Button>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Nepodařilo se načíst data z Fakturoid
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
