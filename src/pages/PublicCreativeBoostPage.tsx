import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Zap, Image, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import socialsLogo from '@/assets/socials-logo.png';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ShareOutput {
  typeName: string;
  category: string;
  baseCredits: number;
  normalCount: number;
  expressCount: number;
  credits: number;
}

interface CreativeBoostShareData {
  id: string;
  token: string;
  client_name: string;
  brand_name: string | null;
  year: number;
  month: number;
  max_credits: number;
  price_per_credit: number;
  is_active: boolean;
  valid_until: string | null;
  outputs: ShareOutput[];
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

export default function PublicCreativeBoostPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<CreativeBoostShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fetchError } = await supabase
          .rpc('get_creative_boost_share_by_token', { p_token: token });

        if (fetchError) {
          console.error('Error fetching share:', fetchError);
          setError('Nepodařilo se načíst data');
          setIsLoading(false);
          return;
        }

        if (!result || result.length === 0) {
          setIsLoading(false);
          return;
        }

        const share = result[0];
        setData({
          id: share.id,
          token: share.token,
          client_name: share.client_name,
          brand_name: share.brand_name,
          year: share.year,
          month: share.month,
          max_credits: share.max_credits,
          price_per_credit: share.price_per_credit,
          is_active: share.is_active,
          valid_until: share.valid_until,
          outputs: share.outputs || [],
        });
      } catch (err) {
        console.error('Error:', err);
        setError('Došlo k chybě');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const usedCredits = useMemo(() => {
    if (!data) return 0;
    return data.outputs.reduce((sum, o) => sum + o.credits, 0);
  }, [data]);

  const usagePercent = data ? (data.max_credits > 0 ? (usedCredits / data.max_credits) * 100 : 0) : 0;
  const isOverMax = data ? usedCredits > data.max_credits : false;

  const bannerOutputs = useMemo(() =>
    data?.outputs.filter(o => bannerCategories.includes(o.category)) ?? [], [data]);
  const videoOutputs = useMemo(() =>
    data?.outputs.filter(o => videoCategories.includes(o.category)) ?? [], [data]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Chyba</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
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

  const renderOutputRows = (outputs: ShareOutput[]) =>
    outputs.filter(o => o.normalCount > 0 || o.expressCount > 0).map((output, i) => (
      <TableRow key={i}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColors[output.category])}>
              {categoryLabels[output.category] || output.category}
            </Badge>
            <span className="text-sm">{output.typeName}</span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          {output.normalCount > 0 ? output.normalCount : '-'}
        </TableCell>
        <TableCell className="text-center">
          {output.expressCount > 0 ? (
            <span className="flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              {output.expressCount}
            </span>
          ) : '-'}
        </TableCell>
        <TableCell className="text-right font-medium">{output.credits}</TableCell>
      </TableRow>
    ));

  const estimatedTotal = usedCredits * data.price_per_credit;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-center">
          <img src={socialsLogo} alt="Socials.cz" className="h-8" />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Creative Boost</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="font-medium text-foreground">{data.brand_name || data.client_name}</span>
            <span>&bull;</span>
            <span className="capitalize">{monthLabel}</span>
          </div>
        </div>

        {/* Credit usage */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Využití kreditů</h2>
              <span className={cn("text-2xl font-bold tabular-nums", isOverMax && "text-red-600")}>
                {usedCredits} / {data.max_credits}
              </span>
            </div>
            <Progress
              value={Math.min(usagePercent, 100)}
              className={cn("h-3", isOverMax && "[&>div]:bg-red-500")}
            />
            {isOverMax && (
              <p className="text-sm text-red-600 mt-2">
                Překročen maximální limit kreditů o {usedCredits - data.max_credits}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Outputs by category */}
        {bannerOutputs.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Image className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Bannery</h2>
              </div>
              <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ výstupu</TableHead>
                    <TableHead className="text-center w-[100px]">Standard</TableHead>
                    <TableHead className="text-center w-[100px]">Express</TableHead>
                    <TableHead className="text-right w-[100px]">Kredity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderOutputRows(bannerOutputs)}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {videoOutputs.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Videa</h2>
              </div>
              <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ výstupu</TableHead>
                    <TableHead className="text-center w-[100px]">Standard</TableHead>
                    <TableHead className="text-center w-[100px]">Express</TableHead>
                    <TableHead className="text-right w-[100px]">Kredity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderOutputRows(videoOutputs)}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing summary */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Souhrn</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Využité kredity:</span>
                <span className="font-medium">{usedCredits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cena za kredit:</span>
                <span className="font-medium">{formatCurrency(data.price_per_credit)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Odhadovaná fakturace:</span>
                <span className="text-xl font-bold">{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Socials.cz. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}
