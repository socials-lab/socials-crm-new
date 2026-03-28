import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, Plus, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useOfferContent, DEFAULT_OFFER_CONTENT, type OfferContentBlock } from '@/hooks/useOfferContent';

// Generic section editor for title + subtitle
function SectionHeaderEditor({ 
  title, subtitle, onChange 
}: { 
  title: string; subtitle: string; 
  onChange: (field: 'title' | 'subtitle', val: string) => void 
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-muted-foreground">Nadpis sekce</Label>
        <Input value={title} onChange={e => onChange('title', e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Podnadpis sekce</Label>
        <Textarea value={subtitle} onChange={e => onChange('subtitle', e.target.value)} className="mt-1" rows={2} />
      </div>
    </div>
  );
}

// Why Us editor
function WhyUsEditor({ block, onSave }: { block: OfferContentBlock; onSave: (updates: any) => Promise<boolean> }) {
  const [title, setTitle] = useState(block.title || '');
  const [subtitle, setSubtitle] = useState(block.subtitle || '');
  const [items, setItems] = useState<any[]>(block.content?.items || []);
  const [links, setLinks] = useState<any[]>(block.content?.links || []);
  const [saving, setSaving] = useState(false);

  const updateItem = (idx: number, field: string, val: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addItem = () => setItems(prev => [...prev, { stat: '', label: '', description: '' }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateLink = (idx: number, field: string, val: string) => {
    setLinks(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, subtitle, content: { items, links } });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeaderEditor title={title} subtitle={subtitle} onChange={(f, v) => f === 'title' ? setTitle(v) : setSubtitle(v)} />
      
      <Separator />
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="font-semibold">Argumenty ({items.length})</Label>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Přidat</Button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input placeholder="Stat (např. 30+ mil. Kč)" value={item.stat} onChange={e => updateItem(i, 'stat', e.target.value)} className="text-sm" />
                </div>
                <div className="flex-1">
                  <Input placeholder="Label" value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} className="text-sm" />
                </div>
                <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Textarea placeholder="Popis" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} rows={2} className="text-sm" />
            </div>
          ))}
        </div>
      </div>

      <Separator />
      
      <div>
        <Label className="font-semibold mb-3 block">Odkazy ({links.length})</Label>
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Label" value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} className="flex-1 text-sm" />
                <Input placeholder="URL" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} className="flex-1 text-sm" />
              </div>
              <Input placeholder="Popis" value={link.description} onChange={e => updateLink(i, 'description', e.target.value)} className="text-sm" />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />{saving ? 'Ukládám...' : 'Uložit změny'}
      </Button>
    </div>
  );
}

// Benefits editor
function BenefitsEditor({ block, onSave }: { block: OfferContentBlock; onSave: (updates: any) => Promise<boolean> }) {
  const [title, setTitle] = useState(block.title || '');
  const [subtitle, setSubtitle] = useState(block.subtitle || '');
  const [items, setItems] = useState<any[]>(block.content?.items || []);
  const [saving, setSaving] = useState(false);

  const updateItem = (idx: number, field: string, val: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addItem = () => setItems(prev => [...prev, { icon: '✨', title: '', desc: '' }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, subtitle, content: { items } });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeaderEditor title={title} subtitle={subtitle} onChange={(f, v) => f === 'title' ? setTitle(v) : setSubtitle(v)} />
      
      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="font-semibold">Benefity ({items.length})</Label>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Přidat</Button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
              <div className="flex gap-2 items-center">
                <Input placeholder="Emoji" value={item.icon} onChange={e => updateItem(i, 'icon', e.target.value)} className="w-16 text-center text-sm" />
                <Input placeholder="Titulek" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} className="flex-1 text-sm" />
                <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Textarea placeholder="Popis benefitu" value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} rows={2} className="text-sm" />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />{saving ? 'Ukládám...' : 'Uložit změny'}
      </Button>
    </div>
  );
}

