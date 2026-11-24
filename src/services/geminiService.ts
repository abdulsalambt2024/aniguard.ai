import { supabase } from '@/integrations/supabase/client';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  parts: string;
}

/**
 * Calls the same-origin authenticated API route. Gemini credentials remain server-side;
 * no VITE_GEMINI_API_KEY is ever shipped to the browser.
 */
export const sendMessageToGemini = async (
  message: string,
  history: AssistantMessage[] = []
): Promise<string> => {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) return 'Please enter a question.';
  if (trimmedMessage.length > 1600) return 'Please keep your question under 1,600 characters.';

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      return 'Please sign in again to use the AniGuard assistant.';
    }

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: trimmedMessage,
        history: history.slice(-8).map((item) => ({
          role: item.role,
          parts: String(item.parts || '').slice(0, 1600),
        })),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) return 'Your session has expired. Please sign in again.';
      if (response.status === 429) return 'The assistant is receiving too many requests. Please wait a moment and try again.';
      return 'The AniGuard assistant is temporarily unavailable. Please try again or contact a veterinarian for urgent animal-health concerns.';
    }

    return typeof payload.reply === 'string' && payload.reply.trim()
      ? payload.reply
      : 'I could not prepare a response. Please try again.';
  } catch (error) {
    console.error('AniGuard assistant request failed:', error);
    return 'Unable to reach the AniGuard assistant. Please check your connection and try again.';
  }
};
