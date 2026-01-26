import { Check, Zap, Target, CreditCard } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  outputTypes: { name: string; credits: number; description: string }[];
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
}

export function ServiceDetailView({ data }: ServiceDetailViewProps) {
  // Guard against undefined or null data
  if (!data) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Detailní popis služby zatím nebyl nastaven. Klikněte na "Upravit detaily" pro přidání informací.
      </p>
    );
  }

  const hasContent = data.tagline || (data.platforms && data.platforms.length > 0) || 
                     (data.benefits && data.benefits.length > 0) ||
                     (data.setup_items && data.setup_items.length > 0) ||
                     (data.management_items && data.management_items.length > 0);
  
  if (!hasContent) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Detailní popis služby zatím nebyl nastaven. Klikněte na "Upravit detaily" pro přidání informací.
      </p>
    );
  }

  const hasTierComparison = data.tier_comparison && data.tier_comparison.length > 0;
  const hasCreditPricing = !!data.credit_pricing;

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
      {data.benefits && data.benefits.length > 0 && (
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
      {((data.setup_items && data.setup_items.length > 0) || (data.management_items && data.management_items.length > 0)) && (
        <Accordion type="multiple" className="w-full">
          {data.setup_items && data.setup_items.length > 0 && (
            <AccordionItem value="setup" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                <span className="flex items-center gap-2">
                  ⚙️ Úvodní nastavení projektu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-2">
                  {data.setup_items.map((section, sectionIndex) => (
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

          {data.management_items && data.management_items.length > 0 && (
            <AccordionItem value="management" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                <span className="flex items-center gap-2">
                  📈 Průběžná správa
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-2">
                  {data.management_items.map((section, sectionIndex) => (
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
      {hasTierComparison && data.tier_prices && (
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
                <div className="text-[10px] text-muted-foreground">{data.tier_prices.growth.spend}</div>
                <div className="text-lg font-bold text-chart-1">
                  {data.tier_prices.growth.price.toLocaleString('cs-CZ')} Kč
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
                <div className="text-[10px] text-muted-foreground">{data.tier_prices.pro.spend}</div>
                <div className="text-lg font-bold text-chart-2">
                  {data.tier_prices.pro.price.toLocaleString('cs-CZ')} Kč
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
                <div className="text-[10px] text-muted-foreground">{data.tier_prices.elite.spend}</div>
                <div className="text-lg font-bold text-chart-4">
                  {data.tier_prices.elite.price.toLocaleString('cs-CZ')} Kč
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
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-chart-4" />
            Ceník kreditů
          </h4>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Základní cena</div>
                <div className="text-xl font-bold text-primary">
                  {data.credit_pricing.basePrice} {data.credit_pricing.currency}/kredit
                </div>
              </CardContent>
            </Card>
            <Card className="bg-chart-4/5 border-chart-4/20">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Express dodání</div>
                <div className="text-xl font-bold text-chart-4">
                  +{((data.credit_pricing.expressMultiplier - 1) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  ({data.credit_pricing.basePrice * data.credit_pricing.expressMultiplier} {data.credit_pricing.currency}/kredit)
                </div>
              </CardContent>
            </Card>
          </div>

          {data.credit_pricing.outputTypes && data.credit_pricing.outputTypes.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-medium">Typ výstupu</TableHead>
                    <TableHead className="text-xs font-medium text-center w-20">Kredity</TableHead>
                    <TableHead className="text-xs font-medium text-right w-24">Cena</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.credit_pricing.outputTypes.map((output, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">
                        <div>{output.name}</div>
                      </TableCell>
                      <TableCell className="text-xs text-center font-medium">
                        {output.credits}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {(output.credits * data.credit_pricing!.basePrice).toLocaleString('cs-CZ')} Kč
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
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
