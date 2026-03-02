import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Star, Key, Phone, Mail, Copy, Check, Loader2, ChevronLeft, ChevronRight, StickyNote, X, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCRMData } from '@/hooks/useCRMData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // Issue #23: Import shared hook
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AddContactDialog } from '@/components/clients/AddContactDialog';
import type { ClientContact } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { getClientOptionLabel } from '@/lib/clientOptionLabel';

// Copy button component
function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => { e.stopPropagation(); copy(); }}
      className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", className)}
      aria-label="Kopírovat"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

// Pagination constants
const CONTACTS_PER_PAGE = 50;

export default function Contacts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightedRef = useRef<HTMLDivElement>(null);

  const { clients, clientContacts, addContact, updateContact, deleteContact, canDeleteContact, isLoading } = useCRMData();

  // Pre-build a Map for O(1) client lookups instead of O(n) per contact
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // Issue #18: Filter clients to only show active ones (not lost/paused) in dropdown
  const activeClients = useMemo(() =>
    clients.filter(c => !['lost', 'paused'].includes(c.status)),
    [clients]
  );

  const { role, isSuperAdmin } = useUserRole();
  // Allow editing for super admin or roles: admin, management, project_manager, specialist
  const canModify = isSuperAdmin || ['admin', 'management', 'project_manager', 'specialist'].includes(role || '');

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    clientId: 'all' as string,
    isPrimary: 'all' as string,
    isDecisionMaker: 'all' as string,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  // Issue #25: Add loading state for delete
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  // Get contact to delete for showing name in dialog
  const contactToDelete = useMemo(() => {
    if (!deleteContactId) return null;
    return clientContacts.find(c => c.id === deleteContactId);
  }, [deleteContactId, clientContacts]);

  // Enrich contacts with client info using O(1) Map lookup
  const enrichedContacts = useMemo(() => {
    return clientContacts.map(contact => ({
      ...contact,
      client: clientsMap.get(contact.client_id),
    }));
  }, [clientContacts, clientsMap]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return enrichedContacts.filter(contact => {
      // Text search
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const clientLabel = getClientOptionLabel(contact.client ?? {}).toLowerCase();
        const matchesSearch =
          contact.name.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query) ||
          clientLabel.includes(query) ||
          contact.client?.brand_name?.toLowerCase().includes(query) ||
          contact.position?.toLowerCase().includes(query) ||
          contact.notes?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Client filter
      if (filters.clientId !== 'all' && contact.client_id !== filters.clientId) {
        return false;
      }

      // Primary filter
      if (filters.isPrimary !== 'all') {
        const isPrimary = filters.isPrimary === 'true';
        if (contact.is_primary !== isPrimary) return false;
      }

      // Decision maker filter
      if (filters.isDecisionMaker !== 'all') {
        const isDM = filters.isDecisionMaker === 'true';
        if (contact.is_decision_maker !== isDM) return false;
      }

      return true;
    });
  }, [enrichedContacts, debouncedSearch, filters]);

  // Issue #11: Handle highlight from URL - navigate to correct page first
  useEffect(() => {
    if (highlightId && filteredContacts.length > 0) {
      const contactIndex = filteredContacts.findIndex(c => c.id === highlightId);
      if (contactIndex >= 0) {
        const targetPage = Math.floor(contactIndex / CONTACTS_PER_PAGE) + 1;
        if (page !== targetPage) {
          setPage(targetPage);
        }
        // Scroll after page change settles
        setTimeout(() => {
          highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightId, filteredContacts, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // Issue #10: Reset page when filter results change and current page is out of bounds
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredContacts.length, page]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const paginatedContacts = useMemo(() => {
    const start = (page - 1) * CONTACTS_PER_PAGE;
    return filteredContacts.slice(start, start + CONTACTS_PER_PAGE);
  }, [filteredContacts, page]);

  const startIndex = (page - 1) * CONTACTS_PER_PAGE + 1;
  const endIndex = Math.min(page * CONTACTS_PER_PAGE, filteredContacts.length);

  // Check if any advanced filters are active
  const hasActiveFilters = filters.isPrimary !== 'all' || filters.isDecisionMaker !== 'all';

  const clearAllFilters = useCallback(() => {
    setFilters({
      clientId: 'all',
      isPrimary: 'all',
      isDecisionMaker: 'all',
    });
    setSearchQuery('');
  }, []);

  const handleAddContact = async (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await addContact(data);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleEditContact = async (data: Omit<ClientContact, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingContact) {
      try {
        await updateContact(editingContact.id, data);
        setEditingContact(null);
      } catch (error) {
        console.error('Failed to update contact:', error);
      }
    }
  };

  // Issue #25: Add loading state on delete button
  const handleDeleteContact = async () => {
    if (!deleteContactId) return;

    setIsDeletingContact(true);
    const { allowed, reason } = await canDeleteContact(deleteContactId);
    if (!allowed) {
      toast.error(reason || 'Kontakt nelze smazat');
      setDeleteContactId(null);
      setIsDeletingContact(false);
      return;
    }

    try {
      await deleteContact(deleteContactId);
      setDeleteContactId(null);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setDeleteContactId(null);
    } finally {
      setIsDeletingContact(false);
    }
  };

  const openAddDialog = () => {
    if (clients.length > 0) {
      setIsAddDialogOpen(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Načítání kontaktů...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="📇 Kontakty"
        titleAccent="klientů"
        description="Přehled všech kontaktních osob klientů"
        actions={
          canModify && (
            // Issue #19: Add Tooltip on disabled Add Contact button
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button onClick={openAddDialog} disabled={clients.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat kontakt
                  </Button>
                </span>
              </TooltipTrigger>
              {clients.length === 0 && (
                <TooltipContent>
                  Nejprve vytvořte alespoň jednoho klienta
                </TooltipContent>
              )}
            </Tooltip>
          )
        }
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat podle jména, emailu, telefonu, firmy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.clientId}
            onValueChange={(v) => setFilters(f => ({ ...f, clientId: v }))}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filtr podle klienta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni klienti</SelectItem>
              {/* Issue #18: Only show active clients in filter dropdown */}
              {activeClients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {getClientOptionLabel(client)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showAdvancedFilters || hasActiveFilters ? "secondary" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtry</span>
            {hasActiveFilters && (
              <Badge variant="default" className="h-5 w-5 p-0 justify-center text-xs">
                {(filters.isPrimary !== 'all' ? 1 : 0) + (filters.isDecisionMaker !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        <Collapsible open={showAdvancedFilters}>
          <CollapsibleContent>
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Primární kontakt</label>
                  <Select
                    value={filters.isPrimary}
                    onValueChange={(v) => setFilters(f => ({ ...f, isPrimary: v }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="true">Pouze primární</SelectItem>
                      <SelectItem value="false">Neprimární</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Decision Maker</label>
                  <Select
                    value={filters.isDecisionMaker}
                    onValueChange={(v) => setFilters(f => ({ ...f, isDecisionMaker: v }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="true">Pouze DM</SelectItem>
                      <SelectItem value="false">Bez DM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(hasActiveFilters || debouncedSearch) && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Vymazat filtry
                  </Button>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredContacts.length === 0
              ? 'Žádné kontakty'
              : filteredContacts.length === 1
                ? '1 kontakt'
                : `${filteredContacts.length} kontaktů`}
            {debouncedSearch && ` pro "${debouncedSearch}"`}
          </span>
          {filteredContacts.length > CONTACTS_PER_PAGE && (
            <span>
              Zobrazeno {startIndex}-{endIndex} z {filteredContacts.length}
            </span>
          )}
        </div>
      </div>

      {/* Contacts Cards */}
      <div className="space-y-3">
        {paginatedContacts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Žádné kontakty nenalezeny
          </Card>
        ) : (
          paginatedContacts.map((contact) => (
            <Card
              key={contact.id}
              ref={highlightId === contact.id ? highlightedRef : null}
              className={cn(
                "overflow-hidden transition-all group",
                highlightId === contact.id && "ring-2 ring-primary"
              )}
            >
              {/* Mobile view - condensed card */}
              <div className="sm:hidden p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-sm truncate block">{contact.name}</span>
                      {contact.position && (
                        <span className="text-xs text-muted-foreground truncate block">{contact.position}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {contact.is_primary && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-yellow-500/50 text-yellow-600" aria-label="Primární kontakt">
                        <Star className="h-3 w-3" />
                      </Badge>
                    )}
                    {contact.is_decision_maker && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-blue-500/50 text-blue-600" aria-label="Rozhodovatel">
                        <Key className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  {/* Issue #12: Mobile email link with null check */}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-primary flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {contact.phone}
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                  <button
                    onClick={() => navigate(`/clients?highlight=${contact.client_id}`)}
                    className="text-primary hover:underline"
                  >
                    {getClientOptionLabel(contact.client ?? {})}
                  </button>
                  {canModify && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteContactId(contact.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes preview on mobile */}
                {contact.notes && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 flex items-start gap-1.5">
                    <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{contact.notes}</span>
                  </div>
                )}
              </div>

              {/* Desktop view */}
              <div className="hidden sm:flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{contact.name}</span>
                      {contact.is_primary && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 gap-1 border-yellow-500/50 text-yellow-600 shrink-0" aria-label="Primární kontakt">
                          <Star className="h-3 w-3" />
                          <span>Primární</span>
                        </Badge>
                      )}
                      {contact.is_decision_maker && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 gap-1 border-blue-500/50 text-blue-600 shrink-0" aria-label="Rozhodovatel">
                          <Key className="h-3 w-3" />
                          <span>DM</span>
                        </Badge>
                      )}
                      {/* Notes indicator */}
                      {contact.notes && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 h-5 gap-1 text-muted-foreground shrink-0 max-w-[200px]"
                          title={contact.notes}
                        >
                          <StickyNote className="h-3 w-3 shrink-0" />
                          <span className="truncate">{contact.notes.slice(0, 30)}{contact.notes.length > 30 ? '...' : ''}</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <button
                        onClick={() => navigate(`/clients?highlight=${contact.client_id}`)}
                        className="text-primary hover:underline"
                      >
                        {getClientOptionLabel(contact.client ?? {})}
                      </button>
                      {contact.position && <span> • {contact.position}</span>}
                    </p>
                  </div>
                </div>

                {/* Right side - contact info and actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Phone */}
                  {contact.phone && (
                    <div className="hidden sm:flex items-center gap-1 group/phone">
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </a>
                      <CopyButton value={contact.phone} />
                    </div>
                  )}

                  {/* Email */}
                  {contact.email && (
                    <div className="hidden md:flex items-center gap-1 group/email">
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{contact.email}</span>
                      </a>
                      <CopyButton value={contact.email} />
                    </div>
                  )}

                  {/* Action buttons */}
                  {canModify && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingContact(contact)}
                        aria-label={`Upravit kontakt ${contact.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteContactId(contact.id)}
                        aria-label={`Smazat kontakt ${contact.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            Strana {page} z {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Předchozí
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="gap-1"
            >
              Další
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Contact Dialog - Issue #22: Use shared component with showClientSelector */}
      {isAddDialogOpen && (
        <AddContactDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
          }}
          showClientSelector={true}
          clients={activeClients}
          onSubmit={handleAddContact}
        />
      )}

      {/* Edit Contact Dialog */}
      {editingContact && (
        <AddContactDialog
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          clientId={editingContact.client_id}
          contact={editingContact}
          onSubmit={handleEditContact}
        />
      )}

      {/* Delete Confirmation - Issue #17: Consistent delete message */}
      <AlertDialog open={!!deleteContactId} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat kontakt</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat kontakt <strong>"{contactToDelete?.name}"</strong>? Kontakt bude archivován a lze ho později obnovit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingContact}>Zrušit</AlertDialogCancel>
            {/* Issue #25: Add loading state on delete button */}
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingContact}
            >
              {isDeletingContact ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mazání...
                </>
              ) : (
                'Smazat'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
