import { Router } from "express";

const router = Router();

router.post("/quiz", async (req, res) => {
  const { flashcards } = req.body as { flashcards?: { question: string; answer: string }[] };

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    res.status(400).json({ error: "flashcards array is required" });
    return;
  }

  try {
    req.log.info("Generating deterministic quiz immediately...");

    const quizData = flashcards.map((card, index) => {
      // 1. Gather other flashcards to use as wrong answers (distractors)
      const otherCards = flashcards.filter((_, i) => i !== index);
      
      // 2. Shuffle the other cards to get random distractors
      const shuffledOthers = otherCards.sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3).map((c) => c.answer);
      
      // 3. Fallback distractors if the deck has fewer than 4 cards
      const fallbacks = ["All of the above", "None of the above", "Information not provided"];
      while (distractors.length < 3) {
        distractors.push(fallbacks[distractors.length % fallbacks.length]);
      }

      // 4. Create the final 4 options and shuffle them
      const options = [card.answer, ...distractors];
      options.sort(() => 0.5 - Math.random());
      
      const correctIndex = options.indexOf(card.answer);

      return {
        question: card.question,
        options,
        correctIndex,
        explanation: `The correct answer is based directly on your flashcard.`,
      };
    });

    // Shuffle the final quiz questions
    quizData.sort(() => 0.5 - Math.random());

    req.log.info(`Deterministic quiz success — ${quizData.length} questions`);
    
    // Return up to 10 questions
    res.json({ quiz: quizData.slice(0, 10) });

  } catch (err: unknown) {
    req.log.error({ err }, "Quiz generation failed");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(503).json({ error: `Quiz generation failed: ${message}` });
  }
});

export default router;
