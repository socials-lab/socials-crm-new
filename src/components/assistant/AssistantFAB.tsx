import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgencyAssistant } from './AgencyAssistant';

export function AssistantFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          className="fixed bottom-20 md:bottom-6 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
        >
          <Bot className="h-5 w-5" />
          <span className="sr-only">AI Asistent</span>
        </Button>
      )}
      <AgencyAssistant open={open} onClose={() => setOpen(false)} />
    </>
  );
}
