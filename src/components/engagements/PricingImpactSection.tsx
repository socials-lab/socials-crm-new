import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Calculator, ShieldAlert, Building, Users, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import {
  calculateClientEconomics,
  calculateAmendmentImpact,
  calculateExpansionPrice,
  getDefaultMultiplier,
  formatCZK,
  type PricingScenario,
  type PricingSnapshot,
  type ClientEconomics,
  type PricingScenarioResult,
  type NewClientData,
  type ColleagueRewardEntry,
} from '@/utils/pricingEngine';
import {
  getRewardsFromServiceConfig,
  getServiceRewardRecommendation,
  applyMultiplierToRewards,
  type RoleReward,
} from '@/constants/serviceRewards';

interface PricingImpactSectionProps {
  clientId: string;
  engagementId: string;
  proposedPrice: number;
  selectedServiceId: string;
  isAddonService: boolean;
  /** Tier selected in parent (growth/pro/elite) */
  selectedTier?: string | null;
  /** When set to 'expand_country' or 'add_service', hides internal scenario selector */
  requestType?: 'expand_country' | 'add_service' | string;
  /** Multiplier from parent for expand_country */
  expandMultiplier?: number;
  /** Reference engagement_service_id from parent for expand_country */
  expandRefServiceId?: string;
  onPriceChange: (price: number) => void;
  onInternalCostChange: (cost: number) => void;
  onSnapshotChange: (snapshot: PricingSnapshot | null) => void;
  onRequiresAdminApproval: (required: boolean) => void;
}

const CORE_SCENARIO_OPTIONS: { value: PricingScenario; label: string }[] = [
  { value: 'expand_country', label: 'Nová země (rozšíření stávající služby)' },
  { value: 'expand_shop', label: 'Nový shop / značka (rozšíření stávající služby)' },
];

const ADDON_SCENARIO_OPTIONS: { value: PricingScenario; label: string }[] = [
  { value: 'add_addon', label: 'Doplňková služba (addon)' },
];

const EMPTY_REWARD_ROW: ColleagueRewardEntry = {
  role: '',
  hours: 0,
  reward: 0,
  reward_type: 'fixed_monthly',
};

