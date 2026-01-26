import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { getServiceDetail } from '@/constants/serviceDetails';
import type { Service } from '@/types/crm';

interface SetupItem {
  title: string;
  items: string[];
}

interface TierFeature {
  feature: string;
  growth: string | boolean;
  pro: string | boolean;
  elite: string | boolean;
}

interface TierPrices {
  growth: { price: number; spend: string };
  pro: { price: number; spend: string };
  elite: { price: number; spend: string };
}

interface CreditPricing {
  basePrice: number;
  currency: string;
  expressMultiplier: number;
  colleagueRewardPerCredit: number;
  outputTypes: { name: string; credits: number; description: string }[];
}

interface ServiceDetailData {
  tagline: string;
  platforms: string[];
  target_audience: string;
  benefits: string[];
  setup_items: SetupItem[];
  management_items: SetupItem[];
  tier_comparison: TierFeature[];
  tier_prices: TierPrices | null;
  credit_pricing: CreditPricing | null;
}

interface ServiceDetailEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  onSave: (serviceId: string, data: Partial<ServiceDetailData>) => void;
}

const emptyTierPrices: TierPrices = {
  growth: { price: 0, spend: '' },
  pro: { price: 0, spend: '' },
  elite: { price: 0, spend: '' },
};

export function ServiceDetailEditDialog({ open, onOpenChange, service, onSave }: ServiceDetailEditDialogProps) {
  const [data, setData] = useState<ServiceDetailData>({
    tagline: '',
    platforms: [],
    target_audience: '',
    benefits: [],
    setup_items: [],
    management_items: [],
    tier_comparison: [],
    tier_prices: null,
    credit_pricing: null,
  });

  const [newPlatform, setNewPlatform] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (service) {
      // Load data from constants based on service code
      const constantDetail = getServiceDetail(service.code);
      
      if (constantDetail) {
        setData({
          tagline: constantDetail.tagline || '',
          platforms: constantDetail.platforms || [],
          target_audience: constantDetail.targetAudience || '',
          benefits: constantDetail.benefits || [],
          setup_items: constantDetail.setup || [],
          management_items: constantDetail.management || [],
          tier_comparison: constantDetail.tierComparison || [],
          tier_prices: constantDetail.tierPricing || null,
          credit_pricing: constantDetail.creditPricing || null,
        });
      } else {
        // Reset to empty state if no constant found
        setData({
          tagline: '',
          platforms: [],
          target_audience: '',
          benefits: [],
          setup_items: [],
          management_items: [],
          tier_comparison: [],
          tier_prices: null,
          credit_pricing: null,
        });
      }
    }
  }, [service]);

  const handleSave = () => {
    onSave(service.id, data);
    onOpenChange(false);
  };

  // Platform management
  const addPlatform = () => {
    if (newPlatform.trim()) {
      setData(prev => ({ ...prev, platforms: [...prev.platforms, newPlatform.trim()] }));
      setNewPlatform('');
    }
  };

  const removePlatform = (index: number) => {
    setData(prev => ({ ...prev, platforms: prev.platforms.filter((_, i) => i !== index) }));
  };

  // Benefits management
  const addBenefit = () => {
    if (newBenefit.trim()) {
      setData(prev => ({ ...prev, benefits: [...prev.benefits, newBenefit.trim()] }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setData(prev => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  };

  const updateBenefit = (index: number, value: string) => {
    setData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b),
    }));
  };

  // Setup items management
  const addSetupSection = () => {
    setData(prev => ({
      ...prev,
      setup_items: [...prev.setup_items, { title: 'Nová sekce', items: [] }],
    }));
  };

  const removeSetupSection = (index: number) => {
    setData(prev => ({
      ...prev,
      setup_items: prev.setup_items.filter((_, i) => i !== index),
    }));
  };

  const updateSetupSectionTitle = (index: number, title: string) => {
    setData(prev => ({
      ...prev,
      setup_items: prev.setup_items.map((s, i) => i === index ? { ...s, title } : s),
    }));
  };

  const addSetupItem = (sectionIndex: number) => {
    setData(prev => ({
      ...prev,
      setup_items: prev.setup_items.map((s, i) =>
        i === sectionIndex ? { ...s, items: [...s.items, ''] } : s
      ),
    }));
  };

  const removeSetupItem = (sectionIndex: number, itemIndex: number) => {
    setData(prev => ({
      ...prev,
      setup_items: prev.setup_items.map((s, i) =>
        i === sectionIndex ? { ...s, items: s.items.filter((_, j) => j !== itemIndex) } : s
      ),
    }));
  };

  const updateSetupItem = (sectionIndex: number, itemIndex: number, value: string) => {
    setData(prev => ({
      ...prev,
      setup_items: prev.setup_items.map((s, i) =>
        i === sectionIndex
          ? { ...s, items: s.items.map((item, j) => j === itemIndex ? value : item) }
          : s
      ),
    }));
  };

  // Management items - same logic as setup
  const addManagementSection = () => {
    setData(prev => ({
      ...prev,
      management_items: [...prev.management_items, { title: 'Nová sekce', items: [] }],
    }));
  };

  const removeManagementSection = (index: number) => {
    setData(prev => ({
      ...prev,
      management_items: prev.management_items.filter((_, i) => i !== index),
    }));
  };

  const updateManagementSectionTitle = (index: number, title: string) => {
    setData(prev => ({
      ...prev,
      management_items: prev.management_items.map((s, i) => i === index ? { ...s, title } : s),
    }));
  };

  const addManagementItem = (sectionIndex: number) => {
    setData(prev => ({
      ...prev,
      management_items: prev.management_items.map((s, i) =>
        i === sectionIndex ? { ...s, items: [...s.items, ''] } : s
      ),
    }));
  };

  const removeManagementItem = (sectionIndex: number, itemIndex: number) => {
    setData(prev => ({
      ...prev,
      management_items: prev.management_items.map((s, i) =>
        i === sectionIndex ? { ...s, items: s.items.filter((_, j) => j !== itemIndex) } : s
      ),
    }));
  };

  const updateManagementItem = (sectionIndex: number, itemIndex: number, value: string) => {
    setData(prev => ({
      ...prev,
      management_items: prev.management_items.map((s, i) =>
        i === sectionIndex
          ? { ...s, items: s.items.map((item, j) => j === itemIndex ? value : item) }
          : s
      ),
    }));
  };

  // Tier comparison
  const addTierFeature = () => {
    setData(prev => ({
      ...prev,
      tier_comparison: [...prev.tier_comparison, { feature: '', growth: true, pro: true, elite: true }],
    }));
  };

  const removeTierFeature = (index: number) => {
    setData(prev => ({
      ...prev,
      tier_comparison: prev.tier_comparison.filter((_, i) => i !== index),
    }));
  };

  const updateTierFeature = (index: number, field: keyof TierFeature, value: string | boolean) => {
    setData(prev => ({
      ...prev,
      tier_comparison: prev.tier_comparison.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      ),
    }));
  };

  // Tier prices
  const enableTierPrices = () => {
    setData(prev => ({ ...prev, tier_prices: emptyTierPrices }));
  };

  const disableTierPrices = () => {
    setData(prev => ({ ...prev, tier_prices: null }));
  };

  const updateTierPrice = (tier: 'growth' | 'pro' | 'elite', field: 'price' | 'spend', value: number | string) => {
    if (!data.tier_prices) return;
    setData(prev => ({
      ...prev,
      tier_prices: {
        ...prev.tier_prices!,
        [tier]: { ...prev.tier_prices![tier], [field]: value },
      },
    }));
  };

  // Credit pricing
  const enableCreditPricing = () => {
    setData(prev => ({
      ...prev,
      credit_pricing: { basePrice: 400, currency: 'CZK', expressMultiplier: 1.5, colleagueRewardPerCredit: 80, outputTypes: [] },
    }));
  };

  const disableCreditPricing = () => {
    setData(prev => ({ ...prev, credit_pricing: null }));
  };

  const updateCreditPricing = (field: keyof CreditPricing, value: number | string) => {
    if (!data.credit_pricing) return;
    setData(prev => ({
      ...prev,
      credit_pricing: { ...prev.credit_pricing!, [field]: value },
    }));
  };

  const addOutputType = () => {
    if (!data.credit_pricing) return;
    setData(prev => ({
      ...prev,
      credit_pricing: {
        ...prev.credit_pricing!,
        outputTypes: [...prev.credit_pricing!.outputTypes, { name: '', credits: 1, description: '' }],
      },
    }));
  };

  const removeOutputType = (index: number) => {
    if (!data.credit_pricing) return;
    setData(prev => ({
      ...prev,
      credit_pricing: {
        ...prev.credit_pricing!,
        outputTypes: prev.credit_pricing!.outputTypes.filter((_, i) => i !== index),
      },
    }));
  };

  const updateOutputType = (index: number, field: string, value: string | number) => {
    if (!data.credit_pricing) return;
    setData(prev => ({
      ...prev,
      credit_pricing: {
        ...prev.credit_pricing!,
        outputTypes: prev.credit_pricing!.outputTypes.map((o, i) =>
          i === index ? { ...o, [field]: value } : o
        ),
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden p-0" aria-describedby={undefined}>
        <DialogHeader className="shrink-0 p-6 pb-4">
          <DialogTitle>Upravit detaily služby: {service.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 min-h-0 flex flex-col px-6">
          <TabsList className="grid grid-cols-5 w-full shrink-0">
            <TabsTrigger value="basic">Základní</TabsTrigger>
            <TabsTrigger value="benefits">Benefity</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="management">Správa</TabsTrigger>
            <TabsTrigger value="pricing">Ceník</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tagline (krátký popis)</Label>
                <Input
                  value={data.tagline}
                  onChange={(e) => setData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Např. Reklama na Facebooku a Instagramu pro e-shopy"
                />
              </div>

              <div className="space-y-2">
                <Label>Cílová skupina</Label>
                <Textarea
                  value={data.target_audience}
                  onChange={(e) => setData(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="Popis cílové skupiny..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Platformy</Label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {data.platforms.map((platform, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                      {platform}
                      <button onClick={() => removePlatform(index)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    placeholder="Přidat platformu..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlatform())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addPlatform}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="benefits" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Co získáte (benefity)</Label>
                <div className="space-y-2">
                  {data.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Přidat benefit..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <Button type="button" variant="outline" onClick={addBenefit}>
                    <Plus className="h-4 w-4 mr-1" />
                    Přidat
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Label>Úvodní nastavení projektu</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSetupSection}>
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat sekci
                </Button>
              </div>

              {data.setup_items.map((section, sectionIndex) => (
                <Card key={sectionIndex}>
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={section.title}
                        onChange={(e) => updateSetupSectionTitle(sectionIndex, e.target.value)}
                        className="flex-1 font-medium"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSetupSection(sectionIndex)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateSetupItem(sectionIndex, itemIndex, e.target.value)}
                          rows={2}
                          className="flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSetupItem(sectionIndex, itemIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addSetupItem(sectionIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Přidat položku
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="management" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Label>Průběžná správa</Label>
                <Button type="button" variant="outline" size="sm" onClick={addManagementSection}>
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat sekci
                </Button>
              </div>

              {data.management_items.map((section, sectionIndex) => (
                <Card key={sectionIndex}>
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={section.title}
                        onChange={(e) => updateManagementSectionTitle(sectionIndex, e.target.value)}
                        className="flex-1 font-medium"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeManagementSection(sectionIndex)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateManagementItem(sectionIndex, itemIndex, e.target.value)}
                          rows={2}
                          className="flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeManagementItem(sectionIndex, itemIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addManagementItem(sectionIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Přidat položku
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 mt-4">
              {/* Tier Pricing */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Balíčky dle rozpočtu (GROWTH/PRO/ELITE)</CardTitle>
                    <Switch
                      checked={!!data.tier_prices}
                      onCheckedChange={(checked) => checked ? enableTierPrices() : disableTierPrices()}
                    />
                  </div>
                </CardHeader>
                {data.tier_prices && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {(['growth', 'pro', 'elite'] as const).map((tier) => (
                        <div key={tier} className="space-y-2">
                          <Label className="text-xs uppercase font-bold">
                            {tier === 'growth' ? '🚀 GROWTH' : tier === 'pro' ? '💪 PRO' : '🏆 ELITE'}
                          </Label>
                          <Input
                            type="number"
                            value={data.tier_prices![tier].price}
                            onChange={(e) => updateTierPrice(tier, 'price', Number(e.target.value))}
                            placeholder="Cena"
                          />
                          <Input
                            value={data.tier_prices![tier].spend}
                            onChange={(e) => updateTierPrice(tier, 'spend', e.target.value)}
                            placeholder="Rozpočet (např. do 400 000 Kč)"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Porovnání funkcí</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addTierFeature}>
                          <Plus className="h-4 w-4 mr-1" />
                          Přidat
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {data.tier_comparison.map((feature, index) => (
                          <div key={index} className="grid grid-cols-[1fr,100px,100px,100px,auto] gap-2 items-center">
                            <Input
                              value={feature.feature}
                              onChange={(e) => updateTierFeature(index, 'feature', e.target.value)}
                              placeholder="Název funkce"
                            />
                            <Input
                              value={typeof feature.growth === 'boolean' ? (feature.growth ? '✓' : '—') : feature.growth}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateTierFeature(index, 'growth', val === '✓' ? true : val === '—' ? false : val);
                              }}
                              placeholder="GROWTH"
                              className="text-center text-xs"
                            />
                            <Input
                              value={typeof feature.pro === 'boolean' ? (feature.pro ? '✓' : '—') : feature.pro}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateTierFeature(index, 'pro', val === '✓' ? true : val === '—' ? false : val);
                              }}
                              placeholder="PRO"
                              className="text-center text-xs"
                            />
                            <Input
                              value={typeof feature.elite === 'boolean' ? (feature.elite ? '✓' : '—') : feature.elite}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateTierFeature(index, 'elite', val === '✓' ? true : val === '—' ? false : val);
                              }}
                              placeholder="ELITE"
                              className="text-center text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTierFeature(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Credit Pricing */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Kreditový ceník (pro Creative Boost apod.)</CardTitle>
                    <Switch
                      checked={!!data.credit_pricing}
                      onCheckedChange={(checked) => checked ? enableCreditPricing() : disableCreditPricing()}
                    />
                  </div>
                </CardHeader>
                {data.credit_pricing && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>💰 Výchozí cena za kredit (klient)</Label>
                        <Input
                          type="number"
                          value={data.credit_pricing.basePrice}
                          onChange={(e) => updateCreditPricing('basePrice', Number(e.target.value))}
                          placeholder="400"
                        />
                        <p className="text-xs text-muted-foreground">
                          Výchozí cena, kterou platí klient za 1 kredit
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>🎨 Výchozí odměna grafika za kredit</Label>
                        <Input
                          type="number"
                          value={data.credit_pricing.colleagueRewardPerCredit}
                          onChange={(e) => updateCreditPricing('colleagueRewardPerCredit', Number(e.target.value))}
                          placeholder="80"
                        />
                        <p className="text-xs text-muted-foreground">
                          Výchozí odměna pro grafika/kolegu za 1 kredit
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Měna</Label>
                        <Input
                          value={data.credit_pricing.currency}
                          onChange={(e) => updateCreditPricing('currency', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Express násobič</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={data.credit_pricing.expressMultiplier}
                          onChange={(e) => updateCreditPricing('expressMultiplier', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Typy výstupů</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addOutputType}>
                          <Plus className="h-4 w-4 mr-1" />
                          Přidat
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {data.credit_pricing.outputTypes.map((output, index) => (
                          <div key={index} className="grid grid-cols-[1fr,80px,1fr,auto] gap-2 items-center">
                            <Input
                              value={output.name}
                              onChange={(e) => updateOutputType(index, 'name', e.target.value)}
                              placeholder="Název"
                            />
                            <Input
                              type="number"
                              step="0.25"
                              value={output.credits}
                              onChange={(e) => updateOutputType(index, 'credits', Number(e.target.value))}
                              placeholder="Kredity"
                            />
                            <Input
                              value={output.description}
                              onChange={(e) => updateOutputType(index, 'description', e.target.value)}
                              placeholder="Popis"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOutputType(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="shrink-0 p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave}>
            Uložit změny
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