// Onboarding steps editor
function OnboardingEditor({ block, onSave }: { block: OfferContentBlock; onSave: (updates: any) => Promise<boolean> }) {
  const [title, setTitle] = useState(block.title || '');
  const [subtitle, setSubtitle] = useState(block.subtitle || '');
  const [steps, setSteps] = useState<any[]>(block.content?.steps || []);
  const [saving, setSaving] = useState(false);

  const updateStep = (idx: number, field: string, val: string) => {
    setSteps(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addStep = () => setSteps(prev => [...prev, { icon: 'Rocket', title: '', description: '', timeline: '' }]);
  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, subtitle, content: { steps } });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeaderEditor title={title} subtitle={subtitle} onChange={(f, v) => f === 'title' ? setTitle(v) : setSubtitle(v)} />
      
      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="font-semibold">Kroky ({steps.length})</Label>
          <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1" />Přidat krok</Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <Input placeholder="Titulek kroku" value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} className="flex-1 text-sm" />
                <Input placeholder="Časový rámec" value={step.timeline} onChange={e => updateStep(i, 'timeline', e.target.value)} className="w-32 text-sm" />
                <Button size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => removeStep(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Textarea placeholder="Popis kroku" value={step.description} onChange={e => updateStep(i, 'description', e.target.value)} rows={2} className="text-sm" />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />{saving ? 'Ukládám...' : 'Uložit změny'}
      </Button>
    </div>
  );
}

// Simple section editor (title + subtitle + optional content fields)
function SimpleBlockEditor({ 
  block, 
  onSave,
  contentFields = []
}: { 
  block: OfferContentBlock; 
  onSave: (updates: any) => Promise<boolean>;
  contentFields?: { key: string; label: string; multiline?: boolean }[];
}) {
  const [title, setTitle] = useState(block.title || '');
  const [subtitle, setSubtitle] = useState(block.subtitle || '');
  const [content, setContent] = useState<Record<string, any>>(block.content || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title: title || null, subtitle: subtitle || null, content });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeaderEditor title={title} subtitle={subtitle} onChange={(f, v) => f === 'title' ? setTitle(v) : setSubtitle(v)} />
      
      {contentFields.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            {contentFields.map(field => (
              <div key={field.key}>
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                {field.multiline ? (
                  <Textarea 
                    value={content[field.key] || ''} 
                    onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))} 
                    className="mt-1" rows={3} 
                  />
                ) : (
                  <Input 
                    value={content[field.key] || ''} 
                    onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))} 
                    className="mt-1" 
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />{saving ? 'Ukládám...' : 'Uložit změny'}
      </Button>
    </div>
  );
}

// Credibility badges editor
function BadgesEditor({ block, onSave }: { block: OfferContentBlock; onSave: (updates: any) => Promise<boolean> }) {
  const [items, setItems] = useState<string[]>(block.content?.items || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ content: { items } });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Label className="font-semibold">Odznaky důvěryhodnosti</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? e.target.value : it))} className="text-sm" />
            <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={() => setItems(prev => [...prev, ''])}>
        <Plus className="h-3 w-3 mr-1" />Přidat
      </Button>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />{saving ? 'Ukládám...' : 'Uložit změny'}
      </Button>
    </div>
  );
}

const SECTION_TABS = [
  { key: 'credibility_badges', label: 'Odznaky', emoji: '🏅' },
  { key: 'why_us', label: 'Proč my', emoji: '💪' },
  { key: 'reporting', label: 'Reporting', emoji: '📊' },
  { key: 'creative_portfolio', label: 'Kreativa', emoji: '🎨' },
  { key: 'benefits', label: 'Benefity', emoji: '🎁' },
  { key: 'onboarding', label: 'Onboarding', emoji: '🚀' },
  { key: 'cta', label: 'CTA', emoji: '📣' },
  { key: 'clients_logos', label: 'Klienti', emoji: '❤️' },
  { key: 'certifications', label: 'Certifikace', emoji: '🏆' },
];

