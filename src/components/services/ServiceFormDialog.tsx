import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2, Users } from 'lucide-react';
import { serviceTierConfigs } from '@/constants/services';
import type { Service, ServiceCategory, ServiceType, CoreServicePricing, ServiceRewardTierConfig, ServiceRewardRole } from '@/types/crm';

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

const ROLE_OPTIONS = [
  'Meta Ads Specialist',
  'PPC Specialist',
  'Graphic Designer',
  'Video Editor',
  'Sales Specialist',
  'Account Manager',
];

const REWARD_TYPE_OPTIONS: { value: ServiceRewardRole['reward_type']; label: string }[] = [
  { value: 'fixed_monthly', label: 'Fixní měsíční' },
  { value: 'per_credit', label: 'Za kredit' },
  { value: 'hourly', label: 'Hodinová' },
];

const currencyOptions = ['CZK', 'EUR', 'USD'];

export function ServiceFormDialog({ open, onOpenChange, service, onSave }: ServiceFormDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('addon');
  const [category, setCategory] = useState<ServiceCategory>('performance');
  const [description, setDescription] = useState('');
  
  const [basePrice, setBasePrice] = useState<number>(0);
  const [currency, setCurrency] = useState('CZK');
  const [isActive, setIsActive] = useState(true);
  const [showOfferDefaults, setShowOfferDefaults] = useState(false);
  const [showRewardConfig, setShowRewardConfig] = useState(false);
  
  const [tierPricing, setTierPricing] = useState<CoreServicePricing[]>([
    { tier: 'growth', price: null },
    { tier: 'pro', price: null },
    { tier: 'elite', price: null },
  ]);
  
  const [defaultDeliverables, setDefaultDeliverables] = useState<string[]>([]);
  const [rewardConfig, setRewardConfig] = useState<ServiceRewardTierConfig[]>([]);

  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      setName(service.name);
      setCode(service.code);
      setServiceType(service.service_type);
      setCategory(service.category);
      setDescription(service.description);
      setBasePrice(service.base_price);
      setCurrency(service.currency);
      setIsActive(service.is_active);
      setTierPricing(service.tier_pricing || [
        { tier: 'growth', price: null },
        { tier: 'pro', price: null },
        { tier: 'elite', price: null },
      ]);
      setDefaultDeliverables(service.default_deliverables || []);
      setRewardConfig(service.reward_config || []);
      setShowRewardConfig(!!(service.reward_config && service.reward_config.length > 0));
    } else {
      setName('');
      setCode('');
      setServiceType('addon');
      setCategory('performance');
      setDescription('');
      setBasePrice(0);
      setCurrency('CZK');
      setIsActive(true);
      setTierPricing([
        { tier: 'growth', price: null },
        { tier: 'pro', price: null },
        { tier: 'elite', price: null },
      ]);
      setDefaultDeliverables([]);
      setRewardConfig([]);
      setShowRewardConfig(false);
    }
  }, [service, open]);

  const handleTierPriceChange = (tier: 'growth' | 'pro' | 'elite', value: string) => {
    setTierPricing(prev => prev.map(tp => 
      tp.tier === tier ? { ...tp, price: value === '' ? null : Number(value) } : tp
    ));
  };
  
  const handleAddDeliverable = () => setDefaultDeliverables(prev => [...prev, '']);
  const handleDeliverableChange = (index: number, value: string) => {
    setDefaultDeliverables(prev => prev.map((d, i) => i === index ? value : d));
  };
  const handleRemoveDeliverable = (index: number) => {
    setDefaultDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  // Reward config helpers
  const addRewardTierConfig = (tier?: string) => {
    setRewardConfig(prev => [...prev, {
      tier,
      roles: [{ role: '', hours: 0, reward: 0, reward_type: 'fixed_monthly' as const }],
    }]);
  };

  const removeRewardTierConfig = (idx: number) => {
    setRewardConfig(prev => prev.filter((_, i) => i !== idx));
  };

  const addRoleToTier = (tierIdx: number) => {
    setRewardConfig(prev => prev.map((tc, i) =>
      i === tierIdx
        ? { ...tc, roles: [...tc.roles, { role: '', hours: 0, reward: 0, reward_type: 'fixed_monthly' as const }] }
        : tc
    ));
  };

  const removeRoleFromTier = (tierIdx: number, roleIdx: number) => {
    setRewardConfig(prev => prev.map((tc, i) =>
      i === tierIdx ? { ...tc, roles: tc.roles.filter((_, ri) => ri !== roleIdx) } : tc
    ));
  };

  const updateRole = (tierIdx: number, roleIdx: number, field: keyof ServiceRewardRole, value: string | number) => {
    setRewardConfig(prev => prev.map((tc, i) =>
      i === tierIdx
        ? {
            ...tc,
            roles: tc.roles.map((r, ri) =>
              ri === roleIdx ? { ...r, [field]: field === 'hours' || field === 'reward' ? Number(value) : value } : r
            ),
          }
        : tc
    ));
  };

  const scaffoldCoreRewards = () => {
    const tiers = ['growth', 'pro', 'elite'];
    const newConfig = tiers.map(tier => {
      const existing = rewardConfig.find(rc => rc.tier === tier);
      return existing || {
        tier,
        roles: [{ role: '', hours: 0, reward: 0, reward_type: 'fixed_monthly' as const }],
      };
    });
    setRewardConfig(newConfig);
  };

  const handleSave = () => {
    if (!name.trim() || !code.trim()) return;

    const cleanedRewardConfig = rewardConfig
      .map(tc => ({
        ...tc,
        roles: tc.roles.filter(r => r.role.trim() && r.reward > 0),
      }))
      .filter(tc => tc.roles.length > 0);

    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase().replace(/\s+/g, '_'),
      service_type: serviceType,
      category,
      description: description.trim(),
      external_url: null,
      base_price: serviceType === 'core' ? (tierPricing.find(t => t.tier === 'growth')?.price || 0) : basePrice,
      currency,
      tier_pricing: serviceType === 'core' ? tierPricing : null,
      is_active: isActive,
      default_deliverables: defaultDeliverables.filter(d => d.trim()) || null,
      reward_config: cleanedRewardConfig.length > 0 ? cleanedRewardConfig : null,
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Socials Boost" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kód *</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="např. SOCIALS_BOOST" className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Typ služby *</Label>
            <div className="flex gap-2">
              <Button type="button" variant={serviceType === 'core' ? 'default' : 'outline'} size="sm" onClick={() => setServiceType('core')}>Core</Button>
              <Button type="button" variant={serviceType === 'addon' ? 'default' : 'outline'} size="sm" onClick={() => setServiceType('addon')}>Add-on</Button>
            </div>
            <p className="text-xs text-muted-foreground">Core služby mají tříúrovňový ceník dle spendu klienta</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceType === 'addon' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Základní cena</Label>
                <Input id="basePrice" type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} placeholder="25000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Měna</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
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
                      <Input type="number" min={0} value={pricing?.price ?? ''} onChange={(e) => handleTierPriceChange(config.tier, e.target.value)} placeholder={config.tier === 'elite' ? 'Individ.' : '0'} className="h-8 text-xs" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Prázdné pole = individuální kalkulace</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Popis služby</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Popis služby - zobrazí se také v nabídkách pro klienty..." rows={4} />
            <p className="text-xs text-muted-foreground">Tento popis se zobrazí ve sdílených nabídkách pro klienty</p>
          </div>
          
          {/* Offer defaults */}
          <Collapsible open={showOfferDefaults} onOpenChange={setShowOfferDefaults}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>📦 Výchozí hodnoty pro nabídky</span>
                {showOfferDefaults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Co klient dostane</Label>
                <div className="space-y-2">
                  {defaultDeliverables.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={item} onChange={(e) => handleDeliverableChange(index, e.target.value)} placeholder="např. Správa kampaní na Meta platformách" className="flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDeliverable(index)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddDeliverable}>
                    <Plus className="h-4 w-4 mr-1" />Přidat položku
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Tyto položky se automaticky předvyplní v nabídce pro klienta</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Reward config */}
          <Collapsible open={showRewardConfig} onOpenChange={setShowRewardConfig}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Odměny kolegů dle pozice
                  {rewardConfig.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({rewardConfig.reduce((sum, tc) => sum + tc.roles.length, 0)} rolí)
                    </span>
                  )}
                </span>
                {showRewardConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Nastavte doporučené odměny pro kolegy dle pozice. U core služeb se odměny nastavují per tier.
                Tyto hodnoty se budou navrhovat při úpravách zakázek.
              </p>

              {serviceType === 'core' && rewardConfig.length === 0 && (
                <Button variant="outline" size="sm" onClick={scaffoldCoreRewards}>
                  <Plus className="h-4 w-4 mr-1" />Přidat odměny pro Growth / Pro / Elite
                </Button>
              )}

              {serviceType === 'addon' && rewardConfig.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => addRewardTierConfig(undefined)}>
                  <Plus className="h-4 w-4 mr-1" />Přidat odměny
                </Button>
              )}

              {rewardConfig.map((tierConfig, tierIdx) => (
                <div key={tierIdx} className="space-y-2 p-3 rounded-md border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider">
                      {tierConfig.tier ? tierConfig.tier.toUpperCase() : 'Odměny'}
                    </Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive" onClick={() => removeRewardTierConfig(tierIdx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {tierConfig.roles.map((role, roleIdx) => (
                    <div key={roleIdx} className="grid grid-cols-[1fr_60px_80px_100px_28px] gap-1.5 items-end">
                      <div className="space-y-0.5">
                        {roleIdx === 0 && <Label className="text-[10px] text-muted-foreground">Pozice</Label>}
                        <Select value={role.role} onValueChange={(v) => updateRole(tierIdx, roleIdx, 'role', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pozice" /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map(r => (<SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-0.5">
                        {roleIdx === 0 && <Label className="text-[10px] text-muted-foreground">Hodiny</Label>}
                        <Input type="number" value={role.hours} onChange={(e) => updateRole(tierIdx, roleIdx, 'hours', e.target.value)} className="h-8 text-xs" step="0.5" />
                      </div>
                      <div className="space-y-0.5">
                        {roleIdx === 0 && <Label className="text-[10px] text-muted-foreground">Odměna</Label>}
                        <Input type="number" value={role.reward} onChange={(e) => updateRole(tierIdx, roleIdx, 'reward', e.target.value)} className="h-8 text-xs" step="100" />
                      </div>
                      <div className="space-y-0.5">
                        {roleIdx === 0 && <Label className="text-[10px] text-muted-foreground">Typ</Label>}
                        <Select value={role.reward_type} onValueChange={(v) => updateRole(tierIdx, roleIdx, 'reward_type', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REWARD_TYPE_OPTIONS.map(rt => (<SelectItem key={rt.value} value={rt.value} className="text-xs">{rt.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Button variant="ghost" size="sm" className="h-8 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeRoleFromTier(tierIdx, roleIdx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addRoleToTier(tierIdx)}>
                    <Plus className="h-3 w-3 mr-1" />Přidat roli
                  </Button>
                </div>
              ))}

              {rewardConfig.length > 0 && serviceType === 'addon' && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => addRewardTierConfig(undefined)}>
                  <Plus className="h-3 w-3 mr-1" />Přidat skupinu
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Služba je aktivní</Label>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !code.trim()}>
            {isEditing ? 'Uložit' : 'Přidat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
