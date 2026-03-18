import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useMeetingScheduleUrl() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: meetingUrl = '', isLoading } = useQuery({
    queryKey: ['meeting-schedule-url', user?.id],
    queryFn: async () => {
      if (!user?.id) return '';

      const { data, error } = await supabase
        .from('profiles')
        .select('meeting_schedule_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return (data?.meeting_schedule_url as string) || '';
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!user?.id) {
        throw new Error('User is not authenticated.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ meeting_schedule_url: url })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-schedule-url', user?.id] });
      toast.success('Meeting scheduling URL saved.');
    },
    onError: () => {
      toast.error('Failed to save meeting scheduling URL.');
    },
  });

  return {
    meetingUrl,
    isLoading,
    saveMeetingUrl: (url: string) => saveMutation.mutate(url),
    isSaving: saveMutation.isPending,
  };
}
