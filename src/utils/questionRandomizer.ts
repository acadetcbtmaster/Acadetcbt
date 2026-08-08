import { Question } from '../types';

/**
 * Fisher-Yates (Knuth) Shuffle algorithm for unbiased random shuffling
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Selects different random, non-repeated questions for a selected course.
 * Ensures no repeated questions in the same session.
 * Prioritizes questions that the user has not seen yet in this course.
 */
export function selectRandomQuestions(
  allQuestions: Question[],
  courseId: string,
  topicId: string = 'all',
  difficulty: string = 'all',
  count: number | 'unlimited' = 5,
  seenQuestionIds: string[] = []
): { selected: Question[]; newlySeenIds: string[] } {
  // 1. Filter by status (Published)
  let pool = allQuestions.filter((q) => q.status === 'Published');

  // 2. Filter by course
  if (courseId) {
    pool = pool.filter((q) => q.courseId === courseId);
  }

  // 3. Filter by topic if specified
  if (topicId && topicId !== 'all') {
    pool = pool.filter((q) => q.topicId === topicId);
  }

  // 4. Filter by difficulty if specified
  if (difficulty && difficulty !== 'all') {
    pool = pool.filter((q) => q.difficulty === difficulty);
  }

  // Fallback to general published pool if filter yields empty
  if (pool.length === 0) {
    pool = allQuestions.filter((q) => q.status === 'Published');
  }

  // 5. Strict Deduplication by ID and normalized question text
  const uniquePoolMap = new Map<string, Question>();
  pool.forEach((q) => {
    const key = q.id || q.question.trim().toLowerCase();
    if (!uniquePoolMap.has(key)) {
      uniquePoolMap.set(key, q);
    }
  });
  const uniquePool = Array.from(uniquePoolMap.values());

  const targetCount = count === 'unlimited' ? uniquePool.length : count;

  // 6. Separate unseen vs seen questions
  const seenSet = new Set(seenQuestionIds || []);
  const unseenPool = uniquePool.filter((q) => !seenSet.has(q.id));

  let candidatePool: Question[] = [];

  if (unseenPool.length >= targetCount) {
    // Sufficient unseen questions available
    candidatePool = shuffleArray(unseenPool).slice(0, targetCount);
  } else if (unseenPool.length > 0) {
    // Take all unseen questions + fill remaining count from shuffled seen pool
    const shuffledUnseen = shuffleArray(unseenPool);
    const seenPool = uniquePool.filter((q) => seenSet.has(q.id));
    const shuffledSeen = shuffleArray(seenPool);

    candidatePool = [...shuffledUnseen, ...shuffledSeen].slice(0, targetCount);
  } else {
    // All questions have been seen before: shuffle full unique pool completely
    candidatePool = shuffleArray(uniquePool).slice(0, targetCount);
  }

  // 7. Final pass to ensure absolutely ZERO duplicates in the returned session
  const finalSelected: Question[] = [];
  const selectedKeys = new Set<string>();

  for (const q of shuffleArray(candidatePool)) {
    const key = q.id || q.question.trim().toLowerCase();
    if (!selectedKeys.has(key)) {
      selectedKeys.add(key);
      finalSelected.push(q);
    }
    if (finalSelected.length >= targetCount) break;
  }

  const newlySeenIds = finalSelected.map((q) => q.id);

  return { selected: finalSelected, newlySeenIds };
}
