import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ChevronUp, Mail, Pencil, Zap, Sparkles, Briefcase, 
  Check, X, ExternalLink, Shield, Phone, Cake, Building, CreditCard,
  MapPin, User, BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Separator } from '@/components/ui/separator';
import type { Colleague, Seniority, EngagementAssignment, Engagement, Client } from '@/types/crm';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const seniorityColors: Record<Seniority, string> = {
  junior: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  mid: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  senior: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  partner: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
};

const seniorityLabels: Record<Seniority, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  partner: 'Partner',
};

interface ColleagueCardProps {
  colleague: Colleague;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: (colleague: Colleague) => void;
  isSuperAdmin: boolean;
  canSeeFinancials: boolean;
  highlighted?: boolean;
  details: {
    assignmentCount: number;
    totalMonthlyEarnings: number;
    clientData: Array<{
      client: Client;
      engagement: Engagement;
      assignment: EngagementAssignment;
    }>;
  };
  monthCredits: number;
  yearCredits: number;
  creditsDetail: Array<{
    clientName: string;
    outputTypeName: string;
    totalCredits: number;
    expressCount: number;
  }>;
  onUpdateAssignment?: (assignmentId: string, data: { monthly_cost: number }) => void;
}

export function ColleagueCard({
  colleague,
  isExpanded,
  onToggleExpand,
  onEdit,
  isSuperAdmin,
  canSeeFinancials,
  highlighted,
  details,
  monthCredits,
  yearCredits,
  creditsDetail,
  onUpdateAssignment,
}: ColleagueCardProps) {
  const navigate = useNavigate();
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<string>('');

  const handleSaveAssignmentCost = (assignmentId: string) => {
    const cost = parseFloat(tempCost) || 0;
    onUpdateAssignment?.(assignmentId, { monthly_cost: cost });
    setEditingAssignmentId(null);
  };

  const formatBirthday = (birthday: string) => {
    const date = new Date(birthday);
    return format(date, 'd. MMMM', { locale: cs });
  };

  const hasPersonalInfo = colleague.ico || colleague.personal_email || colleague.bank_account || colleague.company_name;

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all",
        highlighted && "ring-2 ring-primary"
      )}
    >
      {/* Collapsed Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            {colleague.avatar_url ? (
              <AvatarImage src={colleague.avatar_url} alt={colleague.full_name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {colleague.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base">{colleague.full_name}</span>
              {isSuperAdmin && colleague.profile_id && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-status-active/10 text-status-active border-status-active/20"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  CRM
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{colleague.position}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Badge variant="outline" className={cn("text-xs", seniorityColors[colleague.seniority])}>
              {seniorityLabels[colleague.seniority]}
            </Badge>
            {monthCredits > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Kredity
                </p>
                <p className="text-sm font-medium">{monthCredits}</p>
              </div>
            )}
            {isSuperAdmin && (
              <div className="text-right min-w-[100px]">
                <p className="text-xs text-muted-foreground">Měs. odměna</p>
                <p className="text-sm font-bold text-primary">{details.totalMonthlyEarnings.toLocaleString()} Kč</p>
              </div>
            )}
          </div>
          <StatusBadge status={colleague.status} />
          {isSuperAdmin && onEdit && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit(colleague); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="border-t bg-gradient-to-b from-muted/50 to-background pt-6 pb-6">
          <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
            
            {/* 1. Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <User className="h-4 w-4 text-primary" />
                Kontaktní údaje
              </h4>
              <div className="space-y-3 text-sm">
                <a 
                  href={`mailto:${colleague.email}`} 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{colleague.email}</span>
                </a>
                {colleague.phone && (
                  <a 
                    href={`tel:${colleague.phone}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {colleague.phone}
                  </a>
                )}
                {colleague.birthday && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cake className="h-4 w-4" />
                    <span>{formatBirthday(colleague.birthday)}</span>
                  </div>
                )}
                {colleague.personal_email && isSuperAdmin && (
                  <a 
                    href={`mailto:${colleague.personal_email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 opacity-50" />
                    <span className="truncate text-xs">{colleague.personal_email}</span>
                  </a>
                )}
              </div>
            </div>

            {/* 2. Billing Info - Admin Only */}
            {isSuperAdmin && hasPersonalInfo && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Building className="h-4 w-4 text-primary" />
                  Fakturační údaje
                </h4>
                <div className="space-y-3 text-sm">
                  {colleague.company_name && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Building className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{colleague.company_name}</span>
                    </div>
                  )}
                  {colleague.ico && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        IČO: {colleague.ico}
                      </span>
                      {colleague.dic && (
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          DIČ: {colleague.dic}
                        </span>
                      )}
                    </div>
                  )}
                  {(colleague.billing_street || colleague.billing_city) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="text-xs">
                        {[colleague.billing_street, colleague.billing_zip, colleague.billing_city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {colleague.bank_account && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span className="font-mono text-xs">{colleague.bank_account}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Workload & Earnings - Admin Only */}
            {isSuperAdmin && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Vytížení & Odměny
                </h4>
                <div className="space-y-3">
                  {/* Workload Progress */}
                  <div className="p-3 rounded-lg bg-background border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Vytížení</p>
                      <p className="text-sm font-medium">
                        {details.assignmentCount} / {colleague.max_engagements ?? 5}
                      </p>
                    </div>
                    <Progress 
                      value={(details.assignmentCount / (colleague.max_engagements ?? 5)) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Monthly Earnings */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground">Měsíční odměna</p>
                    <p className="text-xl font-bold text-primary">
                      {details.totalMonthlyEarnings.toLocaleString()} Kč
                    </p>
                  </div>

                  {/* Hourly Rate */}
                  {canSeeFinancials && (
                    <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">Sazba (vícepráce)</span>
                      <span className="font-medium">{colleague.internal_hourly_cost.toLocaleString()} Kč/h</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Creative Boost Credits */}
            {(monthCredits > 0 || yearCredits > 0) && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Creative Boost
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-background border text-center">
                      <p className="text-xs text-muted-foreground">Tento měsíc</p>
                      <p className="text-lg font-bold">{monthCredits}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border text-center">
                      <p className="text-xs text-muted-foreground">Celkem za rok</p>
                      <p className="text-lg font-bold">{yearCredits}</p>
                    </div>
                  </div>
                  {creditsDetail.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Rozpis:</p>
                      {creditsDetail.slice(0, 3).map((detail, idx) => (
                        <div key={idx} className="text-xs flex justify-between p-2 rounded bg-muted/50">
                          <span className="truncate flex-1">{detail.clientName}</span>
                          <span className="font-medium flex items-center gap-1">
                            {detail.expressCount > 0 && <Zap className="h-3 w-3 text-amber-500" />}
                            {detail.totalCredits}
                          </span>
                        </div>
                      ))}
                      {creditsDetail.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{creditsDetail.length - 3} dalších
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Engagements - Super Admin */}
          {isSuperAdmin && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Přiřazené zakázky ({details.assignmentCount})
                </h4>
                
                {details.clientData.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {details.clientData.map(({ client, engagement, assignment }) => (
                      <div 
                        key={assignment.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-muted-foreground/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                            {client.brand_name?.charAt(0) || client.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/engagements?highlight=${engagement.id}`);
                              }}
                              className="font-medium text-sm text-primary hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{engagement.name}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </button>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.brand_name || client.name} • {assignment.role_on_engagement}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {editingAssignmentId === assignment.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="number"
                                value={tempCost}
                                onChange={(e) => setTempCost(e.target.value)}
                                className="h-7 w-20 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveAssignmentCost(assignment.id);
                                  if (e.key === 'Escape') setEditingAssignmentId(null);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-status-active"
                                onClick={() => handleSaveAssignmentCost(assignment.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingAssignmentId(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAssignmentId(assignment.id);
                                setTempCost(String(assignment.monthly_cost || 0));
                              }}
                              className="text-xs font-medium px-2 py-1 rounded hover:bg-muted transition-colors group flex items-center gap-1"
                            >
                              <span>{(assignment.monthly_cost || 0).toLocaleString()} Kč</span>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-lg border border-dashed text-center text-muted-foreground text-sm">
                    Žádné přiřazené zakázky
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
