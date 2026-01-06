import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Meeting, 
  MeetingParticipant, 
  MeetingTask,
  MeetingWithDetails,
} from '@/types/meetings';
import { useCRMData } from './useCRMData';

interface MeetingsDataContextType {
  // Data
  meetings: Meeting[];
  participants: MeetingParticipant[];
  tasks: MeetingTask[];
  
  // Loading states
  isLoading: boolean;
  
  // Meeting operations
  addMeeting: (meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => Promise<Meeting>;
  updateMeeting: (id: string, data: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  
  // Participant operations
  addParticipant: (participant: Omit<MeetingParticipant, 'id' | 'created_at' | 'updated_at'>) => Promise<MeetingParticipant>;
  updateParticipant: (id: string, data: Partial<MeetingParticipant>) => Promise<void>;
  removeParticipant: (id: string) => Promise<void>;
  
  // Task operations
  addTask: (task: Omit<MeetingTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => Promise<MeetingTask>;
  updateTask: (id: string, data: Partial<MeetingTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Helper functions
  getMeetingById: (id: string) => Meeting | undefined;
  getMeetingWithDetails: (id: string) => MeetingWithDetails | undefined;
  getParticipantsByMeetingId: (meetingId: string) => MeetingParticipant[];
  getTasksByMeetingId: (meetingId: string) => MeetingTask[];
  getUpcomingMeetings: (days?: number) => Meeting[];
  getTodaysMeetings: () => Meeting[];
  getMeetingsByEngagement: (engagementId: string) => Meeting[];
  getMeetingsByClient: (clientId: string) => Meeting[];
  sendCalendarInvites: (meetingId: string) => Promise<void>;
}

const MeetingsDataContext = createContext<MeetingsDataContextType | null>(null);

const transformMeeting = (row: any): Meeting => ({
  ...row,
  type: row.type || 'internal',
  status: row.status || 'scheduled',
  description: row.description || '',
  location: row.location || '',
  meeting_link: row.meeting_link || '',
  agenda: row.agenda || '',
  transcript: row.transcript || '',
  ai_summary: row.ai_summary || '',
  notes: row.notes || '',
  duration_minutes: row.duration_minutes || 60,
  calendar_invites_sent_at: row.calendar_invites_sent_at || null,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

export function MeetingsDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { clients, engagements, colleagues } = useCRMData();

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('meetings')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(transformMeeting);
    },
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['meeting_participants'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('meeting_participants')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['meeting_tasks'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('meeting_tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = meetingsLoading || participantsLoading || tasksLoading;

  // Mutations
  const addMeetingMutation = useMutation({
    mutationFn: async (data: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any)
        .from('meetings')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return transformMeeting(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meeting> }) => {
      const { error } = await (supabase as any)
        .from('meetings')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('meetings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting_participants'] });
      queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (data: Omit<MeetingParticipant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await (supabase as any)
        .from('meeting_participants')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_participants'] }),
  });

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MeetingParticipant> }) => {
      const { error } = await (supabase as any)
        .from('meeting_participants')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_participants'] }),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('meeting_participants')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_participants'] }),
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: Omit<MeetingTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
      const { data: result, error } = await (supabase as any)
        .from('meeting_tasks')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MeetingTask> }) => {
      const updateData = { ...data };
      if (data.status === 'done' && !data.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await (supabase as any)
        .from('meeting_tasks')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('meeting_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] }),
  });

  // Helper functions
  const getMeetingById = (id: string) => meetings.find(m => m.id === id);

  const getMeetingWithDetails = (id: string): MeetingWithDetails | undefined => {
    const meeting = getMeetingById(id);
    if (!meeting) return undefined;

    const meetingParticipants = participants.filter(p => p.meeting_id === id);
    const meetingTasks = tasks.filter(t => t.meeting_id === id);
    const client = meeting.client_id ? clients.find(c => c.id === meeting.client_id) : undefined;
    const engagement = meeting.engagement_id ? engagements.find(e => e.id === meeting.engagement_id) : undefined;

    return {
      ...meeting,
      participants: meetingParticipants,
      tasks: meetingTasks,
      client_name: client?.name,
      engagement_name: engagement?.name,
    };
  };

  const getParticipantsByMeetingId = (meetingId: string) => 
    participants.filter(p => p.meeting_id === meetingId);

  const getTasksByMeetingId = (meetingId: string) => 
    tasks.filter(t => t.meeting_id === meetingId);

  const getUpcomingMeetings = (days: number = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= now && meetingDate <= future && m.status !== 'cancelled';
    });
  };

  const getTodaysMeetings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= today && meetingDate < tomorrow && m.status !== 'cancelled';
    });
  };

  const getMeetingsByEngagement = (engagementId: string) =>
    meetings.filter(m => m.engagement_id === engagementId);

  const getMeetingsByClient = (clientId: string) =>
    meetings.filter(m => m.client_id === clientId);

  const sendCalendarInvites = async (meetingId: string) => {
    const meeting = getMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    const meetingParticipants = getParticipantsByMeetingId(meetingId);
    const colleagueEmails = meetingParticipants
      .filter(p => p.colleague_id)
      .map(p => {
        const colleague = colleagues.find(c => c.id === p.colleague_id);
        return colleague?.email;
      })
      .filter(Boolean);

    if (colleagueEmails.length === 0) {
      throw new Error('Žádní účastníci s emailem');
    }

    // TODO: Call edge function to send actual emails
    // For now, just update the timestamp
    await updateMeetingMutation.mutateAsync({
      id: meetingId,
      data: { calendar_invites_sent_at: new Date().toISOString() },
    });
  };

  const value: MeetingsDataContextType = {
    meetings,
    participants,
    tasks,
    isLoading,
    addMeeting: (data) => addMeetingMutation.mutateAsync(data),
    updateMeeting: (id, data) => updateMeetingMutation.mutateAsync({ id, data }),
    deleteMeeting: (id) => deleteMeetingMutation.mutateAsync(id),
    addParticipant: (data) => addParticipantMutation.mutateAsync(data),
    updateParticipant: (id, data) => updateParticipantMutation.mutateAsync({ id, data }),
    removeParticipant: (id) => removeParticipantMutation.mutateAsync(id),
    addTask: (data) => addTaskMutation.mutateAsync(data),
    updateTask: (id, data) => updateTaskMutation.mutateAsync({ id, data }),
    deleteTask: (id) => deleteTaskMutation.mutateAsync(id),
    getMeetingById,
    getMeetingWithDetails,
    getParticipantsByMeetingId,
    getTasksByMeetingId,
    getUpcomingMeetings,
    getTodaysMeetings,
    getMeetingsByEngagement,
    getMeetingsByClient,
    sendCalendarInvites,
  };

  return (
    <MeetingsDataContext.Provider value={value}>
      {children}
    </MeetingsDataContext.Provider>
  );
}

export function useMeetingsData() {
  const context = useContext(MeetingsDataContext);
  if (!context) {
    throw new Error('useMeetingsData must be used within MeetingsDataProvider');
  }
  return context;
}
