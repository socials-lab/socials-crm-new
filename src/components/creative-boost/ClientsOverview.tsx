import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useCRMData } from '@/hooks/useCRMData';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, ChevronDown, ChevronUp, Palette, Zap, MoreVertical, Settings, ExternalLink, History, Image, Video, Share2, Check, Copy } from 'lucide-react';
import { SettingsHistoryDialog } from './SettingsHistoryDialog';
import { saveCreativeBoostShare } from '@/pages/PublicCreativeBoostPage';
import type { MonthStatus, ClientMonthOutput, OutputCategory } from '@/types/creativeBoost';
import { cn } from '@/lib/utils';

// Category colors for output types
const categoryColors: Record<OutputCategory, string> = {
  banner: 'bg-blue-100 text-blue-700 border-blue-200',
  banner_translation: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  banner_revision: 'bg-blue-50 text-blue-600 border-blue-100',
  video: 'bg-purple-100 text-purple-700 border-purple-200',
  video_translation: 'bg-violet-100 text-violet-700 border-violet-200',
};

// Category grouping
const categoryGroups = {
  banner_group: ['banner', 'banner_translation', 'banner_revision'] as OutputCategory[],
  video_group: ['video', 'video_translation'] as OutputCategory[],
};

interface ClientsOverviewProps {
  year: number;
  month: number;
}

const statusLabels: Record<MonthStatus, string> = {
  active: 'Aktivní',
  inactive: 'Neaktivní',
};

