import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Plus, History, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  fetchConversations,
  fetchConversationMessages,
  createConversation,
  saveMessage,
  updateConversationTimestamp,
  deleteConversation as deleteConv,
  type Conversation,
} from '@/services/assistantHistory';
import { parseActionsFromContent, type CrmAction } from '@/services/crmActions';
import { ActionCard } from './ActionCard';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/agency-assistant`;

const QUICK_ACTIONS = [
  { label: '💰 Nacenit službu pro klienta', message: 'Potřebuji nacenit službu pro klienta. Poraď mi jaký balíček vybrat, kolik účtovat a jaké nastavit odměny kolegům.' },
  { label: '📊 Přehled aktivních zakázek', message: 'Ukaž mi přehled aktivních zakázek a klientů – kolik jich máme, jaké služby běží a jaký je celkový MRR.' },
  { label: '📊 Přehled aktivních zakázek', message: 'Ukaž mi přehled aktivních zakázek a klientů – kolik jich máme, jaké služby běží a jaký je celkový MRR.' },
  { label: '🔥 Nedávné leady a pipeline', message: 'Jaké máme aktuální leady v pipeline? Ukaž mi nedávné leady, jejich stav a odhadovanou hodnotu.' },
  { label: '📖 Jak probíhá onboarding?', message: 'Jaký je postup onboardingu nového klienta? Co potřebuji za přístupy a podklady?' },
  { label: '📋 Poslední vícepráce', message: 'Ukaž mi přehled nedávných víceprací – které čekají na schválení, které jsou rozpracované a kolik to je celkem.' },
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

type View = 'chat' | 'history';

export function AgencyAssistant({ open, onClose }: AgencyAssistantProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<View>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && inputRef.current && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, view]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = useCallback(async () => {
    setLoadingHistory(true);
    const data = await fetchConversations();
    setConversations(data);
    setLoadingHistory(false);
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    const data = await fetchConversationMessages(conversationId);
    setMessages(data);
    setActiveConversationId(conversationId);
    setView('chat');
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    const ok = await deleteConv(id);
    if (ok) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } else {
      toast.error('Nepodařilo se smazat konverzaci');
    }
  }, [activeConversationId]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setView('chat');
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create or reuse conversation
    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(text.trim());
      setActiveConversationId(convId);
    }
    if (convId) {
      saveMessage(convId, userMsg);
      updateConversationTimestamp(convId);
    }

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
        onDone: () => {
          setIsLoading(false);
          if (convId && assistantSoFar) {
            saveMessage(convId, { role: 'assistant', content: assistantSoFar });
          }
        },
        onError: (msg) => {
          toast.error(msg);
          setIsLoading(false);
        },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error('Nepodařilo se spojit s Dandroidem');
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

  const openHistory = () => {
    loadConversations();
    setView('history');
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-[calc(100%-2rem)] sm:w-[440px] h-[70vh] max-h-[600px] flex flex-col bg-background border rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          {view === 'history' ? (
            <Button variant="ghost" size="icon" onClick={() => setView('chat')} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              🤖
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold">
              {view === 'history' ? 'Historie rozhovorů' : 'Dandroid'}
            </h3>
            {view === 'chat' && (
              <p className="text-[10px] text-muted-foreground">Ceník · SOP · CRM · Pipeline · Vícepráce</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {view === 'chat' && (
            <>
              <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8" title="Nový rozhovor">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={openHistory} className="h-8 w-8" title="Historie">
                <History className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'history' ? (
        <ScrollArea className="flex-1">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <History className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Zatím žádné rozhovory</p>
              <Button variant="outline" size="sm" onClick={startNewChat}>
                <Plus className="h-3 w-3 mr-1" /> Začít nový rozhovor
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors ${
                    activeConversationId === conv.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => loadConversationMessages(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(conv.updated_at), 'd. MMM yyyy, HH:mm', { locale: cs })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Čau! Jak ti můžu pomoct? 👋</p>
                  <p className="text-xs text-muted-foreground mt-1">Poradím s nabídkami, cenami, odměnami i interními procesy.</p>
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
              {messages.map((msg, i) => {
                if (msg.role === 'assistant') {
                  const { text, actions } = parseActionsFromContent(msg.content);
                  return (
                    <div key={i} className="flex justify-start">
                      <div className="max-w-[85%]">
                        {text && (
                          <div className="rounded-xl px-3 py-2 text-sm bg-muted">
                            <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted/50 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_hr]:my-2 [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:mt-2 [&_h3]:mb-1">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ href, children, ...props }) => {
                                    if (href?.startsWith('/sop/') || href === '/feedback') {
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
                                {text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                        {actions.map((action, j) => (
                          <ActionCard key={j} action={action} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

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
        </>
      )}
    </div>
  );
}
