import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Zap, Image, Video } from 'lucide-react';
import socialsLogo from '@/assets/socials-logo.png';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface CreativeBoostShareData {
  token: string;
  clientId: string;
  clientName: string;
  brandName: string;
  year: number;
  month: number;
  maxCredits: number;
  usedCredits: number;
  pricePerCredit: number;
  outputs: Array<{
    typeName: string;
    category: string;
    normalCount: number;
    expressCount: number;
    credits: number;
  }>;
  createdAt: string;
}

export function getCreativeBoostShares(): CreativeBoostShareData[] {
  try {
    return JSON.parse(localStorage.getItem('creative_boost_shares') || '[]');
  } catch {
    return [];
  }
}

export function saveCreativeBoostShare(data: CreativeBoostShareData) {
  const shares = getCreativeBoostShares();
  shares.push(data);
  localStorage.setItem('creative_boost_shares', JSON.stringify(shares));
}

export function getShareByToken(token: string): CreativeBoostShareData | null {
  return getCreativeBoostShares().find(s => s.token === token) ?? null;
}

const categoryLabels: Record<string, string> = {
  banner: 'Banner',
  banner_translation: 'Překlad banneru',
  banner_revision: 'Revize banneru',
  ai_photo: 'AI foto',
  video: 'Video',
  video_translation: 'Překlad videa',
  video_revision: 'Revize videa',
};

const categoryColors: Record<string, string> = {
  banner: 'bg-blue-100 text-blue-700',
  banner_translation: 'bg-cyan-100 text-cyan-700',
  banner_revision: 'bg-blue-50 text-blue-600',
  ai_photo: 'bg-amber-100 text-amber-700',
  video: 'bg-purple-100 text-purple-700',
  video_translation: 'bg-violet-100 text-violet-700',
  video_revision: 'bg-purple-50 text-purple-600',
};

const bannerCategories = ['banner', 'banner_translation', 'banner_revision', 'ai_photo'];
const videoCategories = ['video', 'video_translation', 'video_revision'];

const testData: CreativeBoostShareData = {
  token: 'test',
  clientId: 'test',
  clientName: 'Test Client s.r.o.',
  brandName: 'TestBrand',
  year: 2026,
  month: 2,
  maxCredits: 50,
  usedCredits: 31,
  pricePerCredit: 400,
  outputs: [
    { typeName: 'Meta Ads bannery 2 rozměry', category: 'banner', normalCount: 2, expressCount: 1, credits: 14 },
    { typeName: 'Výkonnostní video – Standard (3 videa)', category: 'video', normalCount: 1, expressCount: 0, credits: 12 },
    { typeName: 'AI produktová fotka', category: 'ai_photo', normalCount: 2, expressCount: 0, credits: 4 },
    { typeName: 'Revize bannerů', category: 'banner_revision', normalCount: 1, expressCount: 0, credits: 1 },
  ],
  createdAt: new Date().toISOString(),
};

export default function PublicCreativeBoostPage({ testToken }: { testToken?: string }) {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<CreativeBoostShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (testToken) {
      setData(testData);
      setIsLoading(false);
      return;
    }
    if (!token) { setIsLoading(false); return; }
    const share = getShareByToken(token);
    setData(share);
    setIsLoading(false);
  }, [token, testToken]);

  const usagePercent = data ? (data.maxCredits > 0 ? (data.usedCredits / data.maxCredits) * 100 : 0) : 0;
  const isOverMax = data ? data.usedCredits > data.maxCredits : false;

  const bannerOutputs = useMemo(() => data?.outputs.filter(o => bannerCategories.includes(o.category)) ?? [], [data]);
  const videoOutputs = useMemo(() => data?.outputs.filter(o => videoCategories.includes(o.category)) ?? [], [data]);

  const monthLabel = data ? format(new Date(data.year, data.month - 1), 'LLLL yyyy', { locale: cs }) : '';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Přehled nenalezen</h1>
            <p className="text-muted-foreground">Tento odkaz je neplatný nebo přehled neexistuje.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderOutputRows = (outputs: typeof data.outputs) =>
    outputs.filter(o => o.normalCount > 0 || o.expressCount > 0).map((output, i) => (
      <TableRow key={i}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[output.category])}>
              {categoryLabels[output.category]}
            </Badge>
            <span className="text-sm">{output.typeName}</span>
          </div>
        </TableCell>
        <TableCell className="text-center">{output.normalCount}</TableCell>
        <TableCell className="text-center">
          {output.expressCount > 0 ? (
            <span className="text-amber-600 font-medium">{output.expressCount}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-center font-medium">{output.credits}</TableCell>
      </TableRow>
    ));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-center">
          <img src={socialsLogo} alt="Socials.cz" className="h-8" />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">🎨 Creative Boost – přehled čerpání</h1>
          <p className="text-muted-foreground">
            {data.brandName} • {monthLabel}
          </p>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-sm">Vyčerpáno</span>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-bold", isOverMax && "text-destructive")}>
                    {data.usedCredits}
                  </span>
                  <span className="text-muted-foreground">/ {data.maxCredits} kreditů</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-sm">Zbývá</span>
                <div className={cn("text-2xl font-bold", isOverMax ? "text-destructive" : "text-primary")}>
                  {data.maxCredits - data.usedCredits}
                </div>
              </div>
            </div>
            <Progress
              value={Math.min(usagePercent, 100)}
              className={cn("h-3", isOverMax && "[&>div]:bg-destructive")}
            />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(usagePercent)}% kapacity využito
            </p>
          </CardContent>
        </Card>

        {/* Outputs Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Typ výstupu</TableHead>
                    <TableHead className="text-center w-[80px]">Klasické</TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3 text-amber-600" />
                        Express
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">Kredity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannerOutputs.length > 0 && (
                    <>
                      <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
                        <TableCell colSpan={4} className="py-1.5">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-700 text-xs">
                            <Image className="h-3.5 w-3.5" />
                            BANNERY & GRAFIKA
                          </div>
                        </TableCell>
                      </TableRow>
                      {renderOutputRows(bannerOutputs)}
                    </>
                  )}
                  {videoOutputs.length > 0 && (
                    <>
                      <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
                        <TableCell colSpan={4} className="py-1.5">
                          <div className="flex items-center gap-1.5 font-semibold text-purple-700 text-xs">
                            <Video className="h-3.5 w-3.5" />
                            VIDEA
                          </div>
                        </TableCell>
                      </TableRow>
                      {renderOutputRows(videoOutputs)}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-4">
                <span>
                  <span className="text-muted-foreground">Celkem kreditů:</span>
                  <span className={cn("ml-1.5 font-semibold", isOverMax && "text-destructive")}>
                    {data.usedCredits}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cena za kredit:</span>
                <span className="ml-1.5 font-medium">{formatCurrency(data.pricePerCredit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Vygenerováno {format(new Date(data.createdAt), 'd. MMMM yyyy, HH:mm', { locale: cs })}
        </p>
      </main>
    </div>
  );
}
