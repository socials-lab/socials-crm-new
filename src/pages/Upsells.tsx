import { PageHeader } from '@/components/shared/PageHeader';
import { UpsellSummaryCard } from '@/components/upsells/UpsellSummaryCard';
import { useUserRole } from '@/hooks/useUserRole';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function Upsells() {
  const { canSeeFinancials, isSuperAdmin } = useUserRole();
  
  // Only users with financial access can view this page
  if (!canSeeFinancials && !isSuperAdmin) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <PageHeader 
          title="💰 Provize" 
          titleAccent="z upsellů"
          description="Přehled provizí za vícepráce a nové služby"
        />
        <Card className="p-8 text-center">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Nemáte oprávnění zobrazit tuto stránku.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="💰 Provize" 
        titleAccent="z upsellů"
        description="Přehled provizí za vícepráce a nové služby"
      />
      
      <UpsellSummaryCard />
    </div>
  );
}
