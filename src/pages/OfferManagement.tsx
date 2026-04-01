import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, PenLine } from 'lucide-react';
import Portfolio from './Portfolio';
import OfferContentEditor from './OfferContentEditor';

export default function OfferManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'portfolio';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Nabídka"
        description="Správa portfolia a obsahu veřejných nabídek"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="portfolio" className="gap-1.5">
            <ImageIcon className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-1.5">
            <PenLine className="h-4 w-4" />
            Editor nabídky
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-6">
          <Portfolio embedded />
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          <OfferContentEditor embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
