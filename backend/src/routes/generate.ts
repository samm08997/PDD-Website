import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

// Best free Groq model: llama-3.3-70b-versatile — very smart, very fast
const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildPrompt(topic: string, notes: string): string {
  const hasNotes = notes && notes.trim().length > 0;

  return `You are an elite AI tutor and subject-matter expert. A student wants to master a specific topic.

AUTO-CORRECT: Silently fix any spelling mistakes in the input before doing anything else.

═══ STUDENT INPUT ═══════════════════════════════════════════
TITLE (the main topic, autocorrect if misspelled): ${topic}
DETAILED EXPLANATION / SUBTOPICS (autocorrect if misspelled):
${hasNotes ? notes : "(none provided — infer the most important subtopics from the title)"}
═══════════════════════════════════════════════════════════════

STEP 1 — UNDERSTAND CONTEXT
- Read BOTH the title AND the explanation together.
- Questions MUST target the specific subtopics listed. If the student says "Python — decorators, generators", ask ONLY about those — not generic Python.
- If no explanation is given, infer the core subtopics from the title.

STEP 2 — DETECT DOMAIN
Is this a CODING / PROGRAMMING topic? (e.g. Python, JavaScript, Java, SQL, algorithms, data structures, React, etc.)
  → If YES: follow the CODING RULES below.
  → If NO (science, history, politics, culture, math, etc.): follow the NON-CODING RULES below.

═══════════════════════════════════════════════════════════════
CODING RULES (only if the topic is programming/coding):

QUESTIONS — Mix ALL of these types across the 10 cards (2-3 of each type):

TYPE A — "What does this output?" — Show a short code snippet in the question and ask what it prints/returns/throws.
Example: "What does the following Python code output?\\n\`\`\`python\\nx = [i**2 for i in range(5)]\\nprint(x[-1])\\n\`\`\`"

TYPE B — "Find the bug" — Show broken code and ask what the bug is and how to fix it.
Example: "There is a bug in this decorator. What is it and how do you fix it?\\n\`\`\`python\\ndef my_decorator(func):\\n    func()\\n    return func\\n\`\`\`"

TYPE C — "Write the code" — Ask the student to write a function, class, or snippet from scratch.
Example: "Write a Python generator function that yields Fibonacci numbers indefinitely."

TYPE D — "Explain the behaviour" — Ask WHY something behaves a certain way in code (tricky gotchas, scoping, mutability, async, etc.)
Example: "Why does modifying a list inside this function affect the original list outside it?"

TYPE E — "Compare / choose" — When should you use X vs Y? What is the difference between A and B?
Example: "What is the difference between a Python list comprehension and a generator expression? When should you use each?"

For questions containing code, embed the code snippet INSIDE the question string using \\n for newlines.

ANSWERS — For every card:
• First line: one-sentence direct answer.
• Numbered breakdown of how it works.
• Show the correct code or output as a snippet using backticks.
• Cover: gotchas, edge cases, when to use/avoid.

═══════════════════════════════════════════════════════════════
NON-CODING RULES (for science, history, politics, culture, math, etc.):

QUESTIONS — Mix diverse question types:
- Mechanism ("How does X work?"), Cause-Effect ("Why did X lead to Y?"), Compare ("X vs Y"), Application ("Give an example of X in real life"), Critique ("What are the limitations of X?"), Misconception ("Why do people wrongly believe X?")
- NEVER ask the same type twice.

ANSWERS:
• One-sentence direct answer.
• Clear bullet points covering: what, why, how, examples, edge cases, broader significance.

═══════════════════════════════════════════════════════════════
UNIVERSAL RULES:
- Generate EXACTLY 10 question-answer pairs.
- NEVER repeat question types.
- Use \\n for newlines in strings. Use backticks for code inline.
- NEVER use unescaped double-quotes inside JSON string values.

OUTPUT FORMAT — return a JSON object with a "flashcards" key:
{"flashcards": [{"question":"...","answer":"..."},{"question":"...","answer":"..."}]}`;
}

router.post("/generate", async (req, res) => {
  const { text, topic } = req.body as { text?: unknown; topic?: unknown };

  const topicStr = typeof topic === "string" ? topic.trim() : "";
  const detailsStr = typeof text === "string" ? text.trim() : "";

  if (!topicStr && !detailsStr) {
    res.status(400).json({ error: "topic or text field is required" });
    return;
  }

  if ((detailsStr || topicStr).length > 50000) {
    res.status(400).json({ error: "text is too long (max 50,000 characters)" });
    return;
  }

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "AI is not configured. Please add GROQ_API_KEY to your .env file." });
    return;
  }

  const groq = new Groq({ apiKey });
  const prompt = buildPrompt(topicStr || detailsStr, detailsStr || "");

  try {
    req.log.info(`Generating flashcards with Groq (${GROQ_MODEL})...`);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert AI tutor. You always respond with ONLY a valid JSON array — no markdown, no extra text, no code fences. Every response is a raw JSON array of objects with 'question' (string) and 'answer' (string) keys. Inside answer strings, use \\n for newlines. NEVER use unescaped double-quotes inside string values.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.75,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!responseText) {
      throw new Error("Groq returned an empty response");
    }

    // Strip markdown fences if present
    let cleaned = responseText;
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    // If model wrapped it in a JSON object like {"flashcards": [...]}, extract the array
    if (cleaned.startsWith("{")) {
      try {
        const wrapper = JSON.parse(cleaned) as Record<string, unknown>;
        const inner = Object.values(wrapper).find(Array.isArray);
        if (inner) cleaned = JSON.stringify(inner);
      } catch {
        // fall through to arrayStart extraction
      }
    }

    // Ensure it starts with [
    const arrayStart = cleaned.indexOf("[");
    if (arrayStart > 0) cleaned = cleaned.slice(arrayStart);
    // Trim any trailing garbage after the last ]
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayEnd !== -1 && arrayEnd < cleaned.length - 1) cleaned = cleaned.slice(0, arrayEnd + 1);

    const flashcards = JSON.parse(cleaned);

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("AI returned empty or non-array response");
    }

    const valid = flashcards.filter(
      (c): c is { question: string; answer: string } =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Record<string, unknown>).question === "string" &&
        typeof (c as Record<string, unknown>).answer === "string",
    );

    if (valid.length === 0) throw new Error("AI returned no valid cards");

    req.log.info(`Groq success — ${valid.length} cards generated`);
    res.json({ flashcards: valid.slice(0, 10) });

  } catch (err: unknown) {
    req.log.error({ err }, "Groq API failed");
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    res.status(503).json({
      error: `AI failed: ${message}. Please check your GROQ_API_KEY and try again.`,
    });
  }
});

export default router;
