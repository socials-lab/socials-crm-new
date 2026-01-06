import { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import type { 
  Meeting, 
  MeetingParticipant, 
  MeetingTask,
  MeetingWithDetails,
} from '@/types/meetings';
import { useCRMData } from './useCRMData';
import { useUserRole } from './useUserRole';

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

// Generate dummy meetings data
const generateDummyMeetings = (): Meeting[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      id: 'meeting-1',
      title: 'Týdenní standup',
      description: '',
      type: 'internal',
      client_id: null,
      engagement_id: null,
      scheduled_at: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(), // today 9:00
      duration_minutes: 30,
      location: 'Kancelář',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      status: 'scheduled',
      agenda: '1. Status update\n2. Blokery\n3. Plán na tento týden',
      transcript: '',
      ai_summary: '',
      notes: '',
      created_by: null,
      calendar_invites_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'meeting-2',
      title: 'Kick-off nového projektu',
      description: '',
      type: 'client',
      client_id: null,
      engagement_id: null,
      scheduled_at: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), // tomorrow 14:00
      duration_minutes: 60,
      location: 'Online',
      meeting_link: 'https://zoom.us/j/123456789',
      status: 'scheduled',
      agenda: '1. Představení týmu\n2. Cíle projektu\n3. Timeline\n4. Q&A',
      transcript: '',
      ai_summary: '',
      notes: '',
      created_by: null,
      calendar_invites_sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'meeting-3',
      title: 'Review kampaní Q1',
      description: '',
      type: 'client',
      client_id: null,
      engagement_id: null,
      scheduled_at: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // in 3 days 10:00
      duration_minutes: 90,
      location: 'Zasedací místnost A',
      meeting_link: '',
      status: 'scheduled',
      agenda: '1. Přehled výkonnosti\n2. Doporučení pro Q2\n3. Budget review',
      transcript: '',
      ai_summary: '',
      notes: '',
      created_by: null,
      calendar_invites_sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
};

const generateDummyParticipants = (): MeetingParticipant[] => [
  {
    id: 'participant-1',
    meeting_id: 'meeting-1',
    colleague_id: null,
    external_name: 'Jan Novák',
    external_email: 'jan.novak@example.com',
    role: 'organizer',
    attendance: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'participant-2',
    meeting_id: 'meeting-1',
    colleague_id: null,
    external_name: 'Marie Svobodová',
    external_email: 'marie@example.com',
    role: 'required',
    attendance: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'participant-3',
    meeting_id: 'meeting-2',
    colleague_id: null,
    external_name: 'Petr Klient',
    external_email: 'petr@klient.cz',
    role: 'required',
    attendance: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const generateDummyTasks = (): MeetingTask[] => [
  {
    id: 'task-1',
    meeting_id: 'meeting-1',
    title: 'Připravit report za minulý týden',
    description: '',
    assigned_to: null,
    due_date: new Date().toISOString().split('T')[0],
    status: 'todo',
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
  },
  {
    id: 'task-2',
    meeting_id: 'meeting-2',
    title: 'Zaslat onboarding dokumenty',
    description: '',
    assigned_to: null,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    priority: 'medium',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
  },
];

export function MeetingsDataProvider({ children }: { children: ReactNode }) {
  const { clients, engagements, colleagues } = useCRMData();
  const { colleagueId, isSuperAdmin, role } = useUserRole();
  
  const [allMeetings, setAllMeetings] = useState<Meeting[]>(generateDummyMeetings);
  const [participants, setParticipants] = useState<MeetingParticipant[]>(generateDummyParticipants);
  const [tasks, setTasks] = useState<MeetingTask[]>(generateDummyTasks);

  const isLoading = false;
  
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

  // Meeting operations
  const addMeeting = async (data: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Promise<Meeting> => {
    const newMeeting: Meeting = {
      ...data,
      id: `meeting-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAllMeetings(prev => [...prev, newMeeting]);
    return newMeeting;
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>): Promise<void> => {
    setAllMeetings(prev => prev.map(m => 
      m.id === id ? { ...m, ...data, updated_at: new Date().toISOString() } : m
    ));
  };

  const deleteMeeting = async (id: string): Promise<void> => {
    setAllMeetings(prev => prev.filter(m => m.id !== id));
    setParticipants(prev => prev.filter(p => p.meeting_id !== id));
    setTasks(prev => prev.filter(t => t.meeting_id !== id));
  };

  // Participant operations
  const addParticipant = async (data: Omit<MeetingParticipant, 'id' | 'created_at' | 'updated_at'>): Promise<MeetingParticipant> => {
    const newParticipant: MeetingParticipant = {
      ...data,
      id: `participant-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setParticipants(prev => [...prev, newParticipant]);
    return newParticipant;
  };

  const updateParticipant = async (id: string, data: Partial<MeetingParticipant>): Promise<void> => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
    ));
  };

  const removeParticipant = async (id: string): Promise<void> => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  // Task operations
  const addTask = async (data: Omit<MeetingTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<MeetingTask> => {
    const newTask: MeetingTask = {
      ...data,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (id: string, data: Partial<MeetingTask>): Promise<void> => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...data, updated_at: new Date().toISOString() };
      if (data.status === 'done' && !updated.completed_at) {
        updated.completed_at = new Date().toISOString();
      }
      return updated;
    }));
  };

  const deleteTask = async (id: string): Promise<void> => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Helper functions - use allMeetings for internal lookups to support operations
  const getMeetingById = (id: string) => allMeetings.find(m => m.id === id);

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

    // Mock: just update timestamp
    await updateMeeting(meetingId, { calendar_invites_sent_at: new Date().toISOString() });
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
