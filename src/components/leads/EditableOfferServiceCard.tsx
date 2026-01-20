import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, X, Plus, Trash2, Package, Clock, Zap, ClipboardList } from 'lucide-react';
import type { PublicOfferService } from '@/types/publicOffer';

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
  const [isOpen, setIsOpen] = useState(true);
  
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
                {service.billing_type === 'monthly' ? 'Měsíčně' : 'Jednorázově'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
