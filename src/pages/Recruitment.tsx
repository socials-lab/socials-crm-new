import { useState, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, X, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useCRMData } from '@/hooks/useCRMData';
import { ApplicantsKanban } from '@/components/recruitment/ApplicantsKanban';
import { ApplicantsTable } from '@/components/recruitment/ApplicantsTable';
import { ApplicantDetailSheet } from '@/components/recruitment/ApplicantDetailSheet';
import { AddApplicantDialog } from '@/components/recruitment/AddApplicantDialog';
import type { Applicant, ApplicantStage, ApplicantSource } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_SOURCE_LABELS } from '@/types/applicant';

type ViewMode = 'kanban' | 'table';

export default function Recruitment() {
  const { applicants, updateApplicantStage, updateApplicant } = useApplicantsData();
  const { colleagues } = useCRMData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<ApplicantStage | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<ApplicantSource | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  

  const selectedApplicant = selectedApplicantId 
    ? applicants.find(a => a.id === selectedApplicantId) ?? null 
    : null;

  // Unique positions for filter
  const positions = useMemo(() => {
    const posSet = new Set(applicants.map(a => a.position));
    return Array.from(posSet).sort();
  }, [applicants]);

  // Split applicants into pipeline (active) and hired
  const pipelineApplicants = useMemo(() => 
    applicants.filter(a => !['hired', 'bad_fit', 'withdrawn'].includes(a.stage) || (a.stage === 'hired' && !a.converted_to_colleague_id)),
    [applicants]
  );

  const hiredApplicants = useMemo(() =>
    applicants.filter(a => a.stage === 'hired' || a.converted_to_colleague_id),
    [applicants]
  );

  const hasActiveFilters = searchQuery || ownerFilter !== 'all' || stageFilter !== 'all' || positionFilter !== 'all' || sourceFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setOwnerFilter('all');
    setStageFilter('all');
    setPositionFilter('all');
    setSourceFilter('all');
  };

  const filteredApplicants = useMemo(() => {
    const source = activeTab === 'hired' ? hiredApplicants : pipelineApplicants;
    return source.filter(applicant => {
      const matchesSearch = !searchQuery || 
        applicant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (applicant.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOwner = ownerFilter === 'all' || applicant.owner_id === ownerFilter;
      const matchesStage = stageFilter === 'all' || applicant.stage === stageFilter;
      const matchesPosition = positionFilter === 'all' || applicant.position === positionFilter;
      const matchesSource = sourceFilter === 'all' || applicant.source === sourceFilter;

      return matchesSearch && matchesOwner && matchesStage && matchesPosition && matchesSource;
    });
  }, [pipelineApplicants, hiredApplicants, activeTab, searchQuery, ownerFilter, stageFilter, positionFilter, sourceFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const activeApplicants = applicants.filter(a => 
      !['hired', 'bad_fit', 'withdrawn'].includes(a.stage)
    );
    const hiredThisMonth = applicants.filter(a => {
      if (a.stage !== 'hired') return false;
      const updatedAt = new Date(a.updated_at);
      const now = new Date();
      return updatedAt.getMonth() === now.getMonth() && 
             updatedAt.getFullYear() === now.getFullYear();
    }).length;
    const newThisWeek = applicants.filter(a => {
      const createdAt = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt >= weekAgo;
    }).length;

    return {
      total: applicants.length,
      active: activeApplicants.length,
      hiredThisMonth,
      newThisWeek,
    };
  }, [applicants]);

  const handleApplicantClick = (applicant: Applicant) => {
    setSelectedApplicantId(applicant.id);
    setIsDetailOpen(true);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    setEditingApplicant(applicant);
    setIsAddDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingApplicant(null);
    setIsAddDialogOpen(true);
  };

  const handleStageChange = (applicantId: string, newStage: ApplicantStage) => {
    updateApplicantStage(applicantId, newStage);
  };

  const owners = useMemo(() => {
    const ownerIds = [...new Set(applicants.map(a => a.owner_id).filter(Boolean))];
    return ownerIds.map(id => colleagues.find(c => c.id === id)).filter(Boolean);
  }, [applicants, colleagues]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🎓 Nábor" 
        titleAccent="kandidátů"
        description="Pipeline uchazečů o práci"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button className="gap-2" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Přidat uchazeče
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Celkem uchazečů"
          value={kpis.total}
          subtitle="v databázi"
        />
        <KPICard
          title="V pipeline"
          value={kpis.active}
          subtitle="aktivních"
        />
        <KPICard
          title="Přijato tento měsíc"
          value={kpis.hiredThisMonth}
          subtitle="nových kolegů"
        />
        <KPICard
          title="Nové tento týden"
          value={kpis.newThisWeek}
          subtitle="přihlášek"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hledat jméno, email, pozici, telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pozice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny pozice</SelectItem>
              {positions.map(pos => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Odpovědná osoba" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni</SelectItem>
              {owners.map(owner => (
                <SelectItem key={owner!.id} value={owner!.id}>
                  {owner!.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as ApplicantSource | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Zdroj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny zdroje</SelectItem>
              {Object.entries(APPLICANT_SOURCE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as ApplicantStage | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stav" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny stavy</SelectItem>
              {Object.entries(APPLICANT_STAGE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Zobrazeno <span className="font-semibold text-foreground">{filteredApplicants.length}</span> z {activeTab === 'hired' ? hiredApplicants.length : pipelineApplicants.length} uchazečů
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={clearAllFilters}>
              <X className="h-3 w-3" />
              Zrušit filtry
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {viewMode === 'kanban' ? (
          <ApplicantsKanban 
            applicants={filteredApplicants} 
            onApplicantClick={handleApplicantClick}
            onStageChange={handleStageChange}
            onUpdateApplicant={updateApplicant}
          />
        ) : (
          <ApplicantsTable
            applicants={filteredApplicants}
            onApplicantClick={handleApplicantClick}
          />
        )}
      </div>

      {/* Detail Sheet */}
      <ApplicantDetailSheet
        applicant={selectedApplicant}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditApplicant}
      />

      {/* Add/Edit Dialog */}
      <AddApplicantDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        applicant={editingApplicant}
      />
    </div>
  );
}
