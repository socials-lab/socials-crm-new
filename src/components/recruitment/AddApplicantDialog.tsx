import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useCRMData } from '@/hooks/useCRMData';
import type { Applicant, ApplicantSource, ApplicantStage } from '@/types/applicant';
import { APPLICANT_SOURCE_LABELS, APPLICANT_STAGE_CONFIG } from '@/types/applicant';
import { toast } from 'sonner';

const formSchema = z.object({
  full_name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Neplatný email'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Pozice je povinná'),
  cover_letter: z.string().optional(),
  cv_url: z.string().url().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  stage: z.string(),
  owner_id: z.string().optional(),
  source: z.string(),
  source_custom: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant?: Applicant | null;
}

export function AddApplicantDialog({ open, onOpenChange, applicant }: AddApplicantDialogProps) {
  const { addApplicant, updateApplicant } = useApplicantsData();
  const { colleagues } = useCRMData();
  const isEditing = !!applicant;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      position: '',
      cover_letter: '',
      cv_url: '',
      video_url: '',
      stage: 'new_applicant',
      owner_id: '',
      source: 'website',
      source_custom: '',
    },
  });

  useEffect(() => {
    if (applicant) {
      form.reset({
        full_name: applicant.full_name,
        email: applicant.email,
        phone: applicant.phone || '',
        position: applicant.position,
        cover_letter: applicant.cover_letter || '',
        cv_url: applicant.cv_url || '',
        video_url: applicant.video_url || '',
        stage: applicant.stage,
        owner_id: applicant.owner_id || '',
        source: applicant.source,
        source_custom: applicant.source_custom || '',
      });
    } else {
      form.reset({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        cover_letter: '',
        cv_url: '',
        video_url: '',
        stage: 'new_applicant',
        owner_id: '',
        source: 'website',
        source_custom: '',
      });
    }
  }, [applicant, form]);

  const onSubmit = (data: FormData) => {
    const applicantData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      position: data.position,
      cover_letter: data.cover_letter || null,
      cv_url: data.cv_url || null,
      video_url: data.video_url || null,
      stage: data.stage as ApplicantStage,
      owner_id: data.owner_id || null,
      source: data.source as ApplicantSource,
      source_custom: data.source_custom || null,
      // Freelancer info (null until onboarding)
      ico: null,
      company_name: null,
      dic: null,
      hourly_rate: null,
      billing_street: null,
      billing_city: null,
      billing_zip: null,
      bank_account: null,
      // Onboarding status
      onboarding_sent_at: null,
      onboarding_completed_at: null,
      converted_to_colleague_id: null,
    };

    if (isEditing && applicant) {
      updateApplicant(applicant.id, applicantData);
      toast.success('Uchazeč byl upraven');
    } else {
      addApplicant(applicantData);
      toast.success('Uchazeč byl přidán');
    }

    onOpenChange(false);
  };

  const activeColleagues = colleagues.filter(c => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Upravit uchazeče' : 'Přidat uchazeče'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jméno *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan Novák" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pozice *</FormLabel>
                    <FormControl>
                      <Input placeholder="Performance Specialist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jan@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+420 123 456 789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pipeline */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stav</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte stav" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(APPLICANT_STAGE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odpovědná osoba</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte osobu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeColleagues.map((colleague) => (
                          <SelectItem key={colleague.id} value={colleague.id}>
                            {colleague.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Source */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zdroj</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte zdroj" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(APPLICANT_SOURCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('source') === 'other' && (
                <FormField
                  control={form.control}
                  name="source_custom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vlastní zdroj</FormLabel>
                      <FormControl>
                        <Input placeholder="Upřesněte zdroj" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Files */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cv_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL životopisu</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL videa</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cover letter */}
            <FormField
              control={form.control}
              name="cover_letter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivační dopis</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Motivace uchazeče..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button type="submit">
                {isEditing ? 'Uložit změny' : 'Přidat uchazeče'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
