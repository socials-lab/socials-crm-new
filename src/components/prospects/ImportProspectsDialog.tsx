import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ProspectInteractionType } from '@/types/prospect';
import { INTERACTION_TYPE_LABELS } from '@/types/prospect';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ColumnMapping = 'name' | 'email' | 'phone' | 'company' | 'skip';

const COLUMN_OPTIONS: { value: ColumnMapping; label: string }[] = [
  { value: 'name', label: 'Jméno' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefon' },
  { value: 'company', label: 'Firma' },
  { value: 'skip', label: '— Přeskočit —' },
];

function autoDetectColumn(header: string): ColumnMapping {
  const h = header.toLowerCase().trim();
  if (/jm[eé]no|name|first.?name|full.?name|kontakt/.test(h)) return 'name';
  if (/e-?mail|email/.test(h)) return 'email';
  if (/telefon|phone|mobil/.test(h)) return 'phone';
  if (/firma|company|spole[čc]nost|organization/.test(h)) return 'company';
  return 'skip';
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
  const [columnMap, setColumnMap] = useState<ColumnMapping[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [interactionType, setInteractionType] = useState<ProspectInteractionType>('lead_magnet_download');
  const [importedCount, setImportedCount] = useState(0);

  const reset = useCallback(() => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setColumnMap([]);
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
      setColumnMap(hdrs.map(h => autoDetectColumn(h)));
      setStep('mapping');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    const nameIdx = columnMap.indexOf('name');
    const emailIdx = columnMap.indexOf('email');

    if (nameIdx === -1 && emailIdx === -1) {
      toast.error('Musíte namapovat alespoň Jméno nebo E-mail');
      return;
    }

    if (!sourceName.trim()) {
      toast.error('Zadejte název zdroje (lead magnet / webinář)');
      return;
    }

    setStep('importing');
    let count = 0;

    const phoneIdx = columnMap.indexOf('phone');
    const companyIdx = columnMap.indexOf('company');

    for (const row of rows) {
      const name = nameIdx >= 0 ? row[nameIdx] || '' : '';
      const email = emailIdx >= 0 ? row[emailIdx] || '' : '';
      if (!name && !email) continue;

      const prospect = {
        name: name || email.split('@')[0] || 'Neznámý',
        email: email,
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

      if (error) {
        console.warn('Failed to insert prospect', error);
        continue;
      }

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

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import zájemců z CSV</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Nahrajte CSV soubor s kontakty'}
            {step === 'mapping' && 'Zkontrolujte mapování sloupců a nastavte zdroj'}
            {step === 'importing' && 'Probíhá import...'}
            {step === 'done' && 'Import dokončen'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Vyberte CSV soubor</p>
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="max-w-xs"
            />
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INTERACTION_TYPE_LABELS) as [ProspectInteractionType, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Mapování sloupců</Label>
              <div className="flex gap-2 mb-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-medium truncate text-muted-foreground">{h}</p>
                    <Select value={columnMap[i]} onValueChange={v => {
                      const newMap = [...columnMap];
                      newMap[i] = v as ColumnMapping;
                      setColumnMap(newMap);
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Náhled dat ({rows.length} řádků celkem)</Label>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h, i) => (
                        <TableHead key={i} className="text-xs whitespace-nowrap">
                          {columnMap[i] !== 'skip' ? (
                            <Badge variant="secondary" className="text-xs">{COLUMN_OPTIONS.find(o => o.value === columnMap[i])?.label}</Badge>
                          ) : (
                            <span className="text-muted-foreground italic">přeskočeno</span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (
                          <TableCell key={ci} className={`text-xs ${columnMap[ci] === 'skip' ? 'text-muted-foreground/50' : ''}`}>
                            {cell || '—'}
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

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Zrušit</Button>
              <Button onClick={handleImport} disabled={!sourceName.trim()}>
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
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-emerald-600" />
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
