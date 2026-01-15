import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCRMData } from './useCRMData';
import { useUserRole } from './useUserRole';
import type { 
  Meeting, 
  MeetingParticipant, 
  MeetingTask,
  MeetingWithDetails,
  MeetingType,
  MeetingStatus,
  ParticipantRole,
  AttendanceStatus,
  MeetingTaskStatus,
  MeetingTaskPriority,
} from '@/types/meetings';

interface MeetingsDataContextType {
  // Data
  meetings: Meeting[];
  participants: MeetingParticipant[];
  tasks: MeetingTask[];
  
  // Access control
  canViewAllMeetings: boolean;
  
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

// Transformer functions
const transformMeeting = (row: any): Meeting => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  type: row.type as MeetingType,
  client_id: row.client_id,
  engagement_id: row.engagement_id,
  scheduled_at: row.scheduled_at,
  duration_minutes: row.duration_minutes,
  location: row.location || '',
  meeting_link: row.meeting_link || '',
  status: row.status as MeetingStatus,
  agenda: row.agenda || '',
  transcript: row.transcript || '',
  ai_summary: row.ai_summary || '',
  notes: row.notes || '',
  created_by: row.created_by,
  calendar_invites_sent_at: row.calendar_invites_sent_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const transformParticipant = (row: any): MeetingParticipant => ({
  id: row.id,
  meeting_id: row.meeting_id,
  colleague_id: row.colleague_id,
  external_name: row.external_name,
  external_email: row.external_email,
  role: row.role as ParticipantRole,
  attendance: row.attendance as AttendanceStatus,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const transformTask = (row: any): MeetingTask => ({
  id: row.id,
  meeting_id: row.meeting_id,
  title: row.title,
  description: row.description || '',
  assigned_to: row.assigned_to,
  due_date: row.due_date,
  status: row.status as MeetingTaskStatus,
  priority: row.priority as MeetingTaskPriority,
  created_at: row.created_at,
  updated_at: row.updated_at,
  completed_at: row.completed_at,
});

export function MeetingsDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { clients, engagements, colleagues } = useCRMData();
  const { colleagueId, isSuperAdmin, role } = useUserRole();
  
  // Queries
  const { data: allMeetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('meeting_participants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformParticipant);
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['meeting_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformTask);
    },
  });

  const isLoading = meetingsLoading || participantsLoading || tasksLoading;
  
  // Admins and management can view all meetings
  const canViewAllMeetings = isSuperAdmin || role === 'admin' || role === 'management';
  
  // Filter meetings based on user role and participation
  const meetings = useMemo(() => {
    if (canViewAllMeetings) return allMeetings;
    if (!colleagueId) return [];
    
    // Find meeting IDs where user is a participant
    const myMeetingIds = participants
      .filter(p => p.colleague_id === colleagueId)
      .map(p => p.meeting_id);
    
    return allMeetings.filter(m => myMeetingIds.includes(m.id));
  }, [allMeetings, participants, colleagueId, canViewAllMeetings]);

  // Mutations
  const addMeetingMutation = useMutation({
    mutationFn: async (data: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('meetings')
        .insert({
          title: data.title,
          description: data.description,
          type: data.type,
          client_id: data.client_id,
          engagement_id: data.engagement_id,
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          location: data.location,
          meeting_link: data.meeting_link,
          status: data.status,
          agenda: data.agenda,
          transcript: data.transcript,
          ai_summary: data.ai_summary,
          notes: data.notes,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return transformMeeting(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meeting> }) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.client_id !== undefined) updateData.client_id = data.client_id;
      if (data.engagement_id !== undefined) updateData.engagement_id = data.engagement_id;
      if (data.scheduled_at !== undefined) updateData.scheduled_at = data.scheduled_at;
      if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.meeting_link !== undefined) updateData.meeting_link = data.meeting_link;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.agenda !== undefined) updateData.agenda = data.agenda;
      if (data.transcript !== undefined) updateData.transcript = data.transcript;
      if (data.ai_summary !== undefined) updateData.ai_summary = data.ai_summary;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.calendar_invites_sent_at !== undefined) updateData.calendar_invites_sent_at = data.calendar_invites_sent_at;

      const { error } = await supabase.from('meetings').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      // Cascade delete should handle participants and tasks, but explicit is safer
      await supabase.from('meeting_tasks').delete().eq('meeting_id', id);
      await supabase.from('meeting_participants').delete().eq('meeting_id', id);
      const { error } = await supabase.from('meetings').delete().eq('id', id);
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
      const { data: result, error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: data.meeting_id,
          colleague_id: data.colleague_id,
          external_name: data.external_name,
          external_email: data.external_email,
          role: data.role,
          attendance: data.attendance,
        })
        .select()
        .single();
      if (error) throw error;
      return transformParticipant(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_participants'] }),
  });

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MeetingParticipant> }) => {
      const updateData: any = {};
      if (data.colleague_id !== undefined) updateData.colleague_id = data.colleague_id;
      if (data.external_name !== undefined) updateData.external_name = data.external_name;
      if (data.external_email !== undefined) updateData.external_email = data.external_email;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.attendance !== undefined) updateData.attendance = data.attendance;

      const { error } = await supabase.from('meeting_participants').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_participants'] }),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meeting_participants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_participants'] }),
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: Omit<MeetingTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
      const { data: result, error } = await supabase
        .from('meeting_tasks')
        .insert({
          meeting_id: data.meeting_id,
          title: data.title,
          description: data.description,
          assigned_to: data.assigned_to,
          due_date: data.due_date,
          status: data.status,
          priority: data.priority,
        })
        .select()
        .single();
      if (error) throw error;
      return transformTask(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MeetingTask> }) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
      if (data.due_date !== undefined) updateData.due_date = data.due_date;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      
      // Auto-set completed_at when status changes to 'done'
      if (data.status === 'done') {
        const existingTask = tasks.find(t => t.id === id);
        if (existingTask && !existingTask.completed_at) {
          updateData.completed_at = new Date().toISOString();
        }
      } else if (data.status && data.status !== 'done') {
        // Clear completed_at if status changes away from 'done'
        updateData.completed_at = null;
      }

      const { error } = await supabase.from('meeting_tasks').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meeting_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_tasks'] }),
  });

  const sendCalendarInvitesMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      // Update calendar_invites_sent_at timestamp
      // Actual calendar API integration will be in Sub-Plan 12
      const { error } = await supabase
        .from('meetings')
        .update({ calendar_invites_sent_at: new Date().toISOString() })
        .eq('id', meetingId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  // Helper functions
  const getMeetingById = useCallback(
    (id: string) => {
      return allMeetings.find(m => m.id === id);
    },
    [allMeetings]
  );

  const getMeetingWithDetails = useCallback(
    (id: string): MeetingWithDetails | undefined => {
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
    },
    [getMeetingById, participants, tasks, clients, engagements]
  );

  const getParticipantsByMeetingId = useCallback(
    (meetingId: string) => {
      return participants.filter(p => p.meeting_id === meetingId);
    },
    [participants]
  );

  const getTasksByMeetingId = useCallback(
    (meetingId: string) => {
      return tasks.filter(t => t.meeting_id === meetingId);
    },
    [tasks]
  );

  const getUpcomingMeetings = useCallback(
    (days: number = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= now && meetingDate <= future && m.status !== 'cancelled';
    });
    },
    [meetings]
  );

  const getTodaysMeetings = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= today && meetingDate < tomorrow && m.status !== 'cancelled';
    });
  }, [meetings]);

  const getMeetingsByEngagement = useCallback(
    (engagementId: string) => {
      return meetings.filter(m => m.engagement_id === engagementId);
    },
    [meetings]
  );

  const getMeetingsByClient = useCallback(
    (clientId: string) => {
      return meetings.filter(m => m.client_id === clientId);
    },
    [meetings]
  );

  const sendCalendarInvites = async (meetingId: string) => {
    const meeting = getMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    const meetingParticipants = getParticipantsByMeetingId(meetingId);
    const emails = meetingParticipants
      .filter(p => p.colleague_id || p.external_email)
      .map(p => {
        if (p.colleague_id) {
          const colleague = colleagues.find(c => c.id === p.colleague_id);
          return colleague?.email;
        }
        return p.external_email;
      })
      .filter(Boolean);

    if (emails.length === 0) {
      throw new Error('Žádní účastníci s emailem');
    }

    // Update timestamp (actual calendar API integration in Sub-Plan 12)
    await sendCalendarInvitesMutation.mutateAsync(meetingId);
  };

  // Wrapper functions
  const addMeeting = async (data: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Promise<Meeting> => {
    return addMeetingMutation.mutateAsync(data);
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>): Promise<void> => {
    await updateMeetingMutation.mutateAsync({ id, data });
  };

  const deleteMeeting = async (id: string): Promise<void> => {
    await deleteMeetingMutation.mutateAsync(id);
  };

  const addParticipant = async (data: Omit<MeetingParticipant, 'id' | 'created_at' | 'updated_at'>): Promise<MeetingParticipant> => {
    return addParticipantMutation.mutateAsync(data);
  };

  const updateParticipant = async (id: string, data: Partial<MeetingParticipant>): Promise<void> => {
    await updateParticipantMutation.mutateAsync({ id, data });
  };

  const removeParticipant = async (id: string): Promise<void> => {
    await removeParticipantMutation.mutateAsync(id);
  };

  const addTask = async (data: Omit<MeetingTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<MeetingTask> => {
    return addTaskMutation.mutateAsync(data);
  };

  const updateTask = async (id: string, data: Partial<MeetingTask>): Promise<void> => {
    await updateTaskMutation.mutateAsync({ id, data });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteTaskMutation.mutateAsync(id);
  };

  const value: MeetingsDataContextType = {
    meetings,
    participants,
    tasks,
    canViewAllMeetings,
    isLoading,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addTask,
    updateTask,
    deleteTask,
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
