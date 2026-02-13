import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
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

export function ApplicantsTable({ applicants, onApplicantClick }: ApplicantsTableProps) {
  const { colleagues } = useCRMData();

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return '–';
    const owner = colleagues.find(c => c.id === ownerId);
    return owner?.full_name || '–';
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jméno</TableHead>
            <TableHead>Pozice</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead>Zdroj</TableHead>
            <TableHead>Odpovědný</TableHead>
            <TableHead>Přidán</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map(applicant => {
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
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Žádní uchazeči neodpovídají vašim kritériím
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
