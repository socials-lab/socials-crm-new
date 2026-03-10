import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useMeetingScheduleUrl() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: meetingUrl = '', isLoading } = useQuery({
    queryKey: ['meeting-schedule-url', user?.id],
    queryFn: async () => {
      if (!user?.id) return '';
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('meeting_schedule_url')
        .eq('id', user.id)
        .single();
      if (error) return '';
      return (data?.meeting_schedule_url as string) || '';
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ meeting_schedule_url: url })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-schedule-url'] });
      toast.success('URL pro sjednání schůzky uložena');
    },
    onError: () => {
      toast.error('Nepodařilo se uložit URL');
    },
  });

  return {
    meetingUrl,
    isLoading,
    saveMeetingUrl: (url: string) => saveMutation.mutate(url),
    isSaving: saveMutation.isPending,
  };
}
