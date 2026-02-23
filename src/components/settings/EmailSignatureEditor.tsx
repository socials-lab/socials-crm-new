import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pen, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function EmailSignatureEditor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: signature = '', isLoading } = useQuery({
    queryKey: ['email-signature', user?.id],
    queryFn: async () => {
      if (!user?.id) return '';
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('email_signature')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return (data?.email_signature as string) || '';
    },
    enabled: !!user?.id,
  });

  const [value, setValue] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setValue(signature);
    }
  }, [signature, isLoading]);

  const handleChange = (v: string) => {
    setValue(v);
    setIsDirty(v !== signature);
  };

  const saveMutation = useMutation({
    mutationFn: async (sig: string) => {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ email_signature: sig })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-signature'] });
      setIsDirty(false);
      toast.success('Podpis uložen');
    },
    onError: () => {
      toast.error('Nepodařilo se uložit podpis');
    },
  });

  const placeholder = `S pozdravem,\nJan Novák\nAccount Manager\njan@socials.cz\n+420 123 456 789`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Pen className="h-4 w-4" />
          Můj emailový podpis
        </CardTitle>
        <CardDescription>
          Váš podpis se automaticky vloží do emailových šablon jako proměnná {'{signature}'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          rows={6}
          className="font-mono text-sm"
          placeholder={placeholder}
        />
        <Button
          onClick={() => saveMutation.mutate(value)}
          disabled={!isDirty || saveMutation.isPending}
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Ukládám...' : 'Uložit podpis'}
        </Button>
      </CardContent>
    </Card>
  );
}
