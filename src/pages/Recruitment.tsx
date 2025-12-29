import { useState, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ApplicantDetailSheet } from '@/components/recruitment/ApplicantDetailSheet';
import { AddApplicantDialog } from '@/components/recruitment/AddApplicantDialog';
import type { Applicant, ApplicantStage } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG } from '@/types/applicant';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'table';

export default function Recruitment() {
  const { applicants, updateApplicantStage } = useApplicantsData();
  const { colleagues } = useCRMData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<ApplicantStage | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);

  const selectedApplicant = selectedApplicantId 
    ? applicants.find(a => a.id === selectedApplicantId) ?? null 
    : null;

  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch = 
        applicant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOwner = ownerFilter === 'all' || applicant.owner_id === ownerFilter;
      const matchesStage = stageFilter === 'all' || applicant.stage === stageFilter;

      return matchesSearch && matchesOwner && matchesStage;
    });
  }, [applicants, searchQuery, ownerFilter, stageFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const activeApplicants = applicants.filter(a => 
      !['hired', 'rejected', 'withdrawn'].includes(a.stage)
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

  // Get the career form URL
  const careerFormUrl = `${window.location.origin}/career`;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🎓 Nábor" 
        titleAccent="kandidátů"
        description="Pipeline uchazečů o práci"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={careerFormUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Kariérní formulář
              </a>
            </Button>
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat jméno, email, pozici..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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

      {/* Main content */}
      {viewMode === 'kanban' ? (
        <ApplicantsKanban 
          applicants={filteredApplicants} 
          onApplicantClick={handleApplicantClick}
          onStageChange={handleStageChange}
        />
      ) : (
        <div className="text-muted-foreground text-center py-12">
          Tabulkové zobrazení bude brzy dostupné
        </div>
      )}

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
