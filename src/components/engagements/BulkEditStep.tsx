import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMData } from '@/hooks/useCRMData';
import type { BulkEditProposedChanges, BulkEditServiceItem, EngagementService, Colleague } from '@/types/crm';
import { getServiceRewardRecommendation, getRewardsFromServiceConfig } from '@/constants/serviceRewards';
import { SERVICE_DETAILS } from '@/constants/serviceDetails';

interface BulkEditStepProps {
  engagementId: string;
  onChange: (changes: BulkEditProposedChanges) => void;
  initialData?: BulkEditProposedChanges | null;
}

interface EditableService {
  engagement_service_id: string;
  name: string;
  action: 'keep' | 'update' | 'deactivate';
  old_price: number;
  new_price: number;
  currency: string;
  assignments: EditableAssignment[];
  isExpanded: boolean;
}

interface EditableAssignment {
  assignment_id: string;
  colleague_id: string;
  colleague_name: string;
  role: string;
  cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
  old_value: number;
  new_value: number;
}

interface NewService {
  id: string;
  service_id: string | null;
  name: string;
  price: number;
  currency: string;
  billing_type: 'monthly' | 'one_off';
  assignments: Array<{
    colleague_id: string;
    colleague_name: string;
    role: string;
    cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
    monthly_cost: number;
  }>;
  isExpanded: boolean;
}