export default function OfferContentEditor({ embedded }: { embedded?: boolean }) {
  const { getBlock, updateBlock, isLoading } = useOfferContent();
  const [activeTab, setActiveTab] = useState('why_us');

  const handleSave = async (sectionKey: string, updates: any) => {
    return updateBlock(sectionKey, updates);
  };

  if (isLoading) {
    return (
      <div className={embedded ? '' : 'p-6'}>
        {!embedded && <PageHeader title="📝 Editor nabídky" description="Správa fixních textů veřejné nabídky" />}
        <div className="animate-pulse space-y-4 mt-6">
          <div className="h-10 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'p-6'} space-y-6 animate-fade-in`}>
      {!embedded && (
        <PageHeader 
          title="📝 Editor nabídky" 
          description="Upravte fixní texty, které se zobrazují na veřejné stránce nabídky"
        />
      )}

      <div className="flex gap-2 flex-wrap mb-2">
        <a
          href="/offer-test"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Náhled nabídky
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {SECTION_TABS.map(tab => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs px-3 py-1.5 rounded-lg border border-transparent data-[state=active]:border-primary/20"
            >
              {tab.emoji} {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <TabsContent value="why_us" className="mt-0">
                {(() => {
                  const block = getBlock('why_us');
                  return block ? <WhyUsEditor block={block} onSave={u => handleSave('why_us', u)} /> : null;
                })()}
              </TabsContent>

              <TabsContent value="benefits" className="mt-0">
                {(() => {
                  const block = getBlock('benefits');
                  return block ? <BenefitsEditor block={block} onSave={u => handleSave('benefits', u)} /> : null;
                })()}
              </TabsContent>

              <TabsContent value="onboarding" className="mt-0">
                {(() => {
                  const block = getBlock('onboarding');
                  return block ? <OnboardingEditor block={block} onSave={u => handleSave('onboarding', u)} /> : null;
                })()}
              </TabsContent>

              <TabsContent value="reporting" className="mt-0">
                {(() => {
                  const block = getBlock('reporting');
                  return block ? (
                    <SimpleBlockEditor 
                      block={block} 
                      onSave={u => handleSave('reporting', u)}
                      contentFields={[
                        { key: 'note', label: 'Poznámka pod nadpisem', multiline: false },
                        { key: 'demo_report_url', label: 'URL demo reportu' },
                      ]}
                    />
                  ) : null;
                })()}
              </TabsContent>

              <TabsContent value="creative_portfolio" className="mt-0">
                {(() => {
                  const block = getBlock('creative_portfolio');
                  return block ? <SimpleBlockEditor block={block} onSave={u => handleSave('creative_portfolio', u)} /> : null;
                })()}
              </TabsContent>

              <TabsContent value="cta" className="mt-0">
                {(() => {
                  const block = getBlock('cta');
                  return block ? (
                    <SimpleBlockEditor 
                      block={block} 
                      onSave={u => handleSave('cta', u)}
                      contentFields={[
                        { key: 'extended_subtitle', label: 'Rozšířený podnadpis', multiline: true },
                        { key: 'button_text', label: 'Text tlačítka' },
                        { key: 'footer_note', label: 'Poznámka pod tlačítkem' },
                      ]}
                    />
                  ) : null;
                })()}
              </TabsContent>

              <TabsContent value="clients_logos" className="mt-0">
                {(() => {
                  const block = getBlock('clients_logos');
                  return block ? <SimpleBlockEditor block={block} onSave={u => handleSave('clients_logos', u)} /> : null;
                })()}
              </TabsContent>

              <TabsContent value="certifications" className="mt-0">
                {(() => {
                  const block = getBlock('certifications');
                  return block ? <SimpleBlockEditor block={block} onSave={u => handleSave('certifications', u)} /> : null;
                })()}
              </TabsContent>

              <TabsContent value="credibility_badges" className="mt-0">
                {(() => {
                  const block = getBlock('credibility_badges');
                  return block ? <BadgesEditor block={block} onSave={u => handleSave('credibility_badges', u)} /> : null;
                })()}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
