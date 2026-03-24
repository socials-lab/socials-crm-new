import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/agency-assistant`;

const QUICK_ACTIONS = [
  { label: 'Jak nacenit nabídku?', message: 'Jak mám správně nacenit nabídku pro nového klienta? Jaký postup mám dodržet?' },
  { label: 'Jaké jsou odměny?', message: 'Jaké jsou doporučené odměny pro kolegy podle pozice a služby?' },
  { label: 'Co potřebuji k onboardingu?', message: 'Jaké přístupy a podklady potřebuji od klienta k onboardingu?' },
  { label: 'Performance Boost kalkulace', message: 'Udělej mi kalkulaci Performance Boost pro klienta s ad spendem 300 000 Kč měsíčně.' },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!resp.ok) {
    if (resp.status === 429) { onError('Rate limit překročen, zkuste to za chvíli.'); return; }
    if (resp.status === 402) { onError('Nedostatek kreditů AI.'); return; }
    const body = await resp.json().catch(() => ({}));
    onError(body.error || 'Chyba AI služby');
    return;
  }

  if (!resp.body) { onError('Prázdná odpověď'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

interface AgencyAssistantProps {
  open: boolean;
  onClose: () => void;
}

export function AgencyAssistant({ open, onClose }: AgencyAssistantProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          toast.error(msg);
          setIsLoading(false);
        },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error('Nepodařilo se spojit s AI asistentem');
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-[calc(100%-2rem)] sm:w-[440px] h-[70vh] max-h-[600px] flex flex-col bg-background border rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Asistent</h3>
            <p className="text-[10px] text-muted-foreground">Ceník · SOP · Nabídky</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Jak ti můžu pomoct?</p>
              <p className="text-xs text-muted-foreground mt-1">Pomůžu ti s nabídkami, ceníkem i interními procesy.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => send(qa.message)}
                  className="text-xs text-left px-3 py-2 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children, ...props }) => {
                          if (href?.startsWith('/sop/')) {
                            return (
                              <a
                                {...props}
                                href={href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(href);
                                  onClose();
                                }}
                                className="text-primary underline cursor-pointer hover:text-primary/80"
                              >
                                {children}
                              </a>
                            );
                          }
                          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline" {...props}>{children}</a>;
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zeptej se na cenu, SOP, odměny…"
            rows={1}
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px] max-h-[120px]"
            style={{ height: 'auto', overflow: 'auto' }}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
