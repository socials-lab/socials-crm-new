import { User, Mail, Phone, FileText, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Applicant } from '@/types/applicant';
import { APPLICANT_SOURCE_LABELS } from '@/types/applicant';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ApplicantCardProps {
  applicant: Applicant;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export function ApplicantCard({ 
  applicant, 
  onClick, 
  onDragStart, 
  onDragEnd,
  isDragging 
}: ApplicantCardProps) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
    >
      <CardContent className="p-3 space-y-2">
        {/* Name and Position */}
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{applicant.full_name}</span>
          </div>
          <p className="text-xs text-muted-foreground pl-6 truncate">{applicant.position}</p>
        </div>

        {/* Contact */}
        <div className="space-y-1">
          {applicant.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{applicant.email}</span>
            </div>
          )}
          {applicant.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{applicant.phone}</span>
            </div>
          )}
        </div>

        {/* Attachments indicator */}
        <div className="flex items-center gap-2">
          {applicant.cv_url && (
            <Badge variant="outline" className="text-xs py-0 px-1.5">
              <FileText className="h-3 w-3 mr-1" />
              CV
            </Badge>
          )}
          {applicant.video_url && (
            <Badge variant="outline" className="text-xs py-0 px-1.5">
              <Video className="h-3 w-3 mr-1" />
              Video
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          <Badge variant="secondary" className="text-xs">
            {APPLICANT_SOURCE_LABELS[applicant.source]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(applicant.created_at), 'd. M.', { locale: cs })}
          </span>
        </div>

        {/* Notes count */}
        {applicant.notes.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {applicant.notes.length} poznámek
          </div>
        )}
      </CardContent>
    </Card>
  );
}
