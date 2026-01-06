import { useState } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useToast } from '@/hooks/use-toast';
import type { MeetingParticipant, ParticipantRole, AttendanceStatus } from '@/types/meetings';
import type { Colleague } from '@/types/crm';

interface MeetingParticipantsProps {
  meetingId: string;
  participants: MeetingParticipant[];
  colleagues: Colleague[];
}

const ROLE_LABELS: Record<ParticipantRole, string> = {
  organizer: 'Organizátor',
  required: 'Povinný',
  optional: 'Volitelný',
};

const ATTENDANCE_CONFIG: Record<AttendanceStatus, { label: string; color: string }> = {
  pending: { label: 'Čeká', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  confirmed: { label: 'Potvrzeno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  declined: { label: 'Odmítnuto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  attended: { label: 'Zúčastnil se', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
};

export function MeetingParticipants({ meetingId, participants, colleagues }: MeetingParticipantsProps) {
  const { addParticipant, removeParticipant, updateParticipant } = useMeetingsData();
  const { toast } = useToast();
  
  const [isAddingInternal, setIsAddingInternal] = useState(false);
  const [isAddingExternal, setIsAddingExternal] = useState(false);
  const [selectedColleagueId, setSelectedColleagueId] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  const participantColleagueIds = participants
    .filter(p => p.colleague_id)
    .map(p => p.colleague_id);

  const availableColleagues = colleagues.filter(
    c => c.status === 'active' && !participantColleagueIds.includes(c.id)
  );

  const handleAddInternal = async () => {
    if (!selectedColleagueId) return;
    try {
      await addParticipant({
        meeting_id: meetingId,
        colleague_id: selectedColleagueId,
        external_name: null,
        external_email: null,
        role: 'required',
        attendance: 'pending',
      });
      setSelectedColleagueId('');
      setIsAddingInternal(false);
      toast({ title: 'Účastník přidán' });
    } catch (error) {
      toast({ title: 'Chyba při přidávání', variant: 'destructive' });
    }
  };

  const handleAddExternal = async () => {
    if (!externalName) return;
    try {
      await addParticipant({
        meeting_id: meetingId,
        colleague_id: null,
        external_name: externalName,
        external_email: externalEmail || null,
        role: 'required',
        attendance: 'pending',
      });
      setExternalName('');
      setExternalEmail('');
      setIsAddingExternal(false);
      toast({ title: 'Externí účastník přidán' });
    } catch (error) {
      toast({ title: 'Chyba při přidávání', variant: 'destructive' });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeParticipant(id);
      toast({ title: 'Účastník odebrán' });
    } catch (error) {
      toast({ title: 'Chyba při odebírání', variant: 'destructive' });
    }
  };

  const handleUpdateAttendance = async (id: string, attendance: AttendanceStatus) => {
    try {
      await updateParticipant(id, { attendance });
    } catch (error) {
      toast({ title: 'Chyba při aktualizaci', variant: 'destructive' });
    }
  };

  const getParticipantName = (participant: MeetingParticipant) => {
    if (participant.colleague_id) {
      const colleague = colleagues.find(c => c.id === participant.colleague_id);
      return colleague?.full_name || 'Neznámý';
    }
    return participant.external_name || 'Neznámý';
  };

  const getParticipantInitials = (participant: MeetingParticipant) => {
    const name = getParticipantName(participant);
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Účastníci ({participants.length})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsAddingInternal(true)}>
              <Plus className="h-4 w-4 mr-1" /> Kolega
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsAddingExternal(true)}>
              <UserPlus className="h-4 w-4 mr-1" /> Host
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Internal Form */}
        {isAddingInternal && (
          <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
            <Select value={selectedColleagueId} onValueChange={setSelectedColleagueId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Vyberte kolegu" />
              </SelectTrigger>
              <SelectContent>
                {availableColleagues.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAddInternal}>Přidat</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAddingInternal(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Add External Form */}
        {isAddingExternal && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex gap-2">
              <Input
                placeholder="Jméno hosta"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
              />
              <Input
                placeholder="Email (volitelné)"
                type="email"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddExternal}>Přidat</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingExternal(false)}>
                Zrušit
              </Button>
            </div>
          </div>
        )}

        {/* Participants List */}
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Zatím nebyli přidáni žádní účastníci
          </p>
        ) : (
          participants.map((participant) => {
            const attendanceConfig = ATTENDANCE_CONFIG[participant.attendance];
            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs ${
                      participant.colleague_id ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {getParticipantInitials(participant)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{getParticipantName(participant)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ROLE_LABELS[participant.role]}
                      </span>
                      {!participant.colleague_id && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={participant.attendance}
                    onValueChange={(v) => handleUpdateAttendance(participant.id, v as AttendanceStatus)}
                  >
                    <SelectTrigger className="h-7 text-xs w-auto">
                      <Badge className={`${attendanceConfig.color} text-xs`}>
                        {attendanceConfig.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ATTENDANCE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleRemove(participant.id)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
