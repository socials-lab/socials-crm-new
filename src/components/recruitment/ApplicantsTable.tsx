import { ExternalLink, FileText, Video } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCRMData } from '@/hooks/useCRMData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Applicant, ApplicantStage, ApplicantSource } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_SOURCE_LABELS } from '@/types/applicant';

interface ApplicantsTableProps {
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
}

const STAGE_COLORS: Record<ApplicantStage, string> = {
  new_applicant: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  invited_interview: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  interview_done: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  offer_sent: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  hired: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/30',
  withdrawn: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
};

export function ApplicantsTable({ applicants, onApplicantClick }: ApplicantsTableProps) {
  const { colleagues } = useCRMData();
  const isMobile = useIsMobile();

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return '-';
    const owner = colleagues.find(c => c.id === ownerId);
    return owner?.full_name || 'Neznámý';
  };

  // Mobile view: Card stack
  if (isMobile) {
    return (
      <div className="space-y-3">
        {applicants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Žádní uchazeči neodpovídají vašim kritériím
          </div>
        ) : (
          applicants.map(applicant => (
            <div
              key={applicant.id}
              className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onApplicantClick(applicant)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{applicant.full_name}</p>
                  <p className="text-sm text-muted-foreground">{applicant.position}</p>
                </div>
                <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[applicant.stage])}>
                  {APPLICANT_STAGE_CONFIG[applicant.stage].title}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{applicant.email}</span>
                {applicant.phone && <span>{applicant.phone}</span>}
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge variant="secondary">{APPLICANT_SOURCE_LABELS[applicant.source]}</Badge>
                <span className="text-muted-foreground">
                  {new Date(applicant.created_at).toLocaleDateString('cs-CZ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop view: Table
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jméno</TableHead>
            <TableHead>Pozice</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead>Odpovědná osoba</TableHead>
            <TableHead>Zdroj</TableHead>
            <TableHead>Přílohy</TableHead>
            <TableHead>Přidáno</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map(applicant => (
            <TableRow
              key={applicant.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onApplicantClick(applicant)}
            >
              <TableCell className="font-medium">
                <div>
                  {applicant.full_name}
                  {applicant.phone && (
                    <span className="text-muted-foreground text-xs block">
                      {applicant.phone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{applicant.position}</TableCell>
              <TableCell className="text-muted-foreground">
                <div className="truncate max-w-[200px]">{applicant.email}</div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("text-xs", STAGE_COLORS[applicant.stage])}
                >
                  {APPLICANT_STAGE_CONFIG[applicant.stage].title}
                </Badge>
              </TableCell>
              <TableCell>{getOwnerName(applicant.owner_id)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {APPLICANT_SOURCE_LABELS[applicant.source]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {applicant.cv_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="CV"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(applicant.cv_url!, '_blank');
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {applicant.video_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Video"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(applicant.video_url!, '_blank');
                      }}
                    >
                      <Video className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!applicant.cv_url && !applicant.video_url && (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(applicant.created_at).toLocaleDateString('cs-CZ')}
              </TableCell>
            </TableRow>
          ))}
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
