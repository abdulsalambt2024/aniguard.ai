import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { allowAssistantRequest } from './chat-rate-limit.mjs';
import { extractBearerToken } from './bearer-token.mjs';

type ChatRole = 'user' | 'assistant';
type ChatItem = { role: ChatRole; parts: string };

function parseBody(body: unknown): { message: string; history: ChatItem[] } | null {
  let value = body;
  if (typeof body === 'string') {
    try { value = JSON.parse(body); } catch { return null; }
  }
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  if (typeof record.message !== 'string') return null;
  const message = record.message.trim();
  if (!message || message.length > 1600) return null;

  const history = Array.isArray(record.history)
    ? record.history.slice(-8).flatMap((item): ChatItem[] => {
        if (!item || typeof item !== 'object') return [];
        const entry = item as Record<string, unknown>;
        if ((entry.role !== 'user' && entry.role !== 'assistant') || typeof entry.parts !== 'string') return [];
        return [{ role: entry.role, parts: entry.parts.slice(0, 1600) }];
      })
    : [];

  return { message, history };
}

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: Record<string, unknown>): ApiResponse;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawAuthorization = req.headers?.authorization || req.headers?.Authorization;
  const token = extractBearerToken(rawAuthorization);

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !publishableKey || !geminiApiKey) {
    return res.status(503).json({ error: 'Assistant service is not configured' });
  }

  const parsed = parseBody(req.body);
  if (!parsed) return res.status(400).json({ error: 'Invalid message payload' });

  try {
    // Verify the user's JWT with Supabase Auth. No service-role key is used here.
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    // The limiter has bounded memory and fails closed at capacity. It is still
    // per serverless instance; use a shared store before treating it as global.
    if (!allowAssistantRequest(user.id)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: [
        'You are AniGuard, an educational livestock health and farm-management assistant.',
        'You do not diagnose animals and must never say a disease is confirmed.',
        'Use wording such as possible condition, observation, or risk warning.',
        'Do not prescribe antibiotics, medicines, dosages, or treatment regimens.',
        'For severe fever, breathing difficulty, collapse, inability to stand, severe bleeding, suspected poisoning, or rapidly worsening condition, advise immediate veterinary attention.',
        'Encourage users to share observations with a qualified veterinarian and explain uncertainty.',
        'Use clear, concise language suitable for livestock farmers in India.',
      ].join(' '),
    });

    const chat = model.startChat({
      history: parsed.history.map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.parts }],
      })),
      generationConfig: { temperature: 0.25, maxOutputTokens: 700 },
    });

    const result = await chat.sendMessage(parsed.message);
    const reply = result.response.text();
    if (!reply) return res.status(502).json({ error: 'Assistant returned an empty response' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AniGuard AI route failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(502).json({ error: 'Assistant request failed' });
  }
}
