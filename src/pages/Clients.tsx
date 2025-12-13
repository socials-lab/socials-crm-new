import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, ExternalLink, ChevronDown, ChevronUp, Mail, Phone, Calendar, Users, Pencil, Building2, FileText, UserPlus, Star, Key, Trash2, StickyNote, Crown, Database, Briefcase, Check, X } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCRMData } from '@/hooks/useCRMData';
import { ClientForm } from '@/components/forms/ClientForm';
import { AddContactDialog } from '@/components/clients/AddContactDialog';
import { currentUser, isSuperAdmin } from '@/data/mockData';
import type { ClientStatus, Client, ClientContact, ClientTier } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const tierConfig: Record<ClientTier, { label: string; color: string; icon: string }> = {
  standard: { label: 'Standard', color: 'bg-muted text-muted-foreground', icon: '' },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🥇' },
  platinum: { label: 'Platinum', color: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200', icon: '💎' },
  diamond: { label: 'Diamond', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: '👑' },
};

const getAresUrl = (ico: string) => `https://ares.gov.cz/ekonomicke-subjekty/res/${ico}`;

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightedRef = useRef<HTMLDivElement>(null);
  const { 
    clients, 
    engagements, 
    clientServices, 
    assignments, 
    colleagues,
    services,
    addClient, 
    updateClient,
    getContactsByClientId,
    addContact,
    updateContact,
    deleteContact,
  } = useCRMData();
  
  const superAdmin = isSuperAdmin();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<ClientTier | 'all'>('all');
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

  // Billing email editing state
  const [editingBillingEmailClientId, setEditingBillingEmailClientId] = useState<string | null>(null);
  const [tempBillingEmail, setTempBillingEmail] = useState('');

  // Handle highlight from URL
  useEffect(() => {
    if (highlightId) {
      setExpandedClientId(highlightId);
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightId]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.ico.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesTier = tierFilter === 'all' || client.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [clients, searchQuery, statusFilter, tierFilter]);

  const getClientDetails = (clientId: string) => {
    const clientEngagements = engagements.filter(e => e.client_id === clientId);
    const activeEngagements = clientEngagements.filter(e => e.status === 'active');
    const totalMonthlyFee = activeEngagements.reduce((sum, e) => sum + e.monthly_fee, 0);
    
    const clientServiceList = clientServices
      .filter(cs => cs.client_id === clientId && cs.is_active)
      .map(cs => services.find(s => s.id === cs.service_id))
      .filter(Boolean);
    
    const colleagueIds = new Set<string>();
    let totalCost = 0;
    
    clientEngagements.forEach(eng => {
      const engAssignments = assignments.filter(
        a => a.engagement_id === eng.id && !a.end_date
      );
      engAssignments.forEach(a => {
        colleagueIds.add(a.colleague_id);
        totalCost += a.monthly_cost || 0;
      });
    });
    
    const assignedColleagues = Array.from(colleagueIds)
      .map(id => colleagues.find(c => c.id === id))
      .filter(Boolean);
    
    const contacts = getContactsByClientId(clientId);
    
    return { 
      activeCount: activeEngagements.length, 
      totalMonthlyFee, 
      totalCost,
      clientServiceList,
      assignedColleagues,
      engagements: clientEngagements,
      contacts,
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

  const handleFormSubmit = (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
      toast.success('Klient byl upraven');
    } else {
      addClient(data);
      toast.success('Klient byl vytvořen');
    }
    setIsFormOpen(false);
    setEditingClient(null);
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

  const handleContactSubmit = (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingContact) {
      updateContact(editingContact.id, data);
      toast.success('Kontakt byl upraven');
    } else {
      addContact(data);
      toast.success('Kontakt byl přidán');
    }
  };

  const handleDeleteContact = () => {
    if (deleteContactId) {
      deleteContact(deleteContactId);
      toast.success('Kontakt byl smazán');
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatus | 'all')}>
          <SelectTrigger className="w-[160px]">
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
        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as ClientTier | 'all')}>
          <SelectTrigger className="w-[160px]">
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
      </div>

      <div className="space-y-3">
        {filteredClients.map((client) => {
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
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(client.id)}
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
                        >
                          <ExternalLink className="h-3 w-3" />
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
                  {client.tier && client.tier !== 'standard' && (
                    <Badge className={cn(tierConfig[client.tier].color, "text-xs py-0 px-2")}>
                      {tierConfig[client.tier].icon} {tierConfig[client.tier].label}
                    </Badge>
                  )}
                  <StatusBadge status={client.status} />
                  {superAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={(e) => handleEditClient(client, e)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              updateClient(client.id, { pinned_notes: tempNotes });
                              setEditingNotesClientId(null);
                              setTempNotes('');
                              toast.success('Poznámka uložena');
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
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
                            <Badge className={tierConfig[client.tier].color}>
                              {tierConfig[client.tier].icon} {tierConfig[client.tier].label}
                            </Badge>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateClient(client.id, { billing_email: tempBillingEmail || null });
                                    setEditingBillingEmailClientId(null);
                                    setTempBillingEmail('');
                                    toast.success('Fakturační email uložen');
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
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
                                {superAdmin && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditContact(contact);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteContactId(contact.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
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
                        {superAdmin && (
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
                                  ? `${eng.monthly_fee.toLocaleString()} CZK/měs`
                                  : `${eng.one_off_fee.toLocaleString()} CZK`
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

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingClient ? 'Upravit klienta' : 'Nový klient'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ClientForm
              client={editingClient || undefined}
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
    </div>
  );
}
