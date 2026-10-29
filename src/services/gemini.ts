import type { DiscoveredTrack } from '../types';

export function getGeminiKey(): string {
  return localStorage.getItem('moodpulse_gemini_api_key') || '';
}

export function setGeminiKey(key: string) {
  localStorage.setItem('moodpulse_gemini_api_key', key.trim());
}

export async function askGemini(prompt: string, jsonMode: boolean = false): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please enter your key in the Settings menu.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini API');
  return text;
}

export async function generateCustomScenario(description: string) {
  const prompt = `Analyze this music listening scenario description: "${description}".
Output a JSON object with exactly these fields:
- "name": Short scenario name (maximum 3-4 words)
- "description": 1 concise sentence describing the sonic atmosphere
- "icon": A single icon name from this list: [Sun, Moon, Brain, Code, Coffee, Sparkles, CloudRain, Zap, Flame, Compass, Heart, Headphones, Car]
- "color": A hex color code (e.g. #3b82f6) that fits the mood
- "valence": estimated valence from 0.0 (sad/melancholic) to 1.0 (happy/euphoric)
- "energy": estimated energy from 0.0 (chill/quiet) to 1.0 (intense/fast)`;

  const res = await askGemini(prompt, true);
  return JSON.parse(res);
}

export async function estimateTrackAcoustics(title: string, artist: string) {
  const prompt = `For the song "${title}" by "${artist}", estimate its psychoacoustic properties.
Return JSON with:
- "valence": number between 0.0 (sad/dark) and 1.0 (happy/cheerful)
- "energy": number between 0.0 (calm/chill) and 1.0 (fast/intense)
- "tempo": estimated BPM (e.g. 120)
- "primaryScenarioMatch": Choose the closest scenario from [Driving (Day), Driving (Night), Deep Work, Projects & Coding, Chilling & Unwinding, Doing Chores, Cathartic Purge, Dopamine Engine]`;

  const res = await askGemini(prompt, true);
  return JSON.parse(res);
}

export async function discoverMatchingTracks(scenarioName: string, centroid: [number, number]): Promise<DiscoveredTrack[]> {
  const prompt = `As a psychoacoustic music recommender, suggest 5 real songs matching the scenario "${scenarioName}" with target valence ${centroid[0].toFixed(2)} and energy ${centroid[1].toFixed(2)}.
Return a JSON array of objects with:
- "title": song title
- "artist": artist name
- "scenario": "${scenarioName}"
- "reason": concise 1-sentence psychoacoustic justification
- "valence": estimated valence 0.0-1.0
- "energy": estimated energy 0.0-1.0`;

  const res = await askGemini(prompt, true);
  return JSON.parse(res);
}