export function BulkEditStep({ engagementId, onChange, initialData }: BulkEditStepProps) {
  const { engagementServices: allEngServices, assignments: allAssignments, colleagues, services } = useCRMData();
  
  const engServices = allEngServices.filter(es => es.engagement_id === engagementId && es.is_active);
  const engAssignments = allAssignments.filter(a => a.engagement_id === engagementId);

  const [editableServices, setEditableServices] = useState<EditableService[]>([]);
  const [newServices, setNewServices] = useState<NewService[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize from engagement services
  useEffect(() => {
    if (engServices.length === 0 || initialized) return;
    
    const initial: EditableService[] = engServices.map(es => {
      const serviceAssignments = engAssignments.filter(
        a => a.engagement_service_id === es.id || (!a.engagement_service_id && engServices.length === 1)
      );
      return {
        engagement_service_id: es.id,
        name: es.name,
        action: 'keep' as const,
        old_price: es.price,
        new_price: es.price,
        currency: es.currency || 'CZK',
        isExpanded: false,
        assignments: serviceAssignments.map(a => {
          const colleague = colleagues.find(c => c.id === a.colleague_id);
          const currentValue = a.cost_model === 'hourly'
            ? (a.hourly_cost || 0)
            : a.cost_model === 'percentage'
              ? (a.percentage_of_revenue || 0)
              : (a.monthly_cost || 0);
          return {
            assignment_id: a.id,
            colleague_id: a.colleague_id,
            colleague_name: colleague?.full_name || 'Neznámý',
            role: a.role_on_engagement || '',
            cost_model: (a.cost_model || 'fixed_monthly') as 'hourly' | 'fixed_monthly' | 'percentage',
            old_value: currentValue,
            new_value: currentValue,
          };
        }),
      };
    });
    
    setEditableServices(initial);
    setInitialized(true);
  }, [engServices, engAssignments, colleagues, initialized]);

  // Emit changes whenever state changes
  const emitChanges = useCallback(() => {
    const serviceItems: BulkEditServiceItem[] = editableServices.map(es => ({
      engagement_service_id: es.engagement_service_id,
      service_name: es.name,
      action: es.action,
      old_price: es.old_price,
      new_price: es.new_price,
      currency: es.currency,
      assignment_changes: es.assignments
        .filter(a => a.new_value !== a.old_value)
        .map(a => ({
          assignment_id: a.assignment_id,
          colleague_id: a.colleague_id,
          colleague_name: a.colleague_name,
          role: a.role,
          cost_model: a.cost_model,
          old_value: a.old_value,
          new_value: a.new_value,
        })),
    }));

    const oldTotalMonthly = editableServices.reduce((sum, s) => sum + s.old_price, 0);
    const newTotalMonthly = editableServices
      .filter(s => s.action !== 'deactivate')
      .reduce((sum, s) => sum + s.new_price, 0)
      + newServices.reduce((sum, s) => sum + s.price, 0);

    const oldTotalCost = editableServices.reduce(
      (sum, s) => sum + s.assignments.reduce((aSum, a) => aSum + a.old_value, 0), 0
    );
    const newTotalCost = editableServices
      .filter(s => s.action !== 'deactivate')
      .reduce((sum, s) => sum + s.assignments.reduce((aSum, a) => aSum + a.new_value, 0), 0)
      + newServices.reduce(
        (sum, s) => sum + s.assignments.reduce((aSum, a) => aSum + a.monthly_cost, 0), 0
      );

    const result: BulkEditProposedChanges = {
      services: serviceItems,
      new_services: newServices.length > 0 ? newServices.map(ns => ({
        service_id: ns.service_id,
        name: ns.name,
        price: ns.price,
        currency: ns.currency,
        billing_type: ns.billing_type,
        assignments: ns.assignments,
      })) : undefined,
      old_total_monthly: oldTotalMonthly,
      new_total_monthly: newTotalMonthly,
      old_total_internal_cost: oldTotalCost,
      new_total_internal_cost: newTotalCost,
      currency: 'CZK',
    };

    onChange(result);
  }, [editableServices, newServices, onChange]);

  useEffect(() => {
    if (initialized && editableServices.length > 0) {
      emitChanges();
    }
  }, [editableServices, newServices, initialized, emitChanges]);

  const updateService = (idx: number, patch: Partial<EditableService>) => {
    setEditableServices(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      // Auto-detect action
      if (patch.new_price !== undefined && patch.new_price !== updated[idx].old_price) {
        updated[idx].action = 'update';
      }
      return updated;
    });
  };

  const updateAssignment = (serviceIdx: number, assignmentIdx: number, newValue: number) => {
    setEditableServices(prev => {
      const updated = [...prev];
      const assignments = [...updated[serviceIdx].assignments];
      assignments[assignmentIdx] = { ...assignments[assignmentIdx], new_value: newValue };
      updated[serviceIdx] = { ...updated[serviceIdx], assignments, action: 'update' };
      return updated;
    });
  };

  const toggleDeactivate = (idx: number) => {
    setEditableServices(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        action: updated[idx].action === 'deactivate' ? 'keep' : 'deactivate',
      };
      return updated;
    });
  };

  const addNewService = () => {
    setNewServices(prev => [...prev, {
      id: crypto.randomUUID(),
      service_id: null,
      name: '',
      price: 0,
      currency: 'CZK',
      billing_type: 'monthly',
      assignments: [],
      isExpanded: true,
    }]);
  };

  const removeNewService = (idx: number) => {
    setNewServices(prev => prev.filter((_, i) => i !== idx));
  };

  const updateNewService = (idx: number, patch: Partial<NewService>) => {
    setNewServices(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  };

  const selectCatalogService = (newServiceIdx: number, serviceId: string) => {
    const catalogService = services.find(s => s.id === serviceId);
    if (!catalogService) return;
    updateNewService(newServiceIdx, {
      service_id: serviceId,
      name: catalogService.name,
      price: catalogService.base_price || 0,
    });
  };

  // Calculate totals
  const oldTotal = editableServices.reduce((sum, s) => sum + s.old_price, 0);
  const newTotal = editableServices
    .filter(s => s.action !== 'deactivate')
    .reduce((sum, s) => sum + s.new_price, 0)
    + newServices.reduce((sum, s) => sum + s.price, 0);
  const delta = newTotal - oldTotal;

  const oldCost = editableServices.reduce(
    (sum, s) => sum + s.assignments.reduce((a, r) => a + r.old_value, 0), 0
  );
  const newCost = editableServices
    .filter(s => s.action !== 'deactivate')
    .reduce((sum, s) => sum + s.assignments.reduce((a, r) => a + r.new_value, 0), 0)
    + newServices.reduce((sum, s) => sum + s.assignments.reduce((a, r) => a + r.monthly_cost, 0), 0);

  const newMargin = newTotal > 0 ? Math.round(((newTotal - newCost) / newTotal) * 100) : 0;
  const marginColor = newMargin >= 66 ? 'text-green-600' : newMargin >= 63 ? 'text-yellow-600' : 'text-destructive';

  const hasChanges = editableServices.some(s => s.action !== 'keep') || newServices.length > 0;

  // Available catalog services (not already in engagement)
  const existingServiceIds = engServices.map(es => es.service_id).filter(Boolean);
  const availableCatalogServices = services.filter(s => s.is_active && !existingServiceIds.includes(s.id));

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        3. Hromadná úprava služeb
      </h4>

      {/* Existing services */}
      {editableServices.map((es, idx) => {
        const isDeactivated = es.action === 'deactivate';
        const priceChanged = es.new_price !== es.old_price;
        const hasAssignmentChanges = es.assignments.some(a => a.new_value !== a.old_value);
        const hasAnyChange = priceChanged || hasAssignmentChanges || isDeactivated;

        return (
          <Card key={es.engagement_service_id} className={cn(
            "transition-all",
            isDeactivated && "opacity-50 border-destructive/30",
            hasAnyChange && !isDeactivated && "border-primary/30",
          )}>
            <CardContent className="p-3 space-y-3">
              {/* Service header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => updateService(idx, { isExpanded: !es.isExpanded })}
                  >
                    {es.isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <span className={cn("text-sm font-medium truncate", isDeactivated && "line-through")}>{es.name}</span>
                  {hasAnyChange && !isDeactivated && (
                    <Badge variant="outline" className="text-xs shrink-0 border-primary/30 text-primary">Upraveno</Badge>
                  )}
                  {isDeactivated && (
                    <Badge variant="destructive" className="text-xs shrink-0">Deaktivace</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Price display/edit */}
                  <div className="flex items-center gap-1 text-sm">
                    {priceChanged && !isDeactivated && (
                      <span className="line-through text-muted-foreground text-xs">
                        {es.old_price.toLocaleString('cs-CZ')}
                      </span>
                    )}
                    <Input
                      type="number"
                      value={es.new_price}
                      onChange={(e) => updateService(idx, { new_price: Number(e.target.value) })}
                      disabled={isDeactivated}
                      className="w-28 h-7 text-xs text-right tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">Kč</span>
                  </div>

                  <Button
                    type="button"
                    variant={isDeactivated ? "outline" : "ghost"}
                    size="sm"
                    className={cn("h-7 text-xs", !isDeactivated && "text-destructive hover:text-destructive")}
                    onClick={() => toggleDeactivate(idx)}
                  >
                    {isDeactivated ? 'Obnovit' : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Expanded: assignments */}
              {es.isExpanded && !isDeactivated && (
                <div className="space-y-2 pl-8">
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">Odměny kolegů</p>
                  {es.assignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Žádní přiřazení kolegové</p>
                  ) : (
                    es.assignments.map((a, aIdx) => {
                      const changed = a.new_value !== a.old_value;
                      return (
                        <div key={a.assignment_id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-medium">{a.colleague_name}</span>
                            <span className="text-xs text-muted-foreground ml-1">({a.role || 'bez role'})</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {changed && (
                              <span className="text-xs line-through text-muted-foreground">
                                {a.old_value.toLocaleString('cs-CZ')}
                              </span>
                            )}
                            <Input
                              type="number"
                              value={a.new_value}
                              onChange={(e) => updateAssignment(idx, aIdx, Number(e.target.value))}
                              className="w-24 h-6 text-xs text-right tabular-nums"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {a.cost_model === 'hourly' ? 'Kč/h' : a.cost_model === 'percentage' ? '%' : 'Kč/měs'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* New services to add */}
      {newServices.map((ns, idx) => (
        <Card key={ns.id} className="border-green-200 dark:border-green-800/30">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Nová</Badge>
                {ns.name ? (
                  <span className="text-sm font-medium">{ns.name}</span>
                ) : (
                  <Select onValueChange={(v) => selectCatalogService(idx, v)}>
                    <SelectTrigger className="h-7 text-xs w-[200px]">
                      <SelectValue placeholder="Vyberte službu" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCatalogServices.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-xs">Vlastní služba</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  value={ns.price}
                  onChange={(e) => updateNewService(idx, { price: Number(e.target.value) })}
                  className="w-28 h-7 text-xs text-right tabular-nums"
                  placeholder="Cena"
                />
                <span className="text-xs text-muted-foreground">Kč</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => removeNewService(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Custom name input */}
            {ns.service_id === null && ns.name === '' && (
              <Input
                placeholder="Název vlastní služby"
                value={ns.name}
                onChange={(e) => updateNewService(idx, { name: e.target.value })}
                className="h-7 text-xs"
              />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add new service button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addNewService}
      >
        <Plus className="h-3 w-3 mr-1" />
        Přidat novou službu
      </Button>

      {/* Summary */}
      <Card className={cn("bg-muted/30", hasChanges && "border-primary/20")}>
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            📊 Souhrn změn
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Stávající cena</p>
              <p className="font-semibold">{oldTotal.toLocaleString('cs-CZ')} Kč</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nová cena</p>
              <p className={cn("font-semibold", delta !== 0 && "text-primary")}>
                {newTotal.toLocaleString('cs-CZ')} Kč
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Rozdíl</p>
              <p className={cn("font-semibold", delta > 0 ? "text-green-600" : delta < 0 ? "text-destructive" : "")}>
                {delta >= 0 ? '+' : ''}{delta.toLocaleString('cs-CZ')} Kč
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Nová marže</p>
              <p className={cn("font-bold", marginColor)}>
                {newMargin} %
              </p>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t">
            <div>
              <p className="text-muted-foreground">Stávající náklady</p>
              <p className="font-semibold">{oldCost.toLocaleString('cs-CZ')} Kč</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nové náklady</p>
              <p className={cn("font-semibold", newCost !== oldCost && "text-primary")}>
                {newCost.toLocaleString('cs-CZ')} Kč
              </p>
            </div>
          </div>

          {/* Margin warning */}
          {newMargin < 63 && hasChanges && (
            <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Marže pod 63 % — vyžaduje schválení administrátorem</span>
            </div>
          )}
          {newMargin >= 63 && newMargin < 66 && hasChanges && (
            <div className="flex items-center gap-2 p-2 rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Marže pod cílovou hodnotou 66 % — doporučujeme odůvodnění</span>
            </div>
          )}
          {!hasChanges && (
            <p className="text-xs text-muted-foreground italic">Zatím nebyly provedeny žádné změny</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
