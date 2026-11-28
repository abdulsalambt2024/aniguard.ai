import {
  HealthAnalysisResult,
  HoldSellAnalysis,
  ProfitReport,
  AppLanguage,
  DiseaseAnalysisResult,
  MarketAdvisoryResult,
  VetClinic,
} from '../types';
import { supabase } from '../src/integrations/supabase/client';

async function authenticatedAssistantRequest(message: string): Promise<string> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Please sign in again to use the AniGuard assistant.');
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message: message.slice(0, 1600), history: [] }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(response.status === 401
      ? 'Your session has expired. Please sign in again.'
      : 'The secure AniGuard assistant is temporarily unavailable.');
  }
  if (typeof payload.reply !== 'string') throw new Error('The assistant returned an invalid response.');
  return payload.reply;
}

const unavailable = (feature: string): Error =>
  new Error(`${feature} is not enabled in this prototype. No automated diagnosis or treatment recommendation has been generated.`);

export async function generateSpeech(_text: string, _language: AppLanguage): Promise<Uint8Array | null> {
  // Browser-side Gemini credentials are intentionally not supported.
  return null;
}

export async function getChatResponse(
  prompt: string,
  context: string,
  language: AppLanguage,
  _isComplex = false
): Promise<string> {
  const safePrompt = `Language: ${language}. Farmer context: ${context}. Question: ${prompt}`;
  return authenticatedAssistantRequest(safePrompt);
}

export async function analyzeVideo(
  _base64Video: string,
  _mimeType: string,
  _prompt: string,
  _language: AppLanguage
): Promise<string> {
  throw unavailable('Video analysis');
}

export async function animateImageToVideo(
  _base64Image: string,
  _mimeType: string,
  _prompt: string,
  _aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> {
  throw unavailable('Image-to-video generation');
}

export async function scanAnimalHealth(
  _base64Image: string,
  _symptoms: string,
  _language: AppLanguage
): Promise<HealthAnalysisResult> {
  // Image-based disease classification is not validated and must not be presented as a diagnosis.
  throw unavailable('Automated animal-photo classification; please submit the photo for veterinary review');
}

export async function analyzeCropDisease(
  _base64Image: string,
  _region: string,
  _language: AppLanguage
): Promise<DiseaseAnalysisResult> {
  throw unavailable('Automated crop-image classification');
}

export async function findNearbyVets(
  _lat: number,
  _lng: number,
  _language: AppLanguage
): Promise<{ text: string; clinics: VetClinic[] }> {
  return {
    text: 'A verified live veterinary directory is not connected yet. Please contact your nearest government veterinary hospital or district animal husbandry office. Do not rely on unverified clinic listings.',
    clinics: [],
  };
}

export async function getMarketAdvisory(
  _cropName: string,
  _region: string,
  _language: AppLanguage
): Promise<MarketAdvisoryResult> {
  throw unavailable('Live market advisory; current prices and sources have not been verified');
}

export async function analyzeHoldSell(
  _animal: string,
  _price: string,
  _health: string,
  _framework: string,
  _language: AppLanguage
): Promise<HoldSellAnalysis> {
  throw unavailable('AI hold/sell recommendation');
}

export async function getProfitReport(
  income: number,
  feed: number,
  vet: number,
  labor: number,
  _language: AppLanguage
): Promise<ProfitReport> {
  const values = [income, feed, vet, labor];
  if (!values.every((value) => Number.isFinite(value) && value >= 0)) {
    throw new Error('Enter valid non-negative income and expense values.');
  }
  const net = income - feed - vet - labor;
  const efficiencyScore = income > 0
    ? Math.round(Math.max(0, Math.min(100, (net / income) * 100)))
    : 0;
  return {
    netProfit: net.toFixed(2),
    expenseBreakdown: {
      feed: feed.toFixed(2),
      vet: vet.toFixed(2),
      labor: labor.toFixed(2),
      other: '0.00',
    },
    efficiencyScore,
    recommendations: [
      'This is a direct calculation from the values entered, not an AI forecast.',
      'Add transport, medicine, vaccination, utilities and other costs for a more complete estimate.',
      'Compare at least 30 days of records before making major farm decisions.',
    ],
  };
}

export async function generateFarmerStories(_region: string, _language: AppLanguage): Promise<unknown[]> {
  // Avoid generating fictional farmer testimonials and presenting them as real stories.
  return [];
}

export async function generateInstructionalVideo(_prompt: string): Promise<string> {
  throw unavailable('AI video generation');
}
