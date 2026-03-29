import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Applicant } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_SOURCE_LABELS } from '@/types/applicant';
import { useCRMData } from '@/hooks/useCRMData';
import { cn } from '@/lib/utils';

interface ApplicantsTableProps {
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
}

type SortField = 'full_name' | 'position' | 'email' | 'stage' | 'source' | 'created_at';
type SortDir = 'asc' | 'desc';

export function ApplicantsTable({ applicants, onApplicantClick }: ApplicantsTableProps) {
  const { colleagues } = useCRMData();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return '–';
    const owner = colleagues.find(c => c.id === ownerId);
    return owner?.full_name || '–';
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sorted = useMemo(() => {
    return [...applicants].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'full_name': cmp = a.full_name.localeCompare(b.full_name, 'cs'); break;
        case 'position': cmp = a.position.localeCompare(b.position, 'cs'); break;
        case 'email': cmp = a.email.localeCompare(b.email); break;
        case 'stage': cmp = a.stage.localeCompare(b.stage); break;
        case 'source': cmp = a.source.localeCompare(b.source); break;
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [applicants, sortField, sortDir]);

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
              <span className="flex items-center">Jméno <SortIcon field="full_name" /></span>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('position')}>
              <span className="flex items-center">Pozice <SortIcon field="position" /></span>
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('stage')}>
              <span className="flex items-center">Stav <SortIcon field="stage" /></span>
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('source')}>
              <span className="flex items-center">Zdroj <SortIcon field="source" /></span>
            </TableHead>
            <TableHead>Odpovědný</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
              <span className="flex items-center">Přidán <SortIcon field="created_at" /></span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(applicant => {
            const stageConfig = APPLICANT_STAGE_CONFIG[applicant.stage];
            return (
              <TableRow
                key={applicant.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onApplicantClick(applicant)}
              >
                <TableCell className="font-medium">{applicant.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{applicant.position}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]">
                  {applicant.email}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {applicant.phone || '–'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", stageConfig.color)}>
                    {stageConfig.title}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {APPLICANT_SOURCE_LABELS[applicant.source]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getOwnerName(applicant.owner_id)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(applicant.created_at), 'd. M. yyyy', { locale: cs })}
                </TableCell>
              </TableRow>
            );
          })}
          {applicants.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Žádní uchazeči neodpovídají vašim kritériím
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
