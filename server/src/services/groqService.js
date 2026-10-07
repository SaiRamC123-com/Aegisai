import axios from "axios";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const apiKey = () => {
  const key = process.env.GROQ_API_KEY;
  return key && key !== "your_groq_key" ? key : null;
};

const model = () => process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

async function callGroq(messages, { temperature = 0.4, max_tokens = 350 } = {}) {
  const { data } = await axios.post(
    GROQ_URL,
    { model: model(), messages, temperature, max_tokens },
    {
      headers: { Authorization: `Bearer ${apiKey()}` },
      timeout: 15000,
    }
  );
  return data.choices?.[0]?.message?.content?.trim() || "";
}

const zoneContext = (zones) =>
  [...zones]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(
      (z) =>
        `- ${z.name}: ${z.hazard} risk ${z.score}/100 (${z.level}); rain ${z.weather.rain1h} mm/h, temp ${z.weather.temp}°C, humidity ${z.weather.humidity}%; top driver: ${z.factors[0]?.label}`
    )
    .join("\n");

function localReply(question, zones) {
  const q = question.toLowerCase();
  const mentioned = zones.find((z) => q.includes(z.name.toLowerCase()));
  if (mentioned) {
    return `${mentioned.name} currently has ${mentioned.level} ${mentioned.hazard} risk (score ${mentioned.score}/100). Main driver: ${mentioned.factors[0]?.label}. Stay alert and check the Alerts page for updates.`;
  }
  const top = [...zones].sort((a, b) => b.score - a.score).slice(0, 3);
  return `Highest risk right now: ${top
    .map((z) => `${z.name} (${z.score}, ${z.level})`)
    .join(", ")}. Ask me about a specific zone for details.`;
}

export async function chatWithAegis(messages, zones) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  if (!apiKey()) return { reply: localReply(lastUser, zones), source: "fallback" };

  const system = {
    role: "system",
    content: `You are AegisAI, a disaster-risk assistant for city flood and heat monitoring.
Use ONLY the live data below. Never invent numbers. Keep answers under 120 words, clear and calm, with practical safety advice when risk is high.

LIVE ZONE DATA:
${zoneContext(zones)}`,
  };

  try {
    const reply = await callGroq([system, ...messages.slice(-10)]);
    return { reply: reply || localReply(lastUser, zones), source: "groq" };
  } catch (err) {
    console.warn("Groq chat failed:", err.message);
    return { reply: localReply(lastUser, zones), source: "fallback" };
  }
}

export async function explainZone(result) {
  const factors = result.factors
    .map((f) => `${f.label}: ${f.contribution} points`)
    .join("; ");

  const template = `${result.name} is at ${result.level} ${result.hazard} risk (${result.score}/100). The biggest contributor is ${result.factors[0]?.label}. ${
    result.score >= 55
      ? "Avoid low-lying areas, keep emergency supplies ready, and follow official alerts."
      : "No immediate action needed, but keep monitoring conditions."
  }`;

  if (!apiKey()) return { explanation: template, source: "fallback" };

  try {
    const explanation = await callGroq(
      [
        {
          role: "system",
          content:
            "You explain disaster-risk scores to residents in plain language. 2-3 sentences, then one recommended action starting with 'Action:'. No markdown.",
        },
        {
          role: "user",
          content: `Zone: ${result.name}. Hazard: ${result.hazard}. Score: ${result.score}/100 (${result.level}). Contributing factors: ${factors}. Weather: rain ${result.weather.rain1h} mm/h, temp ${result.weather.temp}°C, humidity ${result.weather.humidity}%.`,
        },
      ],
      { max_tokens: 200 }
    );
    return { explanation: explanation || template, source: "groq" };
  } catch (err) {
    console.warn("Groq explain failed:", err.message);
    return { explanation: template, source: "fallback" };
  }
}