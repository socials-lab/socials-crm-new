import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Calculator, ShieldAlert, Building, Users } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import {
  calculateClientEconomics,
  calculateAmendmentImpact,
  calculateExpansionPrice,
  calculateExpansionInternalCost,
  getDefaultMultiplier,
  getScenarioLabel,
  formatCZK,
  type PricingScenario,
  type PricingSnapshot,
  type ClientEconomics,
  type PricingScenarioResult,
  type NewClientData,
  type ColleagueRewardEntry,
} from '@/utils/pricingEngine';
import {
  getServiceRewardRecommendation,
  applyMultiplierToRewards,
  type RoleReward,
} from '@/constants/serviceRewards';

interface PricingImpactSectionProps {
  clientId: string;
  engagementId: string;
  /** Price entered by the user in the main form */
  proposedPrice: number;
  /** Service ID selected in the main form (from catalog) */
  selectedServiceId: string;
  /** Whether the selected service is an addon */
  isAddonService: boolean;
  /** Callback to update price in parent */
  onPriceChange: (price: number) => void;
  /** Callback to update internal cost in parent */
  onInternalCostChange: (cost: number) => void;
  /** Callback to deliver the pricing snapshot for storage */
  onSnapshotChange: (snapshot: PricingSnapshot | null) => void;
  /** Whether margin justification is required */
  onRequiresAdminApproval: (required: boolean) => void;
}

const SCENARIO_OPTIONS: { value: PricingScenario; label: string }[] = [
  { value: 'expand_country', label: 'Nová země (rozšíření stávající služby)' },
  { value: 'expand_shop', label: 'Nový shop / značka (rozšíření stávající služby)' },
  { value: 'add_addon', label: 'Doplňková služba (addon)' },
  { value: 'custom_manual', label: 'Vlastní úprava (manuální)' },
];

export function PricingImpactSection({
  clientId,
  engagementId,
  proposedPrice,
  selectedServiceId,
  isAddonService,
  onPriceChange,
  onInternalCostChange,
  onSnapshotChange,
  onRequiresAdminApproval,
}: PricingImpactSectionProps) {
  const { engagements, engagementServices, assignments, services, colleagues } = useCRMData();

  // Local state
  const [scenario, setScenario] = useState<PricingScenario>(
    isAddonService ? 'add_addon' : 'expand_country'
  );
  const [referenceServiceId, setReferenceServiceId] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(getDefaultMultiplier('expand_country') ?? 0.5);
  const [manualInternalCost, setManualInternalCost] = useState<number>(0);
  const [justification, setJustification] = useState('');

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
  // Calculate current client economics
  const clientEconomics: ClientEconomics = useMemo(
    () => calculateClientEconomics(clientId, engagements, engagementServices, assignments),
    [clientId, engagements, engagementServices, assignments]
  );

  // Get active services for the selected engagement's client (for reference service picker)
  const activeClientServices = useMemo(() => {
    return clientEconomics.services;
  }, [clientEconomics]);

  // Reference service economics
  const referenceService = useMemo(() => {
    return activeClientServices.find(s => s.id === referenceServiceId);
  }, [activeClientServices, referenceServiceId]);

  // Auto-select scenario based on service type
  useEffect(() => {
    if (isAddonService) {
      setScenario('add_addon');
    }
  }, [isAddonService]);

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

  // Calculate delta revenue and internal cost based on scenario
  const { deltaRevenue, deltaInternalCost } = useMemo(() => {
    if (scenario === 'expand_country' || scenario === 'expand_shop') {
      if (!referenceService) return { deltaRevenue: 0, deltaInternalCost: 0 };
      const price = calculateExpansionPrice(referenceService.price, multiplier);
      const cost = calculateExpansionInternalCost(referenceService.internalCost, multiplier);
      return { deltaRevenue: price, deltaInternalCost: cost };
    }
    if (scenario === 'add_addon') {
      return { deltaRevenue: proposedPrice, deltaInternalCost: manualInternalCost };
    }
    // custom_manual
    return { deltaRevenue: proposedPrice, deltaInternalCost: manualInternalCost };
  }, [scenario, referenceService, multiplier, proposedPrice, manualInternalCost]);

  // Update parent price for expansion scenarios
  useEffect(() => {
    if ((scenario === 'expand_country' || scenario === 'expand_shop') && referenceService) {
      onPriceChange(deltaRevenue);
    }
    onInternalCostChange(deltaInternalCost);
  }, [deltaRevenue, deltaInternalCost, scenario, referenceService]);

  // Calculate amendment impact
  const impact: PricingScenarioResult = useMemo(
    () => calculateAmendmentImpact(clientEconomics, deltaRevenue, deltaInternalCost),
    [clientEconomics, deltaRevenue, deltaInternalCost]
  );

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
      multiplier: (scenario === 'expand_country' || scenario === 'expand_shop') ? multiplier : undefined,
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
    };
    onSnapshotChange(snapshot);
  }, [scenario, referenceService, multiplier, deltaRevenue, deltaInternalCost, clientEconomics, impact, justification, requiresNewClient, newClientName, newClientBrand, newClientIco, newClientDic, newClientNote]);

  const isExpansion = scenario === 'expand_country' || scenario === 'expand_shop';
  const defaultMult = getDefaultMultiplier(scenario);

  return (
    <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Dopad na spolupráci</h4>
      </div>

      {/* ===== BLOCK 1: Current State ===== */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Aktuální stav klienta
        </h5>
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
          <div className="rounded-md border overflow-hidden">
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

      {/* ===== BLOCK 2: Proposed Change ===== */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navrhovaná změna
        </h5>

        <div className="space-y-2">
          <Label className="text-xs">Typ scénáře</Label>
          <Select value={scenario} onValueChange={(v) => setScenario(v as PricingScenario)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENARIO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reference service picker for expansion scenarios */}
        {isExpansion && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Referenční služba (základ pro výpočet ceny)</Label>
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
                  <Label className="text-xs">Nová cena položky</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                    {formatCZK(deltaRevenue)}
                  </div>
                </div>
              </div>
            )}

            {referenceService && (
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <p>Ref. cena: {formatCZK(referenceService.price)}</p>
                <p>Ref. interní: {formatCZK(referenceService.internalCost)} → nový: {formatCZK(deltaInternalCost)}</p>
              </div>
            )}
          </>
        )}

        {/* New client (different SRO) option for expand_shop */}
        {scenario === 'expand_shop' && (
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

        {/* Internal cost for addon / custom */}
        {!isExpansion && (
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

        {/* Summary row for proposed change */}
        {deltaRevenue > 0 && (
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
        )}
      </div>

      {/* ===== BLOCK 3: New State After Change ===== */}
      {deltaRevenue > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nový stav po změně
          </h5>

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
