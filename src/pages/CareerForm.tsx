import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { CheckCircle, Loader2, Upload, User, Mail, Phone, Briefcase, FileText, Video } from 'lucide-react';
import socialsLogo from '@/assets/socials-logo.png';

const formSchema = z.object({
  full_name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky').max(100, 'Jméno je příliš dlouhé'),
  email: z.string().email('Zadejte platnou emailovou adresu'),
  phone: z.string().optional(),
  position: z.string().min(2, 'Pozice je povinná'),
  cover_letter: z.string().min(50, 'Motivační dopis musí mít alespoň 50 znaků').max(5000, 'Motivační dopis je příliš dlouhý'),
  cv_url: z.string().url('Zadejte platnou URL').optional().or(z.literal('')),
  video_url: z.string().url('Zadejte platnou URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export default function CareerForm() {
  const { position: prefilledPosition } = useParams<{ position?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      position: prefilledPosition?.replace(/-/g, ' ') || '',
      cover_letter: '',
      cv_url: '',
      video_url: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Using 'as any' until applicants table is created in database
      const { error } = await (supabase as any)
        .from('applicants')
        .insert({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          position: data.position,
          cover_letter: data.cover_letter,
          cv_url: data.cv_url || null,
          video_url: data.video_url || null,
          stage: 'new_applicant',
          source: 'website',
          notes: [],
        });

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      form.setError('root', { 
        message: 'Nepodařilo se odeslat přihlášku. Zkuste to prosím znovu.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Děkujeme za přihlášku!</h2>
            <p className="text-muted-foreground">
              Vaši přihlášku jsme přijali a brzy se vám ozveme. 
              Držíme palce! 🤞
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src={socialsLogo} 
            alt="Socials" 
            className="h-12 mx-auto"
          />
          <div>
            <h1 className="text-3xl font-bold">Přidej se k nám!</h1>
            <p className="text-muted-foreground mt-2">
              Hledáme šikovné lidi do našeho týmu. Vyplň formulář a my se ti ozveme.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Přihláška</CardTitle>
            <CardDescription>
              Všechna pole označená * jsou povinná
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal info */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Osobní údaje
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celé jméno *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jan Novák" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email *
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jan@email.cz" {...field} />
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
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Telefon
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+420 123 456 789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Pozice
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>O jakou pozici máš zájem? *</FormLabel>
                        <FormControl>
                          <Input placeholder="např. Performance Specialist, Account Manager..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cover letter */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Motivace
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="cover_letter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proč chceš pracovat u nás? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Napiš nám něco o sobě, svých zkušenostech a proč chceš být součástí našeho týmu..."
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Minimálně 50 znaků
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Přílohy
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="cv_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Odkaz na životopis (CV)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://drive.google.com/..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Nahraj CV na Google Drive, Dropbox nebo jiné úložiště a vlož odkaz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Odkaz na představovací video
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://youtube.com/... nebo https://vimeo.com/..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Krátké video, kde se nám představíš (volitelné, ale určitě doporučujeme!)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Error message */}
                {form.formState.errors.root && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                    {form.formState.errors.root.message}
                  </div>
                )}

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Odesílám...
                    </>
                  ) : (
                    'Odeslat přihlášku'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Odesláním přihlášky souhlasíte se zpracováním osobních údajů pro účely výběrového řízení.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