const statusColors: Record<MonthStatus, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function ClientsOverview({ year, month }: ClientsOverviewProps) {
  const navigate = useNavigate();
  const { 
    getClientMonthSummaries, 
    getActiveOutputTypes, 
    getClientOutputs,
    updateClientOutput,
    clientMonths,
    updateClientMonth,
    calculateOutputCredits,
    getSettingsHistory,
    ensureClientMonthsForActiveEngagements,
  } = useCreativeBoostData();
  const { colleagues, engagements, getClientById } = useCRMData();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MonthStatus | 'all'>('all');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [settingsDialogClient, setSettingsDialogClient] = useState<string | null>(null);
  const [historyDialogClient, setHistoryDialogClient] = useState<string | null>(null);
  const [shareDialogUrl, setShareDialogUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Auto-sync: Ensure Creative Boost records exist for all active engagements
  useEffect(() => {
    ensureClientMonthsForActiveEngagements(year, month);
  }, [year, month, ensureClientMonthsForActiveEngagements]);

  const summaries = useMemo(() => {
    // Only show clients with linked engagements
    return getClientMonthSummaries(year, month).filter(s => {
      const monthData = clientMonths.find(cm => cm.clientId === s.clientId && cm.year === year && cm.month === month);
      return monthData?.engagementId != null;
    });
  }, [getClientMonthSummaries, year, month, clientMonths]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const matchesSearch = search === '' ||
        s.clientName.toLowerCase().includes(search.toLowerCase()) ||
        s.brandName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [summaries, search, statusFilter]);

  const activeOutputTypes = useMemo(() => getActiveOutputTypes(), [getActiveOutputTypes]);
  
  // Group active output types by category
  const groupedActiveOutputTypes = useMemo(() => {
    const bannerTypes = activeOutputTypes.filter(t => categoryGroups.banner_group.includes(t.category));
    const videoTypes = activeOutputTypes.filter(t => categoryGroups.video_group.includes(t.category));
    return { bannerTypes, videoTypes };
  }, [activeOutputTypes]);
  
  const designerColleagues = useMemo(() => {
    return colleagues.filter(c => c.status === 'active');
  }, [colleagues]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const handleOutputChange = (
    clientId: string, 
    outputTypeId: string, 
    field: keyof Pick<ClientMonthOutput, 'normalCount' | 'expressCount' | 'colleagueId'>,
    value: number | string
  ) => {
    const currentOutputs = getClientOutputs(clientId, year, month);
    const existing = currentOutputs.find(o => o.outputTypeId === outputTypeId);
    
    const updateData: Partial<ClientMonthOutput> = {
      normalCount: existing?.normalCount ?? 0,
      expressCount: existing?.expressCount ?? 0,
      colleagueId: existing?.colleagueId ?? '',
    };
    
    if (field === 'normalCount' || field === 'expressCount') {
      updateData[field] = Math.max(0, value as number);
    } else {
      updateData[field] = value as string;
    }
    
    updateClientOutput(clientId, outputTypeId, year, month, updateData);
  };

  const handleSettingsChange = (clientId: string, field: 'maxCredits' | 'pricePerCredit' | 'status' | 'colleagueId' | 'invoiceAmount' | 'invoiceNote', value: number | MonthStatus | string | null) => {
    const monthData = clientMonths.find(cm => cm.clientId === clientId && cm.year === year && cm.month === month);
    if (monthData) {
      updateClientMonth(monthData.id, { [field]: value });
    }
  };

  const getSettingsDialogData = () => {
    if (!settingsDialogClient) return null;
    const monthData = clientMonths.find(cm => cm.clientId === settingsDialogClient && cm.year === year && cm.month === month);
    const summary = summaries.find(s => s.clientId === settingsDialogClient);
    return { monthData, summary };
  };

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Palette className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Žádní klienti v tomto měsíci</h3>
          <p className="text-muted-foreground text-center">
            Přidejte klienta pomocí tlačítka "Přidat klienta" výše.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat klienta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MonthStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtr statusu" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Všechny statusy</SelectItem>
            <SelectItem value="active">Aktivní</SelectItem>
            <SelectItem value="inactive">Neaktivní</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compact Client Cards */}
      <div className="space-y-2">
        {filteredSummaries.map((summary) => {
          const isExpanded = expandedClients.has(summary.clientId);
          const usagePercent = summary.maxCredits > 0 
            ? (summary.usedCredits / summary.maxCredits) * 100 
            : 0;
          const isOverMax = summary.usedCredits > summary.maxCredits;
          const clientOutputs = getClientOutputs(summary.clientId, year, month);
          const monthData = clientMonths.find(cm => cm.clientId === summary.clientId && cm.year === year && cm.month === month);
          const assignedColleague = monthData?.colleagueId 
            ? designerColleagues.find(c => c.id === monthData.colleagueId)
            : null;
          const linkedEngagement = monthData?.engagementId 
            ? engagements.find(e => e.id === monthData.engagementId)
            : null;

          return (
            <Collapsible key={summary.clientId} open={isExpanded} onOpenChange={() => toggleExpand(summary.clientId)}>
              <Card className="overflow-hidden">
                {/* Compact Header */}
                <div className="flex items-center gap-3 p-3">
                  {/* Avatar */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {summary.brandName.charAt(0)}
                  </div>

                  {/* Main info - clickable to expand */}
                  <CollapsibleTrigger asChild>
                    <div className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{summary.brandName}</span>
                          {assignedColleague && (
                            <Badge variant="secondary" className="text-xs h-5 px-1.5">
                              {assignedColleague.full_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients?highlight=${summary.clientId}`);
                            }}
                            className="text-primary hover:underline"
                          >
                            {summary.clientName}
                          </button>
                          {linkedEngagement && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/engagements?highlight=${linkedEngagement.id}`);
                                }}
                                className="text-muted-foreground hover:text-foreground hover:underline flex items-center gap-0.5"
                              >
                                Zakázka
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Credits progress - inline */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-sm min-w-[60px] justify-end">
                      <span className={cn("font-medium", isOverMax && "text-destructive")}>
                        {summary.usedCredits}
                      </span>
                      <span className="text-muted-foreground">/{summary.maxCredits}</span>
                    </div>
                    <Progress 
                      value={Math.min(usagePercent, 100)} 
                      className={cn("h-1.5 w-16", isOverMax && "[&>div]:bg-destructive")}
                    />
                  </div>

                  {/* Invoice estimate */}
                  <div className="text-right shrink-0 min-w-[80px] hidden md:block">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-sm">{formatCurrency(summary.finalInvoiceAmount)}</span>
                      {summary.customInvoiceAmount && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(summary.packageInvoice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge variant="outline" className={cn("text-xs h-6 shrink-0", statusColors[summary.status])}>
                    {statusLabels[summary.status]}
                  </Badge>


                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover w-48">
                      <DropdownMenuItem onClick={() => setSettingsDialogClient(summary.clientId)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Nastavení
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setHistoryDialogClient(summary.clientId)}>
                        <History className="h-4 w-4 mr-2" />
                        Historie změn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const token = crypto.randomUUID();
                        const outputs = getClientOutputs(summary.clientId, year, month)
                          .filter(o => o.normalCount > 0 || o.expressCount > 0)
                          .map(o => {
                            const ot = activeOutputTypes.find(t => t.id === o.outputTypeId);
                            const creds = calculateOutputCredits(o.outputTypeId, o.normalCount, o.expressCount);
                            return {
                              typeName: ot?.name ?? o.outputTypeId,
                              category: ot?.category ?? 'banner',
                              normalCount: o.normalCount,
                              expressCount: o.expressCount,
                              credits: creds.totalCredits,
                            };
                          });
                        saveCreativeBoostShare({
                          token,
                          clientId: summary.clientId,
                          clientName: summary.clientName,
                          brandName: summary.brandName,
                          year,
                          month,
                          maxCredits: summary.maxCredits,
                          usedCredits: summary.usedCredits,
                          pricePerCredit: summary.pricePerCredit,
                          outputs,
                          createdAt: new Date().toISOString(),
                        });
                        const url = `${window.location.origin}/creative-boost-share/${token}`;
                        setShareDialogUrl(url);
                        setShareCopied(false);
                      }}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Sdílet s klientem
                      </DropdownMenuItem>
                      {linkedEngagement && (
                        <DropdownMenuItem onClick={() => navigate(`/engagements?highlight=${linkedEngagement.id}`)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Upravit v zakázce
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Expand/collapse button */}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                {/* Expanded content - only spreadsheet */}
                <CollapsibleContent>
                  <CardContent className="border-t bg-muted/30 pt-4 pb-4">
                    {/* Spreadsheet Table */}
                    <div className="rounded-lg border bg-background overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Typ výstupu</TableHead>
                            <TableHead className="text-center w-[70px]">Kredity</TableHead>
                            <TableHead className="text-center w-[80px]">Klasické</TableHead>
                            <TableHead className="text-center w-[80px]">
                              <div className="flex items-center justify-center gap-1">
                                <Zap className="h-3 w-3 text-amber-600" />
                                Express
                              </div>
                            </TableHead>
                            <TableHead className="text-center w-[70px]">Celkem</TableHead>
                            <TableHead className="w-[150px]">Grafik / Video editor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Banner section */}
                          <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
                            <TableCell colSpan={6} className="py-1.5">
                              <div className="flex items-center gap-1.5 font-semibold text-blue-700 text-xs">
                                <Image className="h-3.5 w-3.5" />
                                BANNERY
                              </div>
                            </TableCell>
                          </TableRow>
                          {groupedActiveOutputTypes.bannerTypes.map((outputType) => {
                            const output = clientOutputs.find(o => o.outputTypeId === outputType.id);
                            const normalCount = output?.normalCount ?? 0;
                            const expressCount = output?.expressCount ?? 0;
                            const totalCount = normalCount + expressCount;
                            const credits = calculateOutputCredits(outputType.id, normalCount, expressCount);
                            
                            return (
                              <TableRow key={outputType.id} className={cn(totalCount > 0 && 'bg-blue-50/30')}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[outputType.category])}>
                                      {outputType.baseCredits}
                                    </Badge>
                                    <span className="text-sm">{outputType.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">{outputType.baseCredits}</TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={normalCount}
                                    onChange={(e) => handleOutputChange(summary.clientId, outputType.id, 'normalCount', parseInt(e.target.value) || 0)}
                                    className="w-16 h-8 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={expressCount}
                                    onChange={(e) => handleOutputChange(summary.clientId, outputType.id, 'expressCount', parseInt(e.target.value) || 0)}
                                    className="w-16 h-8 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {credits.totalCredits > 0 ? (
                                    <span className={expressCount > 0 ? 'text-amber-600' : 'text-blue-600'}>
                                      {credits.totalCredits}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {totalCount > 0 && (
                                    <Select
                                      value={output?.colleagueId || ''}
                                      onValueChange={(val) => handleOutputChange(summary.clientId, outputType.id, 'colleagueId', val)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Vybrat..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-popover">
                                        {designerColleagues.map((c) => (
                                          <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Video section */}
                          <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                            <TableCell colSpan={6} className="py-1.5">
                              <div className="flex items-center gap-1.5 font-semibold text-purple-700 text-xs">
                                <Video className="h-3.5 w-3.5" />
                                VIDEA
                              </div>
                            </TableCell>
                          </TableRow>
                          {groupedActiveOutputTypes.videoTypes.map((outputType) => {
                            const output = clientOutputs.find(o => o.outputTypeId === outputType.id);
                            const normalCount = output?.normalCount ?? 0;
                            const expressCount = output?.expressCount ?? 0;
                            const totalCount = normalCount + expressCount;
                            const credits = calculateOutputCredits(outputType.id, normalCount, expressCount);
                            
                            return (
                              <TableRow key={outputType.id} className={cn(totalCount > 0 && 'bg-purple-50/30')}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[outputType.category])}>
                                      {outputType.baseCredits}
                                    </Badge>
                                    <span className="text-sm">{outputType.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">{outputType.baseCredits}</TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={normalCount}
                                    onChange={(e) => handleOutputChange(summary.clientId, outputType.id, 'normalCount', parseInt(e.target.value) || 0)}
                                    className="w-16 h-8 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={expressCount}
                                    onChange={(e) => handleOutputChange(summary.clientId, outputType.id, 'expressCount', parseInt(e.target.value) || 0)}
                                    className="w-16 h-8 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {credits.totalCredits > 0 ? (
                                    <span className={expressCount > 0 ? 'text-amber-600' : 'text-purple-600'}>
                                      {credits.totalCredits}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {totalCount > 0 && (
                                    <Select
                                      value={output?.colleagueId || ''}
                                      onValueChange={(val) => handleOutputChange(summary.clientId, outputType.id, 'colleagueId', val)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Vybrat..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-popover">
                                        {designerColleagues.map((c) => (
                                          <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Summary row */}
                    <div className="mt-3 p-2.5 rounded-lg bg-background border space-y-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Normální:</span>
                            <span className="ml-1.5 font-medium">{summary.normalCredits}</span>
                          </div>
                          <div className="flex items-center">
                            <Zap className="h-3 w-3 mr-1 text-amber-600" />
                            <span className="text-muted-foreground">Express:</span>
                            <span className="ml-1.5 font-medium text-amber-600">{summary.expressCredits}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Celkem:</span>
                            <span className={cn("ml-1.5 font-semibold", isOverMax && "text-destructive")}>
                              {summary.usedCredits}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Odhad fakturace:</span>
                          <span className="ml-1.5 font-semibold">{formatCurrency(summary.estimatedInvoice)}</span>
                        </div>
                      </div>
                      
                      {/* Inline settings */}
                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Max. kreditů:</span>
                          <Input
                            type="number"
                            min="0"
                            value={monthData?.maxCredits ?? 0}
                            onChange={(e) => handleSettingsChange(summary.clientId, 'maxCredits', parseInt(e.target.value) || 0)}
                            className="w-20 h-7 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Cena/kredit:</span>
                          <Input
                            type="number"
                            min="0"
                            value={monthData?.pricePerCredit ?? 0}
                            onChange={(e) => handleSettingsChange(summary.clientId, 'pricePerCredit', parseInt(e.target.value) || 0)}
                            className="w-24 h-7 text-center"
                          />
                          <span className="text-muted-foreground">Kč</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Settings Dialog */}
      <Dialog open={!!settingsDialogClient} onOpenChange={(open) => !open && setSettingsDialogClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nastavení měsíce</DialogTitle>
          </DialogHeader>
          {(() => {
            const data = getSettingsDialogData();
            if (!data?.monthData || !data?.summary) return null;
            const { monthData, summary } = data;
            const linkedEngagement = monthData.engagementId 
              ? engagements.find(e => e.id === monthData.engagementId)
              : null;

            return (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Max. kreditů</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={monthData.maxCredits}
                      onChange={(e) => handleSettingsChange(summary.clientId, 'maxCredits', parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">kreditů</span>
                  </div>
                  {linkedEngagement && (
                    <p className="text-xs text-muted-foreground">
                      Nastavení lze upravit také v{' '}
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setSettingsDialogClient(null);
                          navigate(`/engagements?highlight=${linkedEngagement.id}`);
                        }}
                      >
                        zakázce
                      </Button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cena za kredit</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={monthData.pricePerCredit}
                      onChange={(e) => handleSettingsChange(summary.clientId, 'pricePerCredit', parseInt(e.target.value) || 0)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">Kč</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={monthData.status}
                    onValueChange={(v) => handleSettingsChange(summary.clientId, 'status', v as MonthStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="active">Aktivní</SelectItem>
                      <SelectItem value="inactive">Neaktivní</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Přiřazený kolega</Label>
                  <Select
                    value={monthData.colleagueId || ''}
                    onValueChange={(v) => handleSettingsChange(summary.clientId, 'colleagueId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vybrat kolegu..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {designerColleagues.map((colleague) => (
                        <SelectItem key={colleague.id} value={colleague.id}>
                          {colleague.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fakturovaná částka</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={monthData.invoiceAmount ?? ''}
                      placeholder={(monthData.maxCredits * monthData.pricePerCredit).toString()}
                      onChange={(e) => handleSettingsChange(
                        summary.clientId, 
                        'invoiceAmount', 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">Kč</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Balíček: {formatCurrency(summary.packageInvoice)} • Ponechte prázdné pro fakturaci balíčku
                  </p>
                </div>

                <div className="pt-2 border-t flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Zbývá:</span>
                    <span className={cn("ml-1.5 font-medium", summary.remainingCredits < 0 && "text-destructive")}>
                      {summary.remainingCredits} kreditů
                    </span>
                  </div>
                  <Button variant="outline" onClick={() => setSettingsDialogClient(null)}>
                    Zavřít
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Settings History Dialog */}
      <SettingsHistoryDialog
        open={!!historyDialogClient}
        onOpenChange={(open) => !open && setHistoryDialogClient(null)}
        clientName={historyDialogClient ? (summaries.find(s => s.clientId === historyDialogClient)?.brandName ?? '') : ''}
        history={historyDialogClient ? getSettingsHistory(historyDialogClient, year, month) : []}
      />

      {/* Share Dialog */}
      <Dialog open={!!shareDialogUrl} onOpenChange={(open) => !open && setShareDialogUrl(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sdílet přehled s klientem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Zkopírujte odkaz a pošlete ho klientovi. Klient uvidí aktuální stav čerpání kreditů bez nutnosti přihlášení.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareDialogUrl ?? ''}
                className="text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  if (shareDialogUrl) {
                    navigator.clipboard.writeText(shareDialogUrl);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }
                }}
              >
                {shareCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
