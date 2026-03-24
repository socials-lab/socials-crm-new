import { useState } from 'react';
import { Check, X, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  type CrmAction,
  getActionLabel,
  getActionIcon,
  getActionSummary,
  executeCrmAction,
} from '@/services/crmActions';

interface ActionCardProps {
  action: CrmAction;
  onExecuted?: (message: string) => void;
}

export function ActionCard({ action, onExecuted }: ActionCardProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'executing' | 'done' | 'error' | 'dismissed'>('pending');
  const [resultMessage, setResultMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string>();

  const handleConfirm = async () => {
    setStatus('executing');
    const result = await executeCrmAction(action);
    if (result.success) {
      setStatus('done');
      setResultMessage(result.message);
      setResultUrl(result.url);
      toast.success(result.message);
      onExecuted?.(result.message);
    } else {
      setStatus('error');
      setResultMessage(result.message);
      toast.error(result.message);
    }
  };

  const handleDismiss = () => {
    setStatus('dismissed');
  };

  if (status === 'dismissed') {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
        Akce zrušena
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden mt-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b">
        <span className="text-base">{getActionIcon(action.action)}</span>
        <span className="text-xs font-semibold flex-1">{getActionLabel(action.action)}</span>
        {status === 'done' && <Check className="h-4 w-4 text-green-600" />}
        {status === 'error' && <X className="h-4 w-4 text-destructive" />}
      </div>

      {/* Summary */}
      <div className="px-3 py-2 space-y-0.5">
        {getActionSummary(action).map((line, i) => (
          <p key={i} className="text-xs text-muted-foreground">{line}</p>
        ))}
      </div>

      {/* Actions / Result */}
      <div className="px-3 py-2 border-t bg-muted/30">
        {status === 'pending' && (
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleConfirm}>
              <Check className="h-3 w-3 mr-1" /> Potvrdit
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDismiss}>
              Zrušit
            </Button>
          </div>
        )}
        {status === 'executing' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Vytvářím…
          </div>
        )}
        {(status === 'done' || status === 'error') && (
          <div className="flex items-center gap-2">
            <p className={`text-xs flex-1 ${status === 'done' ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
              {resultMessage}
            </p>
            {status === 'done' && resultUrl && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => navigate(resultUrl)}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Otevřít
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
