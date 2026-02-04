import Groq from "groq-sdk";

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

export async function chat(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}

export async function getEmbedding(text: string): Promise<number[]> {
  // Use Groq's Llama to generate a simple text hash as embedding
  // For real production, use a proper embedding API.
  // Here we use a lightweight approach: generate a fixed-dimension
  // vector from the text using a deterministic hash.
  const vector: number[] = [];
  const seed = text.toLowerCase().trim();
  for (let i = 0; i < 128; i++) {
    let hash = 0;
    const chunk = seed + i.toString();
    for (let j = 0; j < chunk.length; j++) {
      hash = (hash * 31 + chunk.charCodeAt(j)) | 0;
    }
    vector.push(Math.sin(hash) * 0.5 + 0.5);
  }
  // L2 normalize
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
