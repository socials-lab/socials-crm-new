-- Assistant conversation history tables

CREATE TABLE public.assistant_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL DEFAULT 'Nová konverzace',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.assistant_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assistant_conversations_user_id ON public.assistant_conversations(user_id);
CREATE INDEX idx_assistant_messages_conversation_id ON public.assistant_messages(conversation_id);

-- RLS
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own conversations
CREATE POLICY "Users manage own conversations"
ON public.assistant_conversations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only see/manage messages in their own conversations
CREATE POLICY "Users manage own messages"
ON public.assistant_messages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assistant_conversations
        WHERE id = assistant_messages.conversation_id
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assistant_conversations
        WHERE id = assistant_messages.conversation_id
        AND user_id = auth.uid()
    )
);

-- Auto-update updated_at
CREATE TRIGGER update_assistant_conversations_updated_at
    BEFORE UPDATE ON public.assistant_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
