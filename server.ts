import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { localMatches } from "./src/utils/matching";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "256kb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  console.log("Gemini API initialized successfully.");
} else {
  console.warn(
    "GEMINI_API_KEY environment variable is not defined. AI matchmaking will fall back to local rule-based matching.",
  );
}

// -------------------------------------------------------------
// Helper Functions for Local Fallbacks
// -------------------------------------------------------------

function getLocalMatches(currentProfile: any, candidates: any[]) {
  return localMatches(currentProfile, candidates).map(({ user, ...match }) => ({
    ...match,
    userId: user.id,
  }));
}

function getLocalSuggestedTags(bio: string, type: "teach" | "learn") {
  const lowerBio = bio.toLowerCase();
  const possibleTags = [
    "Defense Against the Dark Arts",
    "Expecto Patronum",
    "Broomstick Flying",
    "Herbology",
    "Potions Crafting",
    "Transfiguration",
    "Charms",
    "Arithmancy",
    "Divination",
    "Care of Magical Creatures",
    "History of Magic",
    "Astronomy",
    "Ancient Runes",
    "Occlumency",
    "Legilimency",
    "Quidditch Strategy",
    "Duelling",
    "Dark Arts",
  ];
  const foundTags = possibleTags.filter((tag) =>
    lowerBio.includes(tag.toLowerCase()),
  );
  const fallbackTags =
    foundTags.length > 0
      ? foundTags.slice(0, 4)
      : type === "teach"
        ? ["Defense Against the Dark Arts", "Transfiguration", "Charms"]
        : ["Potions Crafting", "Herbology", "Care of Magical Creatures"];
  return fallbackTags;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// API: Matchmaking using Gemini
app.post("/api/matchmaking", async (req, res) => {
  const { currentProfile, allProfiles } = req.body;

  if (!currentProfile || !allProfiles || !Array.isArray(allProfiles)) {
    return res
      .status(400)
      .json({ error: "Invalid currentProfile or allProfiles array." });
  }

  const validProfile = (p: any) =>
    p &&
    typeof p.id === "string" &&
    typeof p.displayName === "string" &&
    typeof p.bio === "string" &&
    Number.isFinite(p.rating) &&
    Array.isArray(p.skills) &&
    p.skills.every((s: any) => typeof s === "string") &&
    Array.isArray(p.needs) &&
    p.needs.every((s: any) => typeof s === "string");
  if (
    allProfiles.length > 200 ||
    !validProfile(currentProfile) ||
    !allProfiles.every(validProfile)
  )
    return res.status(400).json({ error: "Invalid wizard profile data." });

  // Filter out current user from candidates
  const candidates = allProfiles.filter((p) => p.id !== currentProfile.id);

  if (candidates.length === 0) {
    return res.json({ matches: [] });
  }

  // If Gemini client is not initialized, fallback to rule-based matching
  if (!ai) {
    console.log("No Gemini API key found, running fallback local matching...");
    const matches = getLocalMatches(currentProfile, candidates);
    return res.json({ matches });
  }

  try {
    const prompt = `
      You are the Sorting Hat and a grand matchmaking master of Hogwarts School of Witchcraft and Wizardry!
      We want to find the best magical skill-swap matches for the active Hogwarts student.
      
      Active Student Profile:
      - Name: ${currentProfile.displayName}
      - Magical Arts to Teach: ${currentProfile.skills.join(", ")}
      - Magical Subjects to Learn: ${currentProfile.needs.join(", ")}
      - Wizarding Bio & Wand: "${currentProfile.bio}"
      
      Classmate Candidates Profiles:
      ${candidates
        .map(
          (c, i) => `
      Candidate #${i + 1}:
      - ID: ${c.id}
      - Name: ${c.displayName}
      - Magical Arts to Teach: ${c.skills.join(", ")}
      - Magical Subjects to Learn: ${c.needs.join(", ")}
      - Wizarding Bio & Wand: "${c.bio}"
      - Ministry Rating: ${c.rating} / 5
      `,
        )
        .join("\n")}
      
      For each candidate, calculate:
      1. A compatibility score (0 to 100) based on:
         - How well the active user's spells and magical arts match the candidate's learning needs (giving mentoring opportunities).
         - How well the candidate's spells and magical arts match the active user's learning needs (giving learning opportunities).
         - Alignment of Hogwarts Houses and magical subjects in their bios.
      2. An array of 'commonInterests' (specific overlapping magical skills, spells, potions, or subjects).
      3. A personalized, magical conversational 'icebreaker' message that the active wizard/witch can send to this candidate via Owl Post. Reference their specific House, wand wood, or spells warmly and humorously (e.g., using "By Merlin's beard!", "meet in the Library", "brew some Felix Felicis together").
      4. A brief, 1-sentence magical 'reasoning' explaining why they are an outstanding pairing (e.g., "Gryffindor and Slytherin bridge their rivalry through a shared passion for Advanced Transfiguration!").
      
      Return a structured list of matches for all candidates in the requested JSON format.
    `;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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
                  userId: {
                    type: Type.STRING,
                    description: "The ID of the candidate profile matched",
                  },
                  compatibilityScore: {
                    type: Type.INTEGER,
                    description: "Compatibility score between 0 and 100",
                  },
                  commonInterests: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific skills or topics they can trade",
                  },
                  icebreaker: {
                    type: Type.STRING,
                    description:
                      "A highly friendly and customized 1-2 sentence icebreaker message",
                  },
                  reasoning: {
                    type: Type.STRING,
                    description: "One sentence reasoning for this score",
                  },
                },
                required: [
                  "userId",
                  "compatibilityScore",
                  "commonInterests",
                  "icebreaker",
                  "reasoning",
                ],
              },
            },
          },
          required: ["matches"],
        },
      },
    });

    const resultText = response.text || "{}";
    const matchesData = JSON.parse(resultText);
    res.json(matchesData);
  } catch (error) {
    console.warn(
      "Matchmaking error with Gemini (quota or limit hit), running local rule-based fallback:",
      error,
    );
    const matches = getLocalMatches(currentProfile, candidates);
    res.json({ matches });
  }
});

// API: Suggest tags based on a bio
app.post("/api/suggest-tags", async (req, res) => {
  const { bio, type } = req.body; // type is "teach" or "learn"

  if (
    typeof bio !== "string" ||
    !bio.trim() ||
    bio.length > 5000 ||
    !["teach", "learn"].includes(type)
  ) {
    return res
      .status(400)
      .json({ error: "Bio is required for suggesting tags." });
  }

  if (!ai) {
    const tags = getLocalSuggestedTags(bio, type);
    return res.json({ tags });
  }

  try {
    const prompt = `
      Based on the following Hogwarts student bio, extract and suggest up to 4 concise magical skill tags or spell subjects (each 1-3 words max, such as "Herbology", "Expecto Patronum", "Potions Crafting", "Transfiguration") that this student might be able to ${type === "teach" ? "teach or tutor other students" : "benefit from learning or practicing"}.
      
      Student Bio: "${bio}"
      
      Return as a flat JSON array of strings under the 'tags' field.
    `;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted suggested skills or interests tags",
            },
          },
          required: ["tags"],
        },
      },
    });

    const resultText = response.text || "{}";
    const tagsData = JSON.parse(resultText);
    res.json(tagsData);
  } catch (error) {
    console.warn(
      "Suggest tags error with Gemini (quota or limit hit), running local fallback:",
      error,
    );
    const tags = getLocalSuggestedTags(bio, type);
    res.json({ tags });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the server listener if we are not in a serverless function environment (like Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
