import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ProspectInteractionType } from '@/types/prospect';
import { INTERACTION_TYPE_LABELS } from '@/types/prospect';
import { useProspectsData } from '@/hooks/useProspectsData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CrmField = 'name' | 'email' | 'phone' | 'company';

const CRM_FIELDS: { field: CrmField; label: string; required: boolean }[] = [
  { field: 'name', label: 'Jméno', required: false },
  { field: 'email', label: 'E-mail', required: true },
  { field: 'phone', label: 'Telefon', required: false },
  { field: 'company', label: 'Firma', required: false },
];

const NONE_VALUE = '__none__';

function autoDetect(headers: string[], rows: string[][], field: CrmField): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim();
    if (field === 'name' && /jm[eé]no|name|first.?name|full.?name|kontakt|p[rř][ií]jmen|osloveni/.test(h)) return i;
    if (field === 'email' && /e-?mail|mail/.test(h)) return i;
    if (field === 'phone' && /telefon|phone|mobil|tel\.?$/.test(h)) return i;
    if (field === 'company' && /firma|company|spole[čc]nost|organization|org/.test(h)) return i;
  }
  if (rows.length > 0) {
    for (let i = 0; i < headers.length; i++) {
      const samples = rows.slice(0, 5).map(r => r[i] || '');
      if (field === 'email' && samples.some(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) return i;
      if (field === 'phone' && samples.some(s => /^\+?\d[\d\s\-]{6,}$/.test(s.trim()))) return i;
    }
  }
  return -1;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',' || ch === ';') { result.push(current.trim()); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function ImportProspectsDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<Record<CrmField, number>>({ name: -1, email: -1, phone: -1, company: -1 });
  const [sourceName, setSourceName] = useState('');
  const [interactionType, setInteractionType] = useState<ProspectInteractionType>('lead_magnet_download');
  const [importedCount, setImportedCount] = useState(0);

  const reset = useCallback(() => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setFieldMap({ name: -1, email: -1, phone: -1, company: -1 });
    setSourceName('');
    setInteractionType('lead_magnet_download');
    setImportedCount(0);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        toast.error('CSV soubor musí mít alespoň záhlaví a jeden řádek');
        return;
      }
      const hdrs = parsed[0];
      const dataRows = parsed.slice(1).filter(r => r.some(c => c.length > 0));
      setHeaders(hdrs);
      setRows(dataRows);

      const detected: Record<CrmField, number> = { name: -1, email: -1, phone: -1, company: -1 };
      const used = new Set<number>();
      for (const f of CRM_FIELDS) {
        const idx = autoDetect(hdrs, dataRows, f.field);
        if (idx >= 0 && !used.has(idx)) {
          detected[f.field] = idx;
          used.add(idx);
        }
      }
      setFieldMap(detected);
      setStep('mapping');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    const { name: nameIdx, email: emailIdx, phone: phoneIdx, company: companyIdx } = fieldMap;

    if (nameIdx === -1 && emailIdx === -1) {
      toast.error('Namapujte alespoň Jméno nebo E-mail');
      return;
    }
    if (!sourceName.trim()) {
      toast.error('Zadejte název zdroje');
      return;
    }

    setStep('importing');
    let count = 0;

    for (const row of rows) {
      const name = nameIdx >= 0 ? row[nameIdx] || '' : '';
      const email = emailIdx >= 0 ? row[emailIdx] || '' : '';
      if (!name && !email) continue;

      const prospect = {
        name: name || email.split('@')[0] || 'Neznámý',
        email,
        phone: phoneIdx >= 0 ? row[phoneIdx] || null : null,
        company: companyIdx >= 0 ? row[companyIdx] || null : null,
        status: 'new' as const,
        notes: [],
      };

      const { data, error } = await supabase
        .from('prospects' as any)
        .insert(prospect as any)
        .select('id')
        .single();

      if (error) { console.warn('Failed to insert prospect', error); continue; }

      if (data) {
        await supabase
          .from('prospect_interactions' as any)
          .insert({
            prospect_id: (data as any).id,
            type: interactionType,
            title: sourceName.trim(),
            occurred_at: new Date().toISOString(),
          } as any);
      }
      count++;
    }

    setImportedCount(count);
    setStep('done');
    queryClient.invalidateQueries({ queryKey: ['prospects'] });
    queryClient.invalidateQueries({ queryKey: ['prospect_interactions'] });
  };

  const handleClose = () => { reset(); onOpenChange(false); };

  // Build preview using only mapped columns
  const mappedFields = CRM_FIELDS.filter(f => fieldMap[f.field] >= 0);
  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import zájemců z CSV</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Nahrajte CSV soubor s kontakty'}
            {step === 'mapping' && 'Přiřaďte sloupce z CSV a nastavte zdroj'}
            {step === 'importing' && 'Probíhá import...'}
            {step === 'done' && 'Import dokončen'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Vyberte CSV soubor</p>
            <Input type="file" accept=".csv,.txt" onChange={handleFileChange} className="max-w-xs" />
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            {/* Source & type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zdroj / lead magnet *</Label>
                <Input
                  placeholder="Např. Webinář: Facebook Ads 2026"
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Typ interakce</Label>
                <Select value={interactionType} onValueChange={v => setInteractionType(v as ProspectInteractionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INTERACTION_TYPE_LABELS) as [ProspectInteractionType, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field mapping — 4 rows, user picks CSV column for each */}
            <div>
              <Label className="mb-3 block">Mapování sloupců <span className="text-muted-foreground font-normal">({headers.length} sloupců v CSV)</span></Label>
              <div className="space-y-2">
                {CRM_FIELDS.map(({ field, label, required }) => (
                  <div key={field} className="flex items-center gap-3">
                    <span className="text-sm w-24 shrink-0">
                      {label} {required && <span className="text-destructive">*</span>}
                    </span>
                    <Select
                      value={fieldMap[field] >= 0 ? String(fieldMap[field]) : NONE_VALUE}
                      onValueChange={v => setFieldMap(prev => ({ ...prev, [field]: v === NONE_VALUE ? -1 : Number(v) }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="— Nepřiřazeno —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>— Nepřiřazeno —</SelectItem>
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {h}
                            {rows[0]?.[i] ? ` (${rows[0][i].slice(0, 30)})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldMap[field] >= 0 && (
                      <Badge variant="secondary" className="text-xs shrink-0">✓</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview of mapped data */}
            {mappedFields.length > 0 && (
              <div>
                <Label className="mb-2 block">Náhled ({rows.length} řádků celkem)</Label>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {mappedFields.map(f => (
                          <TableHead key={f.field} className="text-xs">{f.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, ri) => (
                        <TableRow key={ri}>
                          {mappedFields.map(f => (
                            <TableCell key={f.field} className="text-xs">
                              {row[fieldMap[f.field]] || '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {rows.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-1">… a dalších {rows.length - 5} řádků</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Zrušit</Button>
              <Button onClick={handleImport} disabled={!sourceName.trim() || (fieldMap.name === -1 && fieldMap.email === -1)}>
                <FileText className="h-4 w-4 mr-1.5" />
                Importovat {rows.length} zájemců
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Importuji zájemce...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-semibold">Importováno {importedCount} zájemců</p>
            <p className="text-sm text-muted-foreground">Zdroj: {sourceName} · {INTERACTION_TYPE_LABELS[interactionType]}</p>
            <Button onClick={handleClose}>Zavřít</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
