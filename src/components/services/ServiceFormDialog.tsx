import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { serviceTierConfigs } from '@/constants/services';
import type { Service, ServiceCategory, ServiceType, CoreServicePricing } from '@/types/crm';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSave: (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => void;
}

const categoryOptions: { value: ServiceCategory; label: string }[] = [
  { value: 'performance', label: 'Performance' },
  { value: 'creative', label: 'Kreativa' },
  { value: 'lead_gen', label: 'Lead Gen' },
  { value: 'analytics', label: 'Analytika' },
  { value: 'consulting', label: 'Konzultace' },
];

const currencyOptions = ['CZK', 'EUR', 'USD'];

export function ServiceFormDialog({ open, onOpenChange, service, onSave }: ServiceFormDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('addon');
  const [category, setCategory] = useState<ServiceCategory>('performance');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [currency, setCurrency] = useState('CZK');
  const [billingType, setBillingType] = useState<'monthly' | 'one_off'>('monthly');
  const [isActive, setIsActive] = useState(true);
  const [showOfferDefaults, setShowOfferDefaults] = useState(false);
  
  // Tier pricing for Core services
  const [tierPricing, setTierPricing] = useState<CoreServicePricing[]>([
    { tier: 'growth', price: null },
    { tier: 'pro', price: null },
    { tier: 'elite', price: null },
  ]);
  
  // Default values for offers
  const [defaultDeliverables, setDefaultDeliverables] = useState<string[]>([]);

  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      setName(service.name);
      setCode(service.code);
      setServiceType(service.service_type);
      setCategory(service.category);
      setDescription(service.description);
      setExternalUrl(service.external_url || '');
      setBasePrice(service.base_price);
      setCurrency(service.currency);
      setBillingType(service.billing_type);
      setIsActive(service.is_active);
      setTierPricing(service.tier_pricing || [
        { tier: 'growth', price: null },
        { tier: 'pro', price: null },
        { tier: 'elite', price: null },
      ]);
      setDefaultDeliverables(service.default_deliverables || []);
    } else {
      setName('');
      setCode('');
      setServiceType('addon');
      setCategory('performance');
      setDescription('');
      setExternalUrl('');
      setBasePrice(0);
      setCurrency('CZK');
      setBillingType('monthly');
      setIsActive(true);
      setTierPricing([
        { tier: 'growth', price: null },
        { tier: 'pro', price: null },
        { tier: 'elite', price: null },
      ]);
      setDefaultDeliverables([]);
    }
  }, [service, open]);

  const handleTierPriceChange = (tier: 'growth' | 'pro' | 'elite', value: string) => {
    setTierPricing(prev => prev.map(tp => 
      tp.tier === tier 
        ? { ...tp, price: value === '' ? null : Number(value) }
        : tp
    ));
  };
  
  const handleAddDeliverable = () => {
    setDefaultDeliverables(prev => [...prev, '']);
  };
  
  const handleDeliverableChange = (index: number, value: string) => {
    setDefaultDeliverables(prev => prev.map((d, i) => i === index ? value : d));
  };
  
  const handleRemoveDeliverable = (index: number) => {
    setDefaultDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || !code.trim()) return;

    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase().replace(/\s+/g, '_'),
      service_type: serviceType,
      category,
      description: description.trim(),
      external_url: externalUrl.trim() || null,
      base_price: serviceType === 'core' ? (tierPricing.find(t => t.tier === 'growth')?.price || 0) : basePrice,
      currency,
      billing_type: billingType,
      tier_pricing: serviceType === 'core' ? tierPricing : null,
      is_active: isActive,
      default_deliverables: defaultDeliverables.filter(d => d.trim()) || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Upravit službu' : 'Přidat službu'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Název služby *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Socials Boost"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kód *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="např. SOCIALS_BOOST"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Typ služby *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={serviceType === 'core' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setServiceType('core')}
              >
                Core
              </Button>
              <Button
                type="button"
                variant={serviceType === 'addon' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setServiceType('addon')}
              >
                Add-on
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Core služby mají tříúrovňový ceník dle spendu klienta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingType">Typ fakturace *</Label>
            <Select value={billingType} onValueChange={(v) => setBillingType(v as 'monthly' | 'one_off')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Měsíčně</SelectItem>
                <SelectItem value="one_off">Jednorázově</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Měsíčně = opakující se služba, Jednorázově = jednorázová služba
            </p>
          </div>

          {serviceType === 'addon' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Základní cena</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  placeholder="25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Měna</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Ceník dle spendu klienta</Label>
              <div className="grid grid-cols-3 gap-2">
                {serviceTierConfigs.map((config) => {
                  const pricing = tierPricing.find(tp => tp.tier === config.tier);
                  return (
                    <div key={config.tier} className="space-y-1">
                      <Label className="text-xs font-medium">{config.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{config.spend_description}</p>
                      <Input
                        type="number"
                        min={0}
                        value={pricing?.price ?? ''}
                        onChange={(e) => handleTierPriceChange(config.tier, e.target.value)}
                        placeholder={config.tier === 'elite' ? 'Individ.' : '0'}
                        className="h-8 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Prázdné pole = individuální kalkulace
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Popis služby</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Popis služby - zobrazí se také v nabídkách pro klienty..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Tento popis se zobrazí ve sdílených nabídkách pro klienty
            </p>
          </div>
          
          {/* Collapsible section for offer defaults */}
          <Collapsible open={showOfferDefaults} onOpenChange={setShowOfferDefaults}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>📦 Výchozí hodnoty pro nabídky</span>
                {showOfferDefaults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Deliverables */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Co klient dostane</Label>
                <div className="space-y-2">
                  {defaultDeliverables.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleDeliverableChange(index, e.target.value)}
                        placeholder="např. Správa kampaní na Meta platformách"
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveDeliverable(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddDeliverable}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Přidat položku
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tyto položky se automaticky předvyplní v nabídce pro klienta
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-2">
            <Label htmlFor="externalUrl">Externí URL</Label>
            <Input
              id="externalUrl"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://socials.cz/sluzby/..."
            />
            <p className="text-xs text-muted-foreground">
              Odkaz na stránku s detailním popisem služby
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Služba je aktivní</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !code.trim()}>
            {isEditing ? 'Uložit' : 'Přidat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
