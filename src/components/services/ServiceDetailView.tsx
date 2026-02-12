import { useState, useMemo } from 'react';
import { Check, Zap, Target, CreditCard, X, Plus, Image, Video } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  colleagueRewardPerCredit?: number;
  outputTypes?: { name: string; credits: number; description: string; category?: string }[];
}

export interface ServiceDetailData {
  tagline?: string;
  platforms?: string[];
  target_audience?: string;
  benefits?: string[];
  setup_items?: SetupItem[];
  management_items?: SetupItem[];
  tier_comparison?: TierFeature[];
  tier_prices?: TierPrices | null;
  credit_pricing?: CreditPricing | null;
}

interface ServiceDetailViewProps {
  data: ServiceDetailData;
  onCreditPricingUpdate?: (outputTypes: { name: string; credits: number; description: string; category?: string }[]) => void;
}

export function ServiceDetailView({ data, onCreditPricingUpdate }: ServiceDetailViewProps) {
  // Guard against undefined or null data
  if (!data) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Detailní popis služby zatím nebyl nastaven. Klikněte na "Upravit detaily" pro přidání informací.
      </p>
    );
  }

  // Helper to check if setup/management items have actual content
  const hasSetupContent = data.setup_items && data.setup_items.some(s => s.items && s.items.length > 0);
  const hasManagementContent = data.management_items && data.management_items.some(s => s.items && s.items.length > 0);
  const hasBenefits = data.benefits && data.benefits.length > 0;
  const hasTierComparison = data.tier_comparison && data.tier_comparison.length > 0 && data.tier_prices;
  const hasCreditPricing = data.credit_pricing && data.credit_pricing.outputTypes && data.credit_pricing.outputTypes.length > 0;

  const hasContent = data.tagline || (data.platforms && data.platforms.length > 0) || 
                     hasBenefits || hasSetupContent || hasManagementContent ||
                     hasTierComparison || hasCreditPricing;
  
  if (!hasContent) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Detailní popis služby zatím nebyl nastaven. Klikněte na "Upravit detaily" pro přidání informací.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tagline and Platforms */}
      {(data.tagline || (data.platforms && data.platforms.length > 0)) && (
        <div className="space-y-2">
          {data.tagline && (
            <p className="text-sm font-medium">{data.tagline}</p>
          )}
          {data.platforms && data.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.platforms.map((platform) => (
                <Badge key={platform} variant="outline" className="text-xs">
                  {platform}
                </Badge>
              ))}
            </div>
          )}
          {data.target_audience && (
            <p className="text-xs text-muted-foreground">
              <Target className="inline h-3 w-3 mr-1" />
              {data.target_audience}
            </p>
          )}
        </div>
      )}

      {/* Benefits */}
      {hasBenefits && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-chart-4" />
            Co získáte
          </h4>
          <ul className="space-y-1.5">
            {data.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-xs">
                <Check className="h-3.5 w-3.5 text-status-active mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Setup and Management Accordions */}
      {(hasSetupContent || hasManagementContent) && (
        <Accordion type="multiple" className="w-full">
          {hasSetupContent && (
            <AccordionItem value="setup" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                <span className="flex items-center gap-2">
                  ⚙️ Úvodní nastavení projektu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-2">
                  {data.setup_items!.filter(s => s.items && s.items.length > 0).map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-1.5">
                      <h5 className="text-xs font-semibold text-muted-foreground">{section.title}</h5>
                      <ul className="space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-xs flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {hasManagementContent && (
            <AccordionItem value="management" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                <span className="flex items-center gap-2">
                  📈 Průběžná správa
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-2">
                  {data.management_items!.filter(s => s.items && s.items.length > 0).map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-1.5">
                      <h5 className="text-xs font-semibold text-muted-foreground">{section.title}</h5>
                      <ul className="space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-xs flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {/* Tier Comparison Table for Core Services */}
      {hasTierComparison && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            📦 Balíčky dle rozpočtu
          </h4>
          
          {/* Tier Cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Card className="bg-chart-1/5 border-chart-1/20">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold flex items-center gap-1">
                  🚀 GROWTH
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-[10px] text-muted-foreground">{data.tier_prices!.growth.spend}</div>
                <div className="text-lg font-bold text-chart-1">
                  {data.tier_prices!.growth.price.toLocaleString('cs-CZ')} Kč
                </div>
              </CardContent>
            </Card>

            <Card className="bg-chart-2/5 border-chart-2/20">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold flex items-center gap-1">
                  💪 PRO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-[10px] text-muted-foreground">{data.tier_prices!.pro.spend}</div>
                <div className="text-lg font-bold text-chart-2">
                  {data.tier_prices!.pro.price.toLocaleString('cs-CZ')} Kč
                </div>
              </CardContent>
            </Card>

            <Card className="bg-chart-4/5 border-chart-4/20">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold flex items-center gap-1">
                  🏆 ELITE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-[10px] text-muted-foreground">{data.tier_prices!.elite.spend}</div>
                <div className="text-lg font-bold text-chart-4">
                  {data.tier_prices!.elite.price.toLocaleString('cs-CZ')} Kč
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium">Funkce</TableHead>
                  <TableHead className="text-xs font-medium text-center w-24">GROWTH</TableHead>
                  <TableHead className="text-xs font-medium text-center w-24">PRO</TableHead>
                  <TableHead className="text-xs font-medium text-center w-24">ELITE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tier_comparison!.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      {renderTierValue(row.growth)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderTierValue(row.pro)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderTierValue(row.elite)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Credit Pricing for Creative Boost */}
      {hasCreditPricing && data.credit_pricing && (
        <CreditPricingSection
          creditPricing={data.credit_pricing}
          onUpdate={onCreditPricingUpdate}
        />
      )}
    </div>
  );
}

function renderTierValue(value: string | boolean) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-status-active mx-auto" />
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  }
  return <span className="text-xs">{value}</span>;
}

interface CreditPricingSectionProps {
  creditPricing: CreditPricing;
  onUpdate?: (outputTypes: { name: string; credits: number; description: string; category?: string }[]) => void;
}

type OutputItem = { name: string; credits: number; description: string; category?: string; id?: string };

function CreditPricingSection({ creditPricing, onUpdate }: CreditPricingSectionProps) {
  const [localOutputTypes, setLocalOutputTypes] = useState<OutputItem[]>(creditPricing.outputTypes || []);
  const isEditable = !!onUpdate;

  const bannerCategories = ['banner', 'banner_translation', 'banner_revision'];
  const videoCategories = ['video', 'video_translation'];

  const bannerTypes = useMemo(() => localOutputTypes.filter(t => !t.category || bannerCategories.includes(t.category)), [localOutputTypes]);
  const videoTypes = useMemo(() => localOutputTypes.filter(t => t.category && videoCategories.includes(t.category)), [localOutputTypes]);

  const handleFieldChange = (index: number, field: 'name' | 'credits', value: string | number) => {
    const updated = localOutputTypes.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setLocalOutputTypes(updated);
  };

  const handleBlurSave = () => {
    if (onUpdate) onUpdate(localOutputTypes);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') (e.target as HTMLElement).blur();
  };

  const handleRemove = (index: number) => {
    const updated = localOutputTypes.filter((_, i) => i !== index);
    setLocalOutputTypes(updated);
    if (onUpdate) onUpdate(updated);
  };

  const handleAdd = (category: string) => {
    const updated = [...localOutputTypes, { name: '', credits: 1, description: '', category }];
    setLocalOutputTypes(updated);
    if (onUpdate) onUpdate(updated);
  };

  const getGlobalIndex = (item: OutputItem) => localOutputTypes.indexOf(item);

  const renderTable = (items: OutputItem[], label: string, icon: React.ReactNode, addCategory: string) => (
    <div className="space-y-1.5">
      <h5 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </h5>
      {items.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-medium">Typ výstupu</TableHead>
                <TableHead className="text-xs font-medium text-center w-20">Kredity</TableHead>
                {isEditable && <TableHead className="w-8" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((output) => {
                const globalIdx = getGlobalIndex(output);
                return (
                  <TableRow key={globalIdx}>
                    <TableCell className="text-xs p-1.5">
                      {isEditable ? (
                        <Input
                          value={output.name}
                          onChange={(e) => handleFieldChange(globalIdx, 'name', e.target.value)}
                          onBlur={handleBlurSave}
                          onKeyDown={handleKeyDown}
                          className="h-7 text-xs"
                          placeholder="Název výstupu"
                        />
                      ) : (
                        <div>{output.name}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-center font-medium p-1.5">
                      {isEditable ? (
                        <Input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={output.credits}
                          onChange={(e) => handleFieldChange(globalIdx, 'credits', parseFloat(e.target.value) || 1)}
                          onBlur={handleBlurSave}
                          onKeyDown={handleKeyDown}
                          className="h-7 text-xs text-center w-16 mx-auto"
                        />
                      ) : (
                        output.credits
                      )}
                    </TableCell>
                    {isEditable && (
                      <TableCell className="p-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(globalIdx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {isEditable && (
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleAdd(addCategory)}>
          <Plus className="h-3 w-3" />
          Přidat
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-chart-4" />
        Ceník kreditů
      </h4>
      
      <p className="text-xs text-muted-foreground">
        Cena za kredit a odměna grafika se nastavují na úrovni jednotlivé zakázky.
      </p>

      {renderTable(bannerTypes, 'Bannery', <Image className="h-3.5 w-3.5" />, 'banner')}
      {renderTable(videoTypes, 'Videa', <Video className="h-3.5 w-3.5" />, 'video')}
    </div>
  );
}
