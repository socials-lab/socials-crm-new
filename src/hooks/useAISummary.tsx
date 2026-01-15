import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useAISummary() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async (meetingId: string, transcript?: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-summary', {
        body: { meeting_id: meetingId, transcript },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Invalidate meetings cache to refresh with new AI summary
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      
      toast.success('AI shrnutí bylo vygenerováno');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při generování shrnutí';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateSummary, isGenerating, error };
}
