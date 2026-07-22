import { Router } from "express";

const router = Router();

router.post("/generate", async (req, res) => {
  try {
    const { text } = req.body as { text?: unknown };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "text field is required and must be a non-empty string" });
      return;
    }

    if (text.length > 50000) {
      res.status(400).json({ error: "text is too long (max 50,000 characters)" });
      return;
    }

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      req.log.error("GEMINI_API_KEY is not configured");
      res.status(500).json({ error: "AI service is not configured. Please set GEMINI_API_KEY." });
      return;
    }

    // Dynamic import to keep bundle size manageable
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a study assistant expert. Extract the most important concepts from the following text and generate highly effective study flashcards.

RULES:
- Return ONLY a valid JSON array. No markdown, no code blocks, no explanations.
- Each object must have exactly two keys: "question" and "answer".
- Generate between 5 and 20 flashcards depending on content richness.
- Questions should be specific and test understanding, not memorization of definitions alone.
- Answers should be concise but complete (1-3 sentences).

TEXT TO PROCESS:
${text}

JSON ARRAY OUTPUT:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Strip any accidental markdown code fences
    let cleaned = responseText;
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    let flashcards: unknown;
    try {
      flashcards = JSON.parse(cleaned);
    } catch {
      req.log.error({ responseText }, "Failed to parse Gemini JSON response");
      res.status(500).json({ error: "AI returned an invalid response. Please try again." });
      return;
    }

    if (!Array.isArray(flashcards)) {
      req.log.error({ flashcards }, "Gemini response is not an array");
      res.status(500).json({ error: "AI returned an unexpected format. Please try again." });
      return;
    }

    // Validate and sanitize each card
    const valid = flashcards.filter(
      (c): c is { question: string; answer: string } =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Record<string, unknown>).question === "string" &&
        typeof (c as Record<string, unknown>).answer === "string",
    );

    if (valid.length === 0) {
      res.status(500).json({ error: "No valid flashcards could be generated from this content." });
      return;
    }

    res.json({ flashcards: valid });
  } catch (err) {
    req.log.error({ err }, "Error in /generate");
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

export default router;
