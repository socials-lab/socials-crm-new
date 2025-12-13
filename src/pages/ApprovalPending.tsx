import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, Mail } from 'lucide-react';

export default function ApprovalPending() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>Čekáme na schválení</CardTitle>
          <CardDescription>
            Váš účet byl úspěšně vytvořen, ale zatím nemáte přiřazenou roli v systému.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">{user?.email}</span>
            </div>
            <p>
              Administrátor vám brzy přiřadí přístupová práva. Jakmile se tak stane, 
              budete moci používat CRM systém.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásit se
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
