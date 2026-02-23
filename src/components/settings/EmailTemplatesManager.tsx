import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Save, RotateCcw, Variable } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailTemplates, type EmailTemplate } from '@/hooks/useEmailTemplates';

function TemplateEditor({ template, onSave, isSaving }: { 
  template: EmailTemplate; 
  onSave: (key: string, subject: string, body: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [subject, setSubject] = useState(template.subject_template);
  const [body, setBody] = useState(template.body_template);
  const [isDirty, setIsDirty] = useState(false);

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    setIsDirty(true);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await onSave(template.template_key, subject, body);
      setIsDirty(false);
      toast.success(`Šablona "${template.name}" uložena`);
    } catch (e) {
      toast.error('Nepodařilo se uložit šablonu');
    }
  };

  const handleReset = () => {
    setSubject(template.subject_template);
    setBody(template.body_template);
    setIsDirty(false);
  };

  const insertVariable = (varName: string, target: 'subject' | 'body') => {
    const placeholder = `{${varName}}`;
    if (target === 'subject') {
      setSubject(prev => prev + placeholder);
      setIsDirty(true);
    } else {
      setBody(prev => prev + placeholder);
      setIsDirty(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Předmět</Label>
        <Input
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Tělo emailu</Label>
        <Textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
      </div>

      {/* Available Variables */}
      {template.available_variables.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Variable className="h-4 w-4" />
            <span>Dostupné proměnné (klikněte pro vložení do těla):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {template.available_variables.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs"
                onClick={() => insertVariable(v, 'body')}
              >
                {`{${v}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={!isDirty || isSaving} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Ukládám...' : 'Uložit'}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={!isDirty} size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Zrušit změny
        </Button>
      </div>
    </div>
  );
}

export function EmailTemplatesManager() {
  const { templates, isLoading, updateTemplate, isUpdating } = useEmailTemplates();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Emailové šablony
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Načítání šablon...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Emailové šablony
        </CardTitle>
        <CardDescription>
          Centrální správa všech emailových šablon. Změny se projeví ve všech odesílacích dialozích.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {templates.map((template) => (
            <AccordionItem key={template.template_key} value={template.template_key}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-medium text-sm">{template.name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {template.description}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <TemplateEditor
                  template={template}
                  onSave={updateTemplate}
                  isSaving={isUpdating}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
