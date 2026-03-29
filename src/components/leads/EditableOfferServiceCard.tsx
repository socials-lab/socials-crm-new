import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, X, Plus, Trash2, Package, Clock, Zap, ClipboardList, FileText, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PublicOfferService, ServiceDetailSection, CountryVariant } from '@/types/publicOffer';
import { MANAGED_COUNTRIES, getCountryFlag, getCountryName } from '@/constants/countries';

interface EditableOfferServiceCardProps {
  service: PublicOfferService;
  onUpdate: (updatedService: PublicOfferService) => void;
  onRemove: () => void;
}

const tierLabels: Record<string, { label: string; color: string }> = {
  growth: { label: 'Growth', color: 'bg-blue-100 text-blue-800' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-800' },
  elite: { label: 'Elite', color: 'bg-amber-100 text-amber-800' },
};

export function EditableOfferServiceCard({ service, onUpdate, onRemove }: EditableOfferServiceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const tierInfo = service.selected_tier ? tierLabels[service.selected_tier] : null;
  
  const hasDiscount = service.original_price && service.original_price > service.price;
  const discountAmount = hasDiscount ? (service.original_price! - service.price) : 0;
  
  const handlePriceChange = (value: string) => {
    const newPrice = Number(value) || 0;
    onUpdate({ ...service, price: newPrice });
  };
  
  const handleDiscountChange = (value: string) => {
    const discount = Number(value) || 0;
    const originalPrice = service.original_price || service.price;
    onUpdate({ 
      ...service, 
      price: Math.max(0, originalPrice - discount),
      original_price: originalPrice
    });
  };
  
  const handleDiscountReasonChange = (value: string) => {
    onUpdate({ ...service, discount_reason: value });
  };
  
  const handleFieldChange = (field: keyof PublicOfferService, value: any) => {
    onUpdate({ ...service, [field]: value });
  };
  
  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...(service.deliverables || [])];
    newDeliverables[index] = value;
    onUpdate({ ...service, deliverables: newDeliverables });
  };
  
  const handleAddDeliverable = () => {
    onUpdate({ 
      ...service, 
      deliverables: [...(service.deliverables || []), ''] 
    });
  };
  
  const handleRemoveDeliverable = (index: number) => {
    const newDeliverables = (service.deliverables || []).filter((_, i) => i !== index);
    onUpdate({ ...service, deliverables: newDeliverables });
  };
  
  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...(service.requirements || [])];
    newRequirements[index] = value;
    onUpdate({ ...service, requirements: newRequirements });
  };
  
  const handleAddRequirement = () => {
    onUpdate({ 
      ...service, 
      requirements: [...(service.requirements || []), ''] 
    });
  };
  
  const handleRemoveRequirement = (index: number) => {
    const newRequirements = (service.requirements || []).filter((_, i) => i !== index);
    onUpdate({ ...service, requirements: newRequirements });
  };

  // ─── Detailed Sections handlers ───
  const handleSectionFieldChange = (sIdx: number, field: 'emoji' | 'title', value: string) => {
    const sections = [...(service.detailed_sections || [])];
    sections[sIdx] = { ...sections[sIdx], [field]: value };
    onUpdate({ ...service, detailed_sections: sections });
  };

  const handleSectionItemChange = (sIdx: number, iIdx: number, value: string) => {
    const sections = [...(service.detailed_sections || [])];
    const items = [...sections[sIdx].items];
    items[iIdx] = value;
    sections[sIdx] = { ...sections[sIdx], items };
    onUpdate({ ...service, detailed_sections: sections });
  };

  const handleAddSectionItem = (sIdx: number) => {
    const sections = [...(service.detailed_sections || [])];
    sections[sIdx] = { ...sections[sIdx], items: [...sections[sIdx].items, ''] };
    onUpdate({ ...service, detailed_sections: sections });
  };

  const handleRemoveSectionItem = (sIdx: number, iIdx: number) => {
    const sections = [...(service.detailed_sections || [])];
    sections[sIdx] = { ...sections[sIdx], items: sections[sIdx].items.filter((_, i) => i !== iIdx) };
    onUpdate({ ...service, detailed_sections: sections });
  };

  const handleRemoveSection = (sIdx: number) => {
    const sections = (service.detailed_sections || []).filter((_, i) => i !== sIdx);
    onUpdate({ ...service, detailed_sections: sections });
  };

  const handleAddSection = () => {
    const sections = [...(service.detailed_sections || []), { emoji: '📋', title: '', items: [''] }];
    onUpdate({ ...service, detailed_sections: sections });
  };

  // ─── Country Variants handlers ───
  const handleAddCountryVariant = (countryCode: string) => {
    const existingCodes = (service.country_variants || []).map(v => v.country_code);
    const mainCountries = service.managed_countries || [];
    if (existingCodes.includes(countryCode) || mainCountries.includes(countryCode)) return;
    const multiplier = 0.5;
    const price = Math.round(service.price * multiplier);
    const newVariant: CountryVariant = { country_code: countryCode, multiplier, price };
    onUpdate({ ...service, country_variants: [...(service.country_variants || []), newVariant] });
  };

  const handleRemoveCountryVariant = (index: number) => {
    const variants = (service.country_variants || []).filter((_, i) => i !== index);
    onUpdate({ ...service, country_variants: variants });
  };

  const handleVariantMultiplierChange = (index: number, multiplier: number) => {
    const variants = [...(service.country_variants || [])];
    const price = Math.round(service.price * multiplier);
    variants[index] = { ...variants[index], multiplier, price };
    onUpdate({ ...service, country_variants: variants });
  };

  const handleVariantPriceChange = (index: number, price: number) => {
    const variants = [...(service.country_variants || [])];
    variants[index] = { ...variants[index], price };
    onUpdate({ ...service, country_variants: variants });
  };

  const handleMainCountryChange = (countryCode: string) => {
    const current = service.managed_countries || [];
    if (current.includes(countryCode)) return;
    onUpdate({ ...service, managed_countries: [countryCode] });
  };

  const usedCountryCodes = [
    ...(service.managed_countries || []),
    ...(service.country_variants || []).map(v => v.country_code),
  ];
  const availableCountries = MANAGED_COUNTRIES.filter(c => !usedCountryCodes.includes(c.code));


  return (
    <Card className="border-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <CardTitle className="text-base">{service.name}</CardTitle>
              {tierInfo && (
                <Badge variant="secondary" className={tierInfo.color}>
                  {tierInfo.label}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {service.billing_type === 'monthly' ? 'Měsíčně' : 'Jednorázově'}
              </Badge>
              {/* Country flags in collapsed view */}
              {(service.managed_countries?.length || service.country_variants?.length) ? (
                <span className="text-sm" title={[...(service.managed_countries || []), ...(service.country_variants || []).map(v => v.country_code)].map(c => getCountryName(c)).join(', ')}>
                  {(service.managed_countries || []).map(c => getCountryFlag(c)).join('')}
                  {(service.country_variants || []).map(v => getCountryFlag(v.country_code)).join('')}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {!isOpen && (
                <div className="flex items-center gap-1.5">
                  {hasDiscount && (
                    <span className="line-through text-muted-foreground text-xs tabular-nums">
                      {(service.original_price || service.price).toLocaleString('cs-CZ')}
                    </span>
                  )}
                  <Input
                    type="number"
                    value={service.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-28 h-7 text-sm text-right tabular-nums"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                    {service.currency}/{service.billing_type === 'monthly' ? 'měs' : 'jedn.'}
                  </span>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="Sleva"
                    className="w-20 h-7 text-sm text-right tabular-nums"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">sleva</span>
                </div>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-2">
            {/* Price Section */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>💰</span>
                <span>Cena</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Původní cena</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={service.original_price || service.price}
                      onChange={(e) => {
                        const originalPrice = Number(e.target.value) || 0;
                        onUpdate({ 
                          ...service, 
                          original_price: originalPrice,
                          price: originalPrice - discountAmount
                        });
                      }}
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">{service.currency}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Sleva</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">{service.currency}</span>
                  </div>
                </div>
              </div>
              
              {hasDiscount && (
                <div className="space-y-1">
                  <Label className="text-xs">Důvod slevy</Label>
                  <Input
                    value={service.discount_reason || ''}
                    onChange={(e) => handleDiscountReasonChange(e.target.value)}
                    placeholder="např. Úvodní sleva, Balíčková cena..."
                    className="h-8 text-sm"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Finální cena:</span>
                <span className="text-lg font-bold text-primary">
                  {service.price.toLocaleString('cs-CZ')} {service.currency}
                  {service.billing_type === 'monthly' && <span className="text-sm font-normal">/měs</span>}
                </span>
              </div>
            </div>

            {/* Country Variants / Markets */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-primary" />
                <span>Jazykové mutace / Země</span>
              </div>

              {/* Main country */}
              <div className="space-y-1">
                <Label className="text-xs">Hlavní trh</Label>
                <Select
                  value={(service.managed_countries || [])[0] || 'CZ'}
                  onValueChange={handleMainCountryChange}
                >
                  <SelectTrigger className="h-8 text-sm w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGED_COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional country variants */}
              {(service.country_variants || []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Další trhy</Label>
                  {(service.country_variants || []).map((variant, vIdx) => (
                    <div key={vIdx} className="flex items-center gap-2 p-2 bg-background rounded-md border">
                      <span className="text-lg shrink-0">{getCountryFlag(variant.country_code)}</span>
                      <span className="text-sm min-w-[80px]">{getCountryName(variant.country_code)}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Label className="text-xs text-muted-foreground shrink-0">×</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="1"
                          value={variant.multiplier}
                          onChange={(e) => handleVariantMultiplierChange(vIdx, Number(e.target.value) || 0.5)}
                          className="h-7 w-16 text-xs text-right tabular-nums"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">=</span>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleVariantPriceChange(vIdx, Number(e.target.value) || 0)}
                          className="h-7 w-28 text-xs text-right tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground">{service.currency}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCountryVariant(vIdx)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add country button */}
              {availableCountries.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select onValueChange={handleAddCountryVariant}>
                    <SelectTrigger className="h-7 text-xs w-52">
                      <SelectValue placeholder="Přidat další trh..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCountries.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">50 % z ceny</span>
                </div>
              )}

              {/* Total with variants */}
              {(service.country_variants || []).length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <span className="text-muted-foreground">Celkem za všechny trhy:</span>
                  <span className="font-semibold">
                    {(service.price + (service.country_variants || []).reduce((sum, v) => sum + v.price, 0)).toLocaleString('cs-CZ')} {service.currency}
                    {service.billing_type === 'monthly' && <span className="text-xs font-normal text-muted-foreground">/měs</span>}
                  </span>
                </div>
              )}
            </div>
            
            {/* Deliverables */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4 text-primary" />
                <span>Co klient dostane</span>
              </div>
              <div className="space-y-2">
                {(service.deliverables || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleDeliverableChange(index, e.target.value)}
                      placeholder="např. Správa kampaní na Meta platformách"
                      className="h-8 text-sm flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveDeliverable(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDeliverable}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Přidat položku
                </Button>
              </div>
            </div>
            
            {/* Frequency & Turnaround */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <Label className="text-xs">Frekvence</Label>
                </div>
                <Input
                  value={service.frequency || ''}
                  onChange={(e) => handleFieldChange('frequency', e.target.value)}
                  placeholder="např. 8 kampaní/měsíc"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <Label className="text-xs">Doba dodání</Label>
                </div>
                <Input
                  value={service.turnaround || ''}
                  onChange={(e) => handleFieldChange('turnaround', e.target.value)}
                  placeholder="např. Do 14 dnů od startu"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            {/* Requirements */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-orange-500" />
                <span>Co potřebujeme od klienta</span>
              </div>
              <div className="space-y-2">
                {(service.requirements || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      placeholder="např. Přístupy do Business Manageru"
                      className="h-8 text-sm flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveRequirement(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRequirement}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Přidat požadavek
                </Button>
              </div>
            </div>
            
            {/* Offer Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Popis služby pro klienta</Label>
              <Textarea
                value={service.offer_description || ''}
                onChange={(e) => handleFieldChange('offer_description', e.target.value)}
                placeholder="Volný text s popisem služby..."
                rows={3}
                className="text-sm"
              />
            </div>



            {/* Detailed Sections (expandable structured info) */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>📋 Podrobný rozpis služby ({(service.detailed_sections || []).length} sekcí)</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 mt-3">
                  {(service.detailed_sections || []).map((section, sIdx) => (
                    <div key={sIdx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={section.emoji}
                          onChange={(e) => handleSectionFieldChange(sIdx, 'emoji', e.target.value)}
                          className="h-8 w-14 text-center text-sm"
                          placeholder="📋"
                        />
                        <Input
                          value={section.title}
                          onChange={(e) => handleSectionFieldChange(sIdx, 'title', e.target.value)}
                          className="h-8 text-sm flex-1 font-medium"
                          placeholder="Název sekce"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSection(sIdx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1.5 ml-2">
                        {section.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs shrink-0">•</span>
                            <Input
                              value={item}
                              onChange={(e) => handleSectionItemChange(sIdx, iIdx, e.target.value)}
                              className="h-7 text-xs flex-1"
                              placeholder="Položka..."
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSectionItem(sIdx, iIdx)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddSectionItem(sIdx)}
                          className="h-6 text-xs text-muted-foreground"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Přidat položku
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSection}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Přidat sekci
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
