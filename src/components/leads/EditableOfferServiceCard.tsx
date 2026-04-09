import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, X, Plus, Trash2, Package, Clock, Zap, ClipboardList, Layers } from 'lucide-react';
import type { PublicOfferService, ServiceDetailSection } from '@/types/publicOffer';
import { MANAGED_COUNTRIES, getCountryFlag, getCountryName } from '@/constants/countries';

interface EditableOfferServiceCardProps {
  service: PublicOfferService;
  onUpdate: (updatedService: PublicOfferService) => void;
  onRemove: () => void;
  isCreativeBoost?: boolean;
  creativeBoostCredits?: number;
  creativeBoostPricePerCredit?: number;
  onCreativeBoostCreditsChange?: (value: number) => void;
  onCreativeBoostPricePerCreditChange?: (value: number) => void;
}

const tierLabels: Record<string, { label: string; color: string }> = {
  growth: { label: 'Growth', color: 'bg-blue-100 text-blue-800' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-800' },
  elite: { label: 'Elite', color: 'bg-amber-100 text-amber-800' },
};

export function EditableOfferServiceCard({
  service,
  onUpdate,
  onRemove,
  isCreativeBoost = false,
  creativeBoostCredits = 30,
  creativeBoostPricePerCredit = 400,
  onCreativeBoostCreditsChange,
  onCreativeBoostPricePerCreditChange,
}: EditableOfferServiceCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(false);
  const [isDetailedSectionsOpen, setIsDetailedSectionsOpen] = useState(false);
  
  const tierInfo = service.selected_tier ? tierLabels[service.selected_tier] : null;
  
  const hasDiscount = service.original_price && service.original_price > service.price;
  const discountAmount = hasDiscount ? (service.original_price! - service.price) : 0;
  const creativeBoostBasePrice = Math.max(0, creativeBoostCredits * creativeBoostPricePerCredit);
  const basePrice = isCreativeBoost ? creativeBoostBasePrice : service.price;
  const variants = service.country_variants || [];
  const variantsTotal = variants.reduce((sum, variant) => sum + variant.price, 0);
  const finalServicePrice = basePrice + variantsTotal;
  const mainCountry = (service.managed_countries && service.managed_countries[0]) || 'CZ';
  const uniqueVariantCountryCodes = Array.from(new Set(variants.map((variant) => variant.country_code)));
  const variantCountryFlags = uniqueVariantCountryCodes.map((countryCode) => getCountryFlag(countryCode)).join(' ');
  
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
  
  const handleFieldChange = (
    field: 'frequency' | 'turnaround' | 'offer_description',
    value: string,
  ) => {
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

  const sections = service.detailed_sections || [];

  const handleSectionChange = (sectionIndex: number, updates: Partial<ServiceDetailSection>) => {
    const newSections = sections.map((s, i) =>
      i === sectionIndex ? { ...s, ...updates } : s
    );
    onUpdate({ ...service, detailed_sections: newSections });
  };

  const handleSectionItemChange = (sectionIndex: number, itemIndex: number, value: string) => {
    const section = sections[sectionIndex];
    if (!section) return;
    const newItems = [...section.items];
    newItems[itemIndex] = value;
    handleSectionChange(sectionIndex, { items: newItems });
  };

  const handleAddSectionItem = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return;
    handleSectionChange(sectionIndex, { items: [...section.items, ''] });
  };

  const handleRemoveSectionItem = (sectionIndex: number, itemIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return;
    const newItems = section.items.filter((_, i) => i !== itemIndex);
    handleSectionChange(sectionIndex, { items: newItems });
  };

  const handleAddSection = () => {
    onUpdate({
      ...service,
      detailed_sections: [...sections, { emoji: '📌', title: '', items: [''] }],
    });
  };

  const handleRemoveSection = (sectionIndex: number) => {
    const newSections = sections.filter((_, i) => i !== sectionIndex);
    onUpdate({ ...service, detailed_sections: newSections });
  };

  const usedCountryCodes = new Set<string>([mainCountry, ...variants.map((variant) => variant.country_code)]);
  const addableCountries = MANAGED_COUNTRIES.filter((country) => !usedCountryCodes.has(country.code));

  const handleMainCountryChange = (countryCode: string) => {
    const normalizedCode = countryCode.toUpperCase();
    const filteredVariants = variants.filter((variant) => variant.country_code !== normalizedCode);
    onUpdate({
      ...service,
      managed_countries: [normalizedCode],
      country_variants: filteredVariants,
    });
  };

  const handleAddCountryVariant = (countryCode: string) => {
    const multiplier = 0.5;
    const variantPrice = Math.round(basePrice * multiplier);
    onUpdate({
      ...service,
      country_variants: [
        ...variants,
        {
          country_code: countryCode,
          multiplier,
          price: variantPrice,
        },
      ],
    });
  };

  const handleVariantMultiplierChange = (index: number, value: string) => {
    const multiplier = Number(value);
    const nextVariants = [...variants];
    nextVariants[index] = {
      ...nextVariants[index],
      multiplier: Number.isFinite(multiplier) ? Math.max(0, multiplier) : 0,
    };
    onUpdate({ ...service, country_variants: nextVariants });
  };

  const handleVariantPriceChange = (index: number, value: string) => {
    const nextPrice = Number(value);
    const nextVariants = [...variants];
    nextVariants[index] = {
      ...nextVariants[index],
      price: Number.isFinite(nextPrice) ? Math.max(0, nextPrice) : 0,
    };
    onUpdate({ ...service, country_variants: nextVariants });
  };

  const handleVariantRemove = (index: number) => {
    onUpdate({
      ...service,
      country_variants: variants.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="border-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{service.name}</CardTitle>
              {tierInfo && (
                <Badge variant="secondary" className={tierInfo.color}>
                  {tierInfo.label}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getCountryFlag(mainCountry)} {getCountryName(mainCountry)}
              </Badge>
              {uniqueVariantCountryCodes.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {variantCountryFlags}
                </Badge>
              )}
              {variants.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Σ +{variantsTotal.toLocaleString('cs-CZ')} {service.currency}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {service.billing_type === 'monthly' ? 'Měsíčně' : 'Jednorázově'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-right">
                {finalServicePrice === 0 ? (
                  <span className="text-green-600">Zdarma</span>
                ) : (
                  <span>{finalServicePrice.toLocaleString('cs-CZ')} Kč{service.billing_type === 'monthly' ? '/měs' : ''}</span>
                )}
                {hasDiscount && service.original_price && (
                  <span className="ml-1 text-xs text-muted-foreground line-through">
                    {(service.original_price + variantsTotal).toLocaleString('cs-CZ')} Kč
                  </span>
                )}
              </div>
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
              
              {isCreativeBoost ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Počet kreditů / měsíc</Label>
                      <Input
                        type="number"
                        min={1}
                        value={creativeBoostCredits}
                        onChange={(e) => onCreativeBoostCreditsChange?.(Math.max(1, Number(e.target.value) || 1))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cena za kredit</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={creativeBoostPricePerCredit}
                          onChange={(e) => onCreativeBoostPricePerCreditChange?.(Math.max(0, Number(e.target.value) || 0))}
                          className="h-8 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">{service.currency}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cena se počítá automaticky: {creativeBoostCredits} kreditů × {creativeBoostPricePerCredit.toLocaleString('cs-CZ')} {service.currency}
                  </p>
                </div>
              ) : (
                <>
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
                              price: originalPrice - discountAmount,
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
                </>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Finální cena:</span>
                <span className="text-lg font-bold text-primary">
                  {finalServicePrice.toLocaleString('cs-CZ')} {service.currency}
                  {service.billing_type === 'monthly' && <span className="text-sm font-normal">/měs</span>}
                </span>
              </div>
              {variants.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  Základ {basePrice.toLocaleString('cs-CZ')} + mutace {variantsTotal.toLocaleString('cs-CZ')} {service.currency}
                </p>
              )}
            </div>

            {/* Language variants / markets */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>🌍</span>
                <span>Jazykové mutace / Země</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Hlavní trh</Label>
                <Select value={mainCountry} onValueChange={handleMainCountryChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGED_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Další trhy</Label>
                {variants.map((variant, idx) => (
                  <div key={`${variant.country_code}-${idx}`} className="grid grid-cols-[1fr_120px_120px_auto] gap-2 items-center">
                    <Badge variant="outline" className="justify-start h-8 px-2 font-normal">
                      {getCountryFlag(variant.country_code)} {getCountryName(variant.country_code)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        value={variant.multiplier}
                        onChange={(e) => handleVariantMultiplierChange(idx, e.target.value)}
                        className="h-8 text-sm text-right"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={variant.price}
                        onChange={(e) => handleVariantPriceChange(idx, e.target.value)}
                        className="h-8 text-sm text-right"
                      />
                      <span className="text-xs text-muted-foreground">{service.currency}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVariantRemove(idx)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {addableCountries.length > 0 && (
                  <Select value="" onValueChange={handleAddCountryVariant}>
                    <SelectTrigger className="h-8 text-sm border-dashed">
                      <SelectValue placeholder="+ Přidat další trh" />
                    </SelectTrigger>
                    <SelectContent>
                      {addableCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {variants.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Nákladová škála pro odměny se počítá z multiplikátorů (1 + součet multiplikátorů mutací).
                  </p>
                )}
              </div>
            </div>
            
            {/* Deliverables */}
            <Collapsible open={isDeliverablesOpen} onOpenChange={setIsDeliverablesOpen}>
              <div className="space-y-2">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span>Co klient dostane</span>
                    </div>
                    {isDeliverablesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
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
                </CollapsibleContent>
              </div>
            </Collapsible>
            
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

            {/* Detailed Sections (Podrobný rozpis) */}
            <Collapsible open={isDetailedSectionsOpen} onOpenChange={setIsDetailedSectionsOpen}>
              <div className="space-y-2">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>Podrobný rozpis</span>
                    </div>
                    {isDetailedSectionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pl-4 border-l-2 border-muted">
                    {sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="space-y-2 p-2 rounded-md bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Input
                            value={section.emoji}
                            onChange={(e) => handleSectionChange(sectionIndex, { emoji: e.target.value })}
                            className="w-12 h-8 text-center text-lg"
                            placeholder="📌"
                          />
                          <Input
                            value={section.title}
                            onChange={(e) => handleSectionChange(sectionIndex, { title: e.target.value })}
                            placeholder="Název sekce"
                            className="h-8 text-sm flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSection(sectionIndex)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2 pl-4">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2">
                              <Input
                                value={item}
                                onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, e.target.value)}
                                placeholder="Položka"
                                className="h-8 text-sm flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSectionItem(sectionIndex, itemIndex)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddSectionItem(sectionIndex)}
                            className="h-7 text-xs"
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
              </div>
            </Collapsible>
            
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