export function PricingImpactSection({
  clientId,
  engagementId,
  proposedPrice,
  selectedServiceId,
  isAddonService,
  selectedTier: selectedTierProp,
  requestType: parentRequestType,
  expandMultiplier: parentExpandMultiplier,
  expandRefServiceId: parentExpandRefServiceId,
  onPriceChange,
  onInternalCostChange,
  onSnapshotChange,
  onRequiresAdminApproval,
}: PricingImpactSectionProps) {
  const { engagements, engagementServices, assignments, services, colleagues } = useCRMData();

  // When parent controls the scenario, override local state
  const isParentControlled = parentRequestType === 'expand_country' || parentRequestType === 'add_service' || parentRequestType === 'update_service_price';
  const isUpdateServicePrice = parentRequestType === 'update_service_price';

  // Local state
  const [scenario, setScenario] = useState<PricingScenario>(
    parentRequestType === 'expand_country' ? 'expand_country' : isAddonService ? 'add_addon' : 'expand_country'
  );
  const [referenceServiceId, setReferenceServiceId] = useState<string>(parentExpandRefServiceId || '');
  const [multiplier, setMultiplier] = useState<number>(parentExpandMultiplier ?? getDefaultMultiplier('expand_country') ?? 0.5);
  const [manualInternalCost, setManualInternalCost] = useState<number>(0);
  const [justification, setJustification] = useState('');

  // Editable final price (for expansion scenarios)
  const [finalPriceOverride, setFinalPriceOverride] = useState<number | null>(null);

  // New client (different SRO) state for expand_shop
  const [requiresNewClient, setRequiresNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientBrand, setNewClientBrand] = useState('');
  const [newClientIco, setNewClientIco] = useState('');
  const [newClientDic, setNewClientDic] = useState('');
  const [newClientNote, setNewClientNote] = useState('');

  // Colleague rewards state
  const [colleagueRewards, setColleagueRewards] = useState<ColleagueRewardEntry[]>([]);

  const activeColleagues = useMemo(
    () => (colleagues || []).filter(c => c.status === 'active'),
    [colleagues]
  );

  const clientEconomics: ClientEconomics = useMemo(
    () => calculateClientEconomics(clientId, engagements, engagementServices, assignments),
    [clientId, engagements, engagementServices, assignments]
  );

  const activeClientServices = useMemo(() => {
    return clientEconomics.services;
  }, [clientEconomics]);

  const referenceService = useMemo(() => {
    return activeClientServices.find(s => s.id === referenceServiceId);
  }, [activeClientServices, referenceServiceId]);

  // Sync parent-controlled props
  useEffect(() => {
    if (parentRequestType === 'expand_country') {
      setScenario('expand_country');
      if (parentExpandRefServiceId) setReferenceServiceId(parentExpandRefServiceId);
      if (parentExpandMultiplier !== undefined) setMultiplier(parentExpandMultiplier);
    } else if (parentRequestType === 'add_service') {
      setScenario('add_addon'); // Direct pricing, no scenario picker
    } else if (isAddonService) {
      setScenario('add_addon');
    }
  }, [isAddonService, parentRequestType, parentExpandRefServiceId, parentExpandMultiplier]);

  // Catalog service lookup
  const selectedCatalogService = useMemo(
    () => services?.find(s => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  // Recommended price from multiplier
  const recommendedPrice = useMemo(() => {
    if (!referenceService) return 0;
    if (scenario === 'expand_country' || scenario === 'expand_shop') {
      return calculateExpansionPrice(referenceService.price, multiplier);
    }
    return 0;
  }, [referenceService, multiplier, scenario]);

  // Reset finalPriceOverride when recommended price changes
  useEffect(() => {
    setFinalPriceOverride(null);
  }, [recommendedPrice]);

  // Stable key for assignments to avoid infinite re-renders
  const assignmentsKey = useMemo(
    () => (assignments || []).map(a => `${a.id}-${a.colleague_id}-${a.role_on_engagement}`).join(','),
    [assignments]
  );

  // Look up recommended rewards when service/tier/scenario/multiplier changes
  useEffect(() => {
    // For expansion scenarios, use the reference engagement service to find catalog service
    let catalogSvc = selectedCatalogService;
    let tierForLookup = selectedTierProp || null;
    
    if ((scenario === 'expand_country' || scenario === 'expand_shop') && referenceServiceId) {
      const refEngService = engagementServices?.find(es => es.id === referenceServiceId);
      if (refEngService) {
        catalogSvc = services?.find(s => s.id === refEngService.service_id) || null;
        tierForLookup = refEngService.selected_tier || tierForLookup;
      }
    }

    if (!catalogSvc) {
      return;
    }
    const tier = tierForLookup;
    // Try DB reward_config first, then fall back to hardcoded lookup
    const recommended = getRewardsFromServiceConfig(
      catalogSvc.reward_config as any,
      tier
    ) || getServiceRewardRecommendation(
      catalogSvc.name,
      tier
    );
    if (recommended) {
      const isExp = scenario === 'expand_country' || scenario === 'expand_shop';
      const roles = isExp ? applyMultiplierToRewards(recommended, multiplier) : recommended;

      // Get current assignments on this engagement to auto-match colleagues by role
      const engAssignments = assignments?.filter(a => a.engagement_id === engagementId) || [];

      setColleagueRewards(
        roles.map(r => {
          // Find an existing assignment matching this role
          const matchingAssignment = engAssignments.find(
            a => a.role_on_engagement?.toLowerCase() === r.role.toLowerCase()
          );
          const matchedColleague = matchingAssignment
            ? activeColleagues.find(c => c.id === matchingAssignment.colleague_id)
            : null;

          return {
            role: r.role,
            hours: r.hours,
            reward: r.reward,
            reward_type: r.rewardType,
            colleague_id: matchedColleague?.id,
            colleague_name: matchedColleague?.full_name,
          };
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatalogService?.id, selectedTierProp, scenario, multiplier, engagementId, assignmentsKey, referenceServiceId]);

  // Update multiplier when scenario changes + reset new client
  useEffect(() => {
    const defaultMult = getDefaultMultiplier(scenario);
    if (defaultMult !== undefined) {
      setMultiplier(defaultMult);
    }
    if (scenario !== 'expand_shop') {
      setRequiresNewClient(false);
      setNewClientName('');
      setNewClientBrand('');
      setNewClientIco('');
      setNewClientDic('');
      setNewClientNote('');
    }
  }, [scenario]);

  // Total colleague rewards = internal cost
  const totalColleagueRewards = useMemo(
    () => colleagueRewards.reduce((sum, r) => sum + r.reward, 0),
    [colleagueRewards]
  );

  const isExpansion = scenario === 'expand_country' || scenario === 'expand_shop';

  // The actual price used for calculation
  const effectivePrice = useMemo(() => {
    if (isExpansion) {
      return finalPriceOverride !== null ? finalPriceOverride : recommendedPrice;
    }
    return proposedPrice;
  }, [isExpansion, finalPriceOverride, recommendedPrice, proposedPrice]);

  // Calculate delta revenue and internal cost
  const { deltaRevenue, deltaInternalCost } = useMemo(() => {
    const internalCost = colleagueRewards.length > 0 ? totalColleagueRewards : manualInternalCost;

    if (isExpansion) {
      if (!referenceService) return { deltaRevenue: 0, deltaInternalCost: 0 };
      return { deltaRevenue: effectivePrice, deltaInternalCost: internalCost };
    }
    return { deltaRevenue: effectivePrice, deltaInternalCost: internalCost };
  }, [isExpansion, referenceService, effectivePrice, manualInternalCost, colleagueRewards, totalColleagueRewards]);

  // Update parent price for expansion scenarios
  useEffect(() => {
    if (isExpansion && referenceService) {
      onPriceChange(deltaRevenue);
    }
    onInternalCostChange(deltaInternalCost);
  }, [deltaRevenue, deltaInternalCost, isExpansion, referenceService]);

  // Calculate amendment impact
  const impact: PricingScenarioResult = useMemo(
    () => calculateAmendmentImpact(clientEconomics, deltaRevenue, deltaInternalCost),
    [clientEconomics, deltaRevenue, deltaInternalCost]
  );

  // Build current colleague rewards from existing assignments
  const currentColleagueRewards: ColleagueRewardEntry[] = useMemo(() => {
    const engAssignments = assignments?.filter(a => a.engagement_id === engagementId) || [];
    return engAssignments.map(a => {
      const colleague = activeColleagues.find(c => c.id === a.colleague_id);
      const costModel = a.cost_model || 'fixed_monthly';
      let reward = 0;
      let rewardType: 'fixed_monthly' | 'per_credit' | 'hourly' = 'fixed_monthly';
      if (costModel === 'hourly') {
        reward = a.hourly_cost || 0;
        rewardType = 'hourly';
      } else if (costModel === 'percentage') {
        reward = a.percentage_of_revenue || 0;
        rewardType = 'per_credit';
      } else {
        reward = a.monthly_cost || 0;
        rewardType = 'fixed_monthly';
      }
      return {
        role: a.role_on_engagement || 'Bez role',
        colleague_id: a.colleague_id,
        colleague_name: colleague?.full_name,
        hours: 0,
        reward,
        reward_type: rewardType,
      };
    }).filter(r => r.reward > 0);
  }, [assignments, engagementId, activeColleagues]);

  // Update admin approval requirement
  useEffect(() => {
    onRequiresAdminApproval(impact.requiresAdminApproval);
  }, [impact.requiresAdminApproval]);

  // Build and emit snapshot
  useEffect(() => {
    if (deltaRevenue === 0 && deltaInternalCost === 0) {
      onSnapshotChange(null);
      return;
    }

    const newClientData: NewClientData | undefined = (requiresNewClient && scenario === 'expand_shop') ? {
      company_name: newClientName,
      brand_name: newClientBrand || undefined,
      ico: newClientIco || undefined,
      dic: newClientDic || undefined,
      note: newClientNote || undefined,
    } : undefined;

    const snapshot: PricingSnapshot = {
      scenario,
      reference_service_id: referenceService?.id,
      reference_service_name: referenceService?.name,
      reference_price: referenceService?.price,
      reference_internal_cost: referenceService?.internalCost,
      multiplier: isExpansion ? multiplier : undefined,
      recommended_price: isExpansion ? recommendedPrice : undefined,
      final_edited_price: isExpansion && finalPriceOverride !== null ? finalPriceOverride : undefined,
      delta_revenue: deltaRevenue,
      delta_internal_cost: deltaInternalCost,
      current_total_revenue: clientEconomics.totalRevenue,
      current_total_internal_cost: clientEconomics.totalInternalCost,
      new_total_revenue: impact.newTotalRevenue,
      new_total_internal_cost: impact.newTotalInternalCost,
      new_margin_percent: impact.newMarginPercent,
      validation_status: impact.validationStatus,
      requires_admin_approval: impact.requiresAdminApproval,
      justification: justification || undefined,
      requires_new_client: requiresNewClient && scenario === 'expand_shop' ? true : undefined,
      new_client_data: newClientData,
      colleague_rewards: colleagueRewards.length > 0 ? colleagueRewards : undefined,
      current_colleague_rewards: currentColleagueRewards.length > 0 ? currentColleagueRewards : undefined,
    };
    onSnapshotChange(snapshot);
  }, [scenario, referenceService, multiplier, deltaRevenue, deltaInternalCost, clientEconomics, impact, justification, requiresNewClient, newClientName, newClientBrand, newClientIco, newClientDic, newClientNote, colleagueRewards, currentColleagueRewards, recommendedPrice, finalPriceOverride, isExpansion]);

  const defaultMult = getDefaultMultiplier(scenario);

  // Add empty reward row
  const addRewardRow = useCallback(() => {
    setColleagueRewards(prev => [...prev, { ...EMPTY_REWARD_ROW }]);
  }, []);

  // Remove reward row
  const removeRewardRow = useCallback((idx: number) => {
    setColleagueRewards(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Missing internal cost warning
  const showInternalCostWarning = deltaRevenue > 0 && deltaInternalCost === 0 && colleagueRewards.length === 0;

  return (
    <div className="space-y-5 overflow-hidden min-w-0">
      {/* ===== BLOCK 1: Current State (read-only, muted) ===== */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Aktuální stav klienta
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-background rounded-md p-3 border">
            <p className="text-muted-foreground text-xs">Měsíční fee</p>
            <p className="font-semibold">{formatCZK(clientEconomics.totalRevenue)}</p>
          </div>
          <div className="bg-background rounded-md p-3 border">
            <p className="text-muted-foreground text-xs">Interní náklady</p>
            <p className="font-semibold">{formatCZK(clientEconomics.totalInternalCost)}</p>
          </div>
          <div className="bg-background rounded-md p-3 border">
            <p className="text-muted-foreground text-xs">Marže</p>
            <p className="font-semibold">
              {clientEconomics.marginPercent.toFixed(1)}%
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({formatCZK(clientEconomics.margin)})
              </span>
            </p>
          </div>
        </div>

        {clientEconomics.services.length > 0 && (
          <div className="rounded-md border overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="h-8 text-xs">Služba</TableHead>
                  <TableHead className="h-8 text-xs text-right">Fee</TableHead>
                  <TableHead className="h-8 text-xs text-right">Interní</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientEconomics.services.map((s) => (
                  <TableRow key={s.id} className="text-xs">
                    <TableCell className="py-1.5">{s.name}</TableCell>
                    <TableCell className="py-1.5 text-right">{formatCZK(s.price)}</TableCell>
                    <TableCell className="py-1.5 text-right">{formatCZK(s.internalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ===== BLOCK 2: Proposed Change (interactive, prominent) — hidden for update_service_price ===== */}
      {!isUpdateServicePrice && (
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Navrhovaná změna</h4>
        </div>

        {/* Scenario type — hidden when parent controls the flow */}
        {!isParentControlled && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Typ scénáře</Label>
            <Select value={scenario} onValueChange={(v) => setScenario(v as PricingScenario)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isAddonService ? ADDON_SCENARIO_OPTIONS : CORE_SCENARIO_OPTIONS).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Reference service picker for expansion scenarios — hidden when parent controls */}
        {isExpansion && !isParentControlled && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Referenční služba (základ pro výpočet ceny)</Label>
              <Select value={referenceServiceId} onValueChange={setReferenceServiceId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Vyberte stávající službu klienta" />
                </SelectTrigger>
                <SelectContent>
                  {activeClientServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({formatCZK(s.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {referenceService && (
              <div className="space-y-3 p-3 rounded-md border bg-background">
                <p className="text-xs font-medium text-muted-foreground">Cenová kalkulace</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Multiplikátor
                      {defaultMult !== undefined && (
                        <span className="text-muted-foreground ml-1">(doporučeno: {defaultMult})</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="2"
                      value={multiplier}
                      onChange={(e) => setMultiplier(Number(e.target.value))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Finální cena položky</Label>
                    <Input
                      type="number"
                      value={finalPriceOverride !== null ? finalPriceOverride : recommendedPrice}
                      onChange={(e) => setFinalPriceOverride(Number(e.target.value))}
                      className="h-9"
                      step="100"
                    />
                  </div>
                </div>

                {/* Recommended price hint */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Doporučená cena: {formatCZK(recommendedPrice)}
                    {' '}({formatCZK(referenceService.price)} × {multiplier})
                  </span>
                  {finalPriceOverride !== null && finalPriceOverride !== recommendedPrice && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-xs text-primary"
                      onClick={() => setFinalPriceOverride(null)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Použít doporučenou
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <p>Ref. cena: {formatCZK(referenceService.price)}</p>
                  <p>Ref. interní: {formatCZK(referenceService.internalCost)}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* New client (different SRO) option for expand_shop — hidden when parent controls */}
        {scenario === 'expand_shop' && !isParentControlled && (
          <div className="space-y-3 p-3 rounded-md border bg-background">
            <div className="flex items-center gap-2">
              <Checkbox
                id="requires-new-client"
                checked={requiresNewClient}
                onCheckedChange={(checked) => setRequiresNewClient(checked === true)}
              />
              <Label htmlFor="requires-new-client" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Nový shop je pod jiným SRO (nový klient)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Pokud je nový e-shop provozován jinou právnickou osobou, bude potřeba založit nového klienta a novou zakázku.
            </p>

            {requiresNewClient && (
              <div className="space-y-3 ml-6 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Název společnosti (SRO) *</Label>
                    <Input
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Např. NovýShop s.r.o."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Název značky / e-shopu</Label>
                    <Input
                      value={newClientBrand}
                      onChange={(e) => setNewClientBrand(e.target.value)}
                      placeholder="Např. NovýShop.cz"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">IČO</Label>
                    <Input
                      value={newClientIco}
                      onChange={(e) => setNewClientIco(e.target.value)}
                      placeholder="12345678"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">DIČ</Label>
                    <Input
                      value={newClientDic}
                      onChange={(e) => setNewClientDic(e.target.value)}
                      placeholder="CZ12345678"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Poznámka k novému klientovi</Label>
                  <Input
                    value={newClientNote}
                    onChange={(e) => setNewClientNote(e.target.value)}
                    placeholder="Např. Sesterská firma stávajícího klienta XY"
                    className="h-9"
                  />
                </div>

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
                    Po schválení návrhu bude automaticky vytvořen nový klient a nová zakázka. Ekonomický dopad se počítá vůči stávajícímu klientovi pro referenci.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        {/* Internal cost manual input — only when no colleague rewards rows exist */}
        {!isExpansion && colleagueRewards.length === 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Interní náklady na tuto službu (CZK/měs)</Label>
            <Input
              type="number"
              value={manualInternalCost}
              onChange={(e) => setManualInternalCost(Number(e.target.value))}
              className="h-9"
              placeholder="Náklady na kolegu/y"
            />
          </div>
        )}
      </div>

      {/* ===== BLOCK 3: Colleague Rewards (own section) ===== */}
      <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold">Odměny kolegů</h4>
            {isExpansion && referenceService && (
              <span className="text-xs text-muted-foreground">(× {multiplier} multiplikátor)</span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addRewardRow}
          >
            <Plus className="h-3 w-3 mr-1" />
            Přidat kolegu
          </Button>
        </div>

        {colleagueRewards.length > 0 ? (
          <>
            <div className="rounded-md border overflow-hidden bg-background">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="h-8 text-xs w-[30%]">Role</TableHead>
                    <TableHead className="h-8 text-xs w-[30%]">Kolega</TableHead>
                    <TableHead className="h-8 text-xs text-right w-[32%]">Odměna</TableHead>
                    <TableHead className="h-8 text-xs w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colleagueRewards.map((reward, idx) => {
                    // Find current assignment for this colleague on the reference service (or engagement-level)
                    const currentAssignment = isExpansion && reward.colleague_id
                      ? (
                          // First try: match by engagement_service_id
                          (referenceServiceId && assignments?.find(a => 
                            a.colleague_id === reward.colleague_id && 
                            a.engagement_service_id === referenceServiceId
                          )) ||
                          // Fallback: match by engagement_id + same role (for assignments without service link)
                          assignments?.find(a => 
                            a.colleague_id === reward.colleague_id && 
                            a.engagement_id === engagementId &&
                            (!a.engagement_service_id || a.engagement_service_id === referenceServiceId)
                          )
                        )
                      : null;
                    const currentReward = currentAssignment
                      ? (currentAssignment.cost_model === 'fixed_monthly' ? currentAssignment.monthly_cost : currentAssignment.hourly_cost) || 0
                      : 0;
                    const newTotalForColleague = currentReward + reward.reward;

                    return (
                      <React.Fragment key={idx}>
                        <TableRow className="text-xs">
                          <TableCell className="py-1.5">
                            <Input
                              value={reward.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                const tier = selectedTierProp || null;
                                const recommended = getRewardsFromServiceConfig(
                                  selectedCatalogService?.reward_config as any,
                                  tier
                                ) || getServiceRewardRecommendation(
                                  selectedCatalogService?.name || '',
                                  tier
                                );
                                const matchingReward = recommended?.find(
                                  r => r.role.toLowerCase() === newRole.toLowerCase()
                                );
                                const isExp = scenario === 'expand_country' || scenario === 'expand_shop';
                                const rewardAmount = matchingReward
                                  ? (isExp ? Math.round(matchingReward.reward * multiplier) : matchingReward.reward)
                                  : undefined;
                                const rewardHours = matchingReward?.hours;
                                const rewardType = matchingReward?.rewardType;

                                setColleagueRewards(prev => prev.map((r, i) =>
                                  i === idx ? {
                                    ...r,
                                    role: newRole,
                                    ...(rewardAmount !== undefined && r.reward === 0 ? { reward: rewardAmount } : {}),
                                    ...(rewardHours !== undefined && r.hours === 0 ? { hours: rewardHours } : {}),
                                    ...(rewardType ? { reward_type: rewardType } : {}),
                                  } : r
                                ));
                              }}
                              className="h-7 text-xs w-full"
                              placeholder="Role"
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Select
                              value={reward.colleague_id || ''}
                              onValueChange={(val) => {
                                const col = activeColleagues.find(c => c.id === val);
                                setColleagueRewards(prev => prev.map((r, i) =>
                                  i === idx ? { ...r, colleague_id: val, colleague_name: col?.full_name } : r
                                ));
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue placeholder="Vybrat kolegu" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeColleagues.map(c => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">
                                    {c.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-1.5 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Input
                                type="number"
                                value={reward.reward || ''}
                                onChange={(e) => {
                                  setColleagueRewards(prev => prev.map((r, i) =>
                                    i === idx ? { ...r, reward: Number(e.target.value) } : r
                                  ));
                                }}
                                className="h-7 w-full text-xs text-right"
                                step="100"
                                placeholder="0"
                              />
                              <span className="text-muted-foreground text-[10px] shrink-0">
                                {reward.reward_type === 'per_credit' ? 'Kč/kredit' : 'Kč'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRewardRow(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpansion && currentAssignment && currentReward > 0 && (
                          <TableRow className="border-0">
                            <TableCell colSpan={4} className="py-0.5 pb-2">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-1">
                                <span>Aktuální odměna: <span className="font-medium text-foreground">{formatCZK(currentReward)}/měs</span></span>
                                <span>→</span>
                                <span>Navýšení: <span className="font-medium text-primary">+{formatCZK(reward.reward)}</span></span>
                                <span>→</span>
                                <span>Celkem: <span className="font-semibold text-foreground">{formatCZK(newTotalForColleague)}/měs</span></span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-muted-foreground">Celkové interní náklady:</span>
              <span className="font-semibold">{formatCZK(totalColleagueRewards)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            Zatím žádné odměny — klikněte „Přidat kolegu" pro přidání.
          </p>
        )}

        {/* Warning: no internal cost */}
        {showInternalCostWarning && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
              <strong>Upozornění:</strong> Nejsou zadány žádné interní náklady. Marže se počítá jako 100 %, což neodpovídá realitě.
              Přidejte odměny kolegů nebo vyplňte interní náklady.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ===== BLOCK 4: Result — New State After Change ===== */}
      {deltaRevenue > 0 && (
        <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <h4 className="text-sm font-semibold">Výsledek po změně</h4>
          </div>

          {/* Delta summary */}
          <div className="flex items-center gap-4 text-sm bg-background rounded-md p-3 border">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              <span className="text-muted-foreground">+</span>
              <span className="font-medium">{formatCZK(deltaRevenue)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-muted-foreground">−</span>
              <span className="font-medium">{formatCZK(deltaInternalCost)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-background rounded-md p-3 border">
              <p className="text-muted-foreground text-xs">Nové fee celkem</p>
              <p className="font-semibold">{formatCZK(impact.newTotalRevenue)}</p>
            </div>
            <div className="bg-background rounded-md p-3 border">
              <p className="text-muted-foreground text-xs">Nové interní celkem</p>
              <p className="font-semibold">{formatCZK(impact.newTotalInternalCost)}</p>
            </div>
            <div className="bg-background rounded-md p-3 border">
              <p className="text-muted-foreground text-xs">Nová marže</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{impact.newMarginPercent.toFixed(1)}%</span>
                <MarginBadge status={impact.validationStatus} />
              </div>
            </div>
          </div>

          {/* Warnings */}
          {impact.validationStatus === 'orange' && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                <strong>Upozornění:</strong> Marže {impact.newMarginPercent.toFixed(1)}% je pod cílovou hodnotou 66%.
                Uveďte prosím důvod pro snížení marže. Návrh bude vyžadovat schválení vedením.
              </AlertDescription>
            </Alert>
          )}

          {impact.validationStatus === 'red' && (
            <Alert className="border-red-300 bg-red-50">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Kritické varování:</strong> Marže {impact.newMarginPercent.toFixed(1)}% je výrazně pod minimální hranicí 63%.
                Návrh vyžaduje administrátorské schválení a zdůvodnění.
              </AlertDescription>
            </Alert>
          )}

          {impact.validationStatus !== 'green' && (
            <div className="space-y-2">
              <Label className="text-xs">
                Zdůvodnění snížené marže *
              </Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Např. Strategický klient, plánujeme rozšíření v Q3..."
                rows={2}
                className="text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MarginBadge({ status }: { status: 'green' | 'orange' | 'red' }) {
  if (status === 'green') {
    return (
      <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        OK
      </Badge>
    );
  }
  if (status === 'orange') {
    return (
      <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">
        <AlertTriangle className="h-3 w-3 mr-0.5" />
        Varování
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0">
      <ShieldAlert className="h-3 w-3 mr-0.5" />
      Pod hranicí
    </Badge>
  );
}
