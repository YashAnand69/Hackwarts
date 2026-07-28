import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined. AI matchmaking will fall back to local rule-based matching.");
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// API: Matchmaking using Gemini
app.post("/api/matchmaking", async (req, res) => {
  const { currentProfile, allProfiles } = req.body;

  if (!currentProfile || !allProfiles || !Array.isArray(allProfiles)) {
    return res.status(400).json({ error: "Invalid currentProfile or allProfiles array." });
  }

  // Filter out current user from candidates
  const candidates = allProfiles.filter(p => p.id !== currentProfile.id);

  if (candidates.length === 0) {
    return res.json({ matches: [] });
  }

  // If Gemini client is not initialized, fallback to rule-based matching
  if (!ai) {
    console.log("No Gemini API key found, running fallback local matching...");
    const matches = candidates.map(candidate => {
      // Simple tag overlaps
      const commonTeachLearn = candidate.skills.filter((s: string) => currentProfile.needs.includes(s));
      const commonLearnTeach = candidate.needs.filter((n: string) => currentProfile.skills.includes(n));
      const commonInterests = Array.from(new Set([...commonTeachLearn, ...commonLearnTeach]));
      
      const overlapCount = commonInterests.length;
      const score = Math.min(30 + (overlapCount * 25) + Math.round(candidate.rating * 5), 100);

      const icebreaker = `Hey ${candidate.displayName}! I saw that you can teach ${candidate.skills[0] || 'skills'} and I'm really looking to learn that. Would you be down for a quick skill exchange?`;
      const reasoning = `Matches your learning need for: ${commonInterests.join(', ') || 'skills'}. Friendly neighbor with a high community rating!`;

      return {
        userId: candidate.id,
        compatibilityScore: score,
        commonInterests,
        icebreaker,
        reasoning
      };
    });

    return res.json({ matches });
  }

  try {
    const prompt = `
      You are a smart matchmaking assistant for a community skill-sharing platform.
      We want to find the best skill-swap matches for the active user.
      
      Active User Profile:
      - Name: ${currentProfile.displayName}
      - Skills Can Teach: ${currentProfile.skills.join(", ")}
      - Needs Wants to Learn: ${currentProfile.needs.join(", ")}
      - Bio: "${currentProfile.bio}"
      
      Candidates Profiles:
      ${candidates.map((c, i) => `
      Candidate #${i+1}:
      - ID: ${c.id}
      - Name: ${c.displayName}
      - Skills Can Teach: ${c.skills.join(", ")}
      - Needs Wants to Learn: ${c.needs.join(", ")}
      - Bio: "${c.bio}"
      - Community Rating: ${c.rating} / 5
      `).join("\n")}
      
      For each candidate, calculate:
      1. A compatibility score (0 to 100) based on:
         - How well the active user's skills match the candidate's needs (giving teaching opportunities).
         - How well the candidate's skills match the active user's needs (giving learning opportunities).
         - Alignment of general interests from their bio.
      2. An array of 'commonInterests' (specific overlapping skills or subjects).
      3. A personalized conversational 'icebreaker' message that the active user can send to this candidate to initiate a swap. Reference their specific profile details warmly.
      4. A brief, 1-sentence 'reasoning' explaining why they are a good match.
      
      Return a structured list of matches for all candidates.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  userId: { type: Type.STRING, description: "The ID of the candidate profile matched" },
                  compatibilityScore: { type: Type.INTEGER, description: "Compatibility score between 0 and 100" },
                  commonInterests: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific skills or topics they can trade"
                  },
                  icebreaker: { type: Type.STRING, description: "A highly friendly and customized 1-2 sentence icebreaker message" },
                  reasoning: { type: Type.STRING, description: "One sentence reasoning for this score" }
                },
                required: ["userId", "compatibilityScore", "commonInterests", "icebreaker", "reasoning"]
              }
            }
          },
          required: ["matches"]
        }
      }
    });

    const resultText = response.text || "{}";
    const matchesData = JSON.parse(resultText);
    res.json(matchesData);

  } catch (error) {
    console.error("Matchmaking error with Gemini:", error);
    res.status(500).json({ error: "Failed to process matchmaking with Gemini." });
  }
});

// API: Suggest tags based on a bio
app.post("/api/suggest-tags", async (req, res) => {
  const { bio, type } = req.body; // type is "teach" or "learn"

  if (!bio) {
    return res.status(400).json({ error: "Bio is required for suggesting tags." });
  }

  if (!ai) {
    // Basic local fallback
    const mockSuggestions = type === "teach" ? ["Communication", "Public Speaking", "Creativity"] : ["Python Programming", "Digital Arts", "Personal Finance"];
    return res.json({ tags: mockSuggestions });
  }

  try {
    const prompt = `
      Based on the following user bio/description, extract and suggest up to 4 concise skill tags (each 1-3 words max) that this user might be able to ${type === "teach" ? "teach/share with others" : "benefit from learning"}.
      
      User Bio: "${bio}"
      
      Return as a flat JSON array of strings.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted suggested skills or interests tags"
            }
          },
          required: ["tags"]
        }
      }
    });

    const resultText = response.text || "{}";
    const tagsData = JSON.parse(resultText);
    res.json(tagsData);

  } catch (error) {
    console.error("Suggest tags error:", error);
    res.status(500).json({ error: "Failed to suggest tags." });
  }
});

// -------------------------------------------------------------
// Vite Dev Server / Static Assets
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production build from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
