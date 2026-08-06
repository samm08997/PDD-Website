import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();
const GROQ_MODEL = "llama-3.3-70b-versatile";

router.post("/quiz", async (req, res) => {
  const { flashcards } = req.body as { flashcards?: { question: string; answer: string }[] };

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    res.status(400).json({ error: "flashcards array is required" });
    return;
  }

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "AI is not configured. Please add GROQ_API_KEY to your .env file." });
    return;
  }

  const groq = new Groq({ apiKey });
  const cardsText = flashcards.map((c, i) => `Card ${i + 1}:\nQ: ${c.question}\nA: ${c.answer}`).join("\n\n");

  const prompt = `You are an expert quiz generator. I will give you a list of flashcards (question + answer pairs).
For EACH flashcard, generate a Multiple Choice Question (MCQ).

FLASHCARDS:
${cardsText}

STRICT RULES:
- Return ONLY a raw JSON array — no markdown, no code blocks, no extra text.
- The array must have the SAME number of items as the flashcards provided.
- Each object must have:
  - "question": string (the quiz question, reworded from the flashcard question)
  - "options": array of exactly 4 strings (A, B, C, D options)
  - "correctIndex": integer 0–3 (index of the correct answer in the options array)
  - "explanation": string (a thorough 2-3 sentence explanation of why the correct answer is right)
- The 3 wrong options (distractors) must be plausible but clearly incorrect to someone who studied the material.
- Randomise which index (0, 1, 2, or 3) holds the correct answer — do NOT always put it at index 0.

RETURN FORMAT (raw JSON array only):
[{"question":"...","options":["A","B","C","D"],"correctIndex":2,"explanation":"..."}]`;

  try {
    req.log.info(`Generating quiz with Groq (${GROQ_MODEL})...`);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a quiz generator. Always respond with ONLY a valid JSON array. No markdown, no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!responseText) throw new Error("Groq returned an empty response");

    let cleaned = responseText;
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    const arrayStart = cleaned.indexOf("[");
    if (arrayStart > 0) cleaned = cleaned.slice(arrayStart);

    const quizData = JSON.parse(cleaned);

    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("AI returned empty or invalid quiz data");
    }

    req.log.info(`Groq quiz success — ${quizData.length} questions`);
    res.json({ quiz: quizData });

  } catch (err: unknown) {
    req.log.error({ err }, "Groq quiz generation failed");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(503).json({ error: `Quiz generation failed: ${message}` });
  }
});

export default router;
