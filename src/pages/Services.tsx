import { useState, useMemo } from 'react';
import { Search, Plus, MoreVertical, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMData } from '@/hooks/useCRMData';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { ServiceDetailView } from '@/components/services/ServiceDetailView';
import { serviceTierConfigs } from '@/constants/services';
import { getServiceDetail } from '@/constants/serviceDetails';
import { toast } from 'sonner';
import type { Service, ServiceCategory, ServiceType } from '@/types/crm';

const categoryColors: Record<ServiceCategory, string> = {
  performance: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  creative: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  lead_gen: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  analytics: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  consulting: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

const categoryLabels: Record<ServiceCategory, string> = {
  performance: 'Performance',
  creative: 'Kreativa',
  lead_gen: 'Lead Gen',
  analytics: 'Analytika',
  consulting: 'Konzultace',
};

export default function Services() {
  const { services, engagementServices, clients, engagements, addService, updateService, deleteService, toggleServiceActive } = useCRMData();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ServiceType>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || service.service_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [services, searchQuery, typeFilter]);

  // Group services by type
  const coreServices = filteredServices.filter(s => s.service_type === 'core');
  const addonServices = filteredServices.filter(s => s.service_type === 'addon');

  const getActiveClientCount = (serviceId: string) => {
    // Get engagement IDs that use this service
    const engagementIds = engagementServices
      .filter(es => es.service_id === serviceId && es.is_active)
      .map(es => es.engagement_id);
    // Get unique client IDs from those engagements
    const clientIds = engagements
      .filter(e => engagementIds.includes(e.id))
      .map(e => e.client_id);
    return new Set(clientIds).size;
  };

  const getActiveClientsForService = (serviceId: string) => {
    const engagementIds = engagementServices
      .filter(es => es.service_id === serviceId && es.is_active)
      .map(es => es.engagement_id);
    const clientIds = engagements
      .filter(e => engagementIds.includes(e.id))
      .map(e => e.client_id);
    const uniqueClientIds = [...new Set(clientIds)];
    return clients.filter((c) => uniqueClientIds.includes(c.id));
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormDialogOpen(true);
  };

  const handleSaveService = (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingService) {
      updateService(editingService.id, data);
      toast.success(`${data.name} byla úspěšně upravena`);
    } else {
      addService(data);
      toast.success(`${data.name} byla úspěšně vytvořena`);
    }
  };

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete.id);
      toast.success(`${serviceToDelete.name} byla odstraněna`);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      if (expandedServiceId === serviceToDelete.id) {
        setExpandedServiceId(null);
      }
    }
  };

  const handleToggleActive = (service: Service) => {
    toggleServiceActive(service.id);
    toast.success(service.is_active ? 'Služba deaktivována' : 'Služba aktivována');
  };

  const handleCategoryChange = (service: Service, category: ServiceCategory) => {
    updateService(service.id, { category });
    toast.success('Kategorie byla změněna');
  };

  const handlePriceSave = (service: Service) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      updateService(service.id, { base_price: newPrice });
      toast.success('Cena byla aktualizována');
    }
    setEditingPriceId(null);
  };

  const toggleExpand = (serviceId: string) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
    setEditingPriceId(null);
  };

  const renderServiceCard = (service: Service) => {
    const isExpanded = expandedServiceId === service.id;
    const activeClients = getActiveClientsForService(service.id);
    const activeClientCount = getActiveClientCount(service.id);
    const serviceDetail = getServiceDetail(service.code);

    return (
      <Card key={service.id} className="overflow-hidden">
        {/* Header - Collapsed View */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleExpand(service.id)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold text-sm">
                {service.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{service.name}</div>
              <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {service.code}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={service.service_type === 'core' 
                ? 'bg-primary/10 text-primary border-primary/20 text-xs' 
                : 'bg-muted text-muted-foreground text-xs'
              }
            >
              {service.service_type === 'core' ? 'Core' : 'Add-on'}
            </Badge>

            <Badge 
              variant="outline" 
              className={service.is_active 
                ? 'bg-status-active/10 text-status-active border-status-active/20 text-xs' 
                : 'bg-muted text-muted-foreground border-muted text-xs'
              }
            >
              {service.is_active ? 'Aktivní' : 'Neaktivní'}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => handleEditService(service)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Upravit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                  {service.is_active ? 'Deaktivovat' : 'Aktivovat'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(service)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Smazat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <CardContent className="border-t bg-muted/30 p-3">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Kód:</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{service.code}</code>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Kategorie:</span>
                <Select
                  value={service.category}
                  onValueChange={(value) => handleCategoryChange(service, value as ServiceCategory)}
                >
                  <SelectTrigger className="w-[120px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Switch
                  checked={service.is_active}
                  onCheckedChange={() => handleToggleActive(service)}
                  className="scale-90"
                />
                <span className="text-xs">
                  {service.is_active ? 'Aktivní' : 'Neaktivní'}
                </span>
              </div>

              {/* Only show base price editing for Add-on services */}
              {service.service_type === 'addon' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cena:</span>
                  {editingPriceId === service.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handlePriceSave(service);
                          } else if (e.key === 'Escape') {
                            setEditingPriceId(null);
                          }
                        }}
                        onBlur={() => handlePriceSave(service)}
                        className="h-7 w-24 text-xs"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground">{service.currency}</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPriceId(service.id);
                        setTempPrice(String(service.base_price));
                      }}
                      className="flex items-center gap-1 text-xs font-medium hover:text-primary transition-colors"
                    >
                      {service.base_price > 0
                        ? `${service.base_price.toLocaleString('cs-CZ')} ${service.currency}${service.code === 'CREATIVE_BOOST' ? '/kredit' : ''}`
                        : 'Nenastaveno'}
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {service.external_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => window.open(service.external_url, '_blank')}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Detail služby
                </Button>
              )}
            </div>

            {/* Service Detail View - shows detailed info if available */}
            {serviceDetail ? (
              <div className="mt-3 pt-3 border-t">
                <ServiceDetailView detail={serviceDetail} />
              </div>
            ) : (
              <>
                {/* Fallback: Tier Pricing Table for Core services */}
                {service.service_type === 'core' && service.tier_pricing && (
                  <div className="mt-3 pt-3 border-t">
                    <h5 className="text-xs font-medium mb-2">Ceník dle spendu klienta:</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {serviceTierConfigs.map((config) => {
                        const pricing = service.tier_pricing?.find(p => p.tier === config.tier);
                        return (
                          <div key={config.tier} className="bg-muted rounded-lg p-2 text-center">
                            <div className="text-xs font-semibold">{config.label}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {config.spend_description}
                            </div>
                            <div className="mt-1 font-bold text-sm">
                              {pricing?.price !== null && pricing?.price !== undefined ? (
                                <>
                                  {pricing.original_price && (
                                    <span className="line-through text-muted-foreground text-xs mr-1">
                                      {pricing.original_price.toLocaleString('cs-CZ')} Kč
                                    </span>
                                  )}
                                  <span className={pricing.original_price ? 'text-status-active' : ''}>
                                    {pricing.price.toLocaleString('cs-CZ')} Kč
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-xs">Individuální</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback: Description */}
                {service.description && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Active Clients */}
            {activeClients.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Aktivní klienti:</span>
                  {activeClients.map((client) => (
                    <Badge
                      key={client.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients?highlight=${client.id}`);
                      }}
                    >
                      {client.brand_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3 pt-3 border-t flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleEditService(service)}>
                <Pencil className="mr-1 h-3 w-3" />
                Upravit
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleToggleActive(service)}>
                {service.is_active ? 'Deaktivovat' : 'Aktivovat'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleDeleteClick(service)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Smazat
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="📦 Služby"
        titleAccent="agentury"
        description="Správa nabídky služeb"
        actions={
          <Button className="gap-2" onClick={handleAddService}>
            <Plus className="h-4 w-4" />
            Přidat službu
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat služby..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={typeFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            Všechny
          </Button>
          <Button 
            variant={typeFilter === 'core' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('core')}
          >
            Core služby
          </Button>
          <Button 
            variant={typeFilter === 'addon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('addon')}
          >
            Add-ony
          </Button>
        </div>
      </div>

      {typeFilter === 'all' ? (
        <>
          {/* Core Services Section */}
          {coreServices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Core služby</h3>
              {coreServices.map(renderServiceCard)}
            </div>
          )}

          {/* Add-on Services Section */}
          {addonServices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Add-on služby</h3>
              {addonServices.map(renderServiceCard)}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {filteredServices.map(renderServiceCard)}
        </div>
      )}

      {filteredServices.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? 'Žádné služby neodpovídají hledání' : 'Zatím nejsou žádné služby'}
          </p>
        </Card>
      )}

      <ServiceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        service={editingService}
        onSave={handleSaveService}
      />

      <DeleteServiceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        service={serviceToDelete}
        activeClientCount={serviceToDelete ? getActiveClientCount(serviceToDelete.id) : 0}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}