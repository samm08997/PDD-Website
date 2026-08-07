import { Router } from "express";

const router = Router();
const OLLAMA_MODEL = "qwen3:14b";

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

  const prompt = buildPrompt(topicStr || detailsStr, detailsStr || "");

  try {
    req.log.info(`Generating flashcards with Ollama (${OLLAMA_MODEL})...`);

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
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
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API returned status: ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.message?.content?.trim() ?? "";

    if (!responseText) {
      throw new Error("Ollama returned an empty response");
    }

    const json = JSON.parse(responseText);
    const flashcards = Array.isArray(json.flashcards) ? json.flashcards : Array.isArray(json) ? json : [];

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

    req.log.info(`Ollama success — ${valid.length} cards generated`);
    res.json({ flashcards: valid.slice(0, 10) });

  } catch (err: unknown) {
    req.log.error({ err }, "Ollama API failed");
    const message = err instanceof Error ? err.message : "AI generation failed";
    res.status(503).json({
      error: `AI failed: ${message}. Make sure Ollama is running locally.`,
    });
  }
});

export default router;
