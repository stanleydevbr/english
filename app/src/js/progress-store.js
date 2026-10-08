const STORAGE_KEY = 'english-lab-progress-v1';
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyState() {
  return { cards: {}, exercises: {}, answers: {}, days: {} };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidState(state) {
  const validCards = isRecord(state?.cards) && Object.values(state.cards).every((card) =>
    isRecord(card)
    && Number.isInteger(card.repetitions)
    && card.repetitions >= 0
    && Number.isInteger(card.reviews)
    && card.reviews > 0
    && typeof card.nextReviewAt === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(card.nextReviewAt));
  const validExercises = isRecord(state?.exercises) && Object.values(state.exercises).every((exercise) =>
    isRecord(exercise)
    && Number.isInteger(exercise.attempts)
    && exercise.attempts >= 0
    && Number.isInteger(exercise.correct)
    && exercise.correct >= 0
    && exercise.correct <= exercise.attempts
    && Number.isInteger(exercise.errors)
    && exercise.errors >= 0
    && exercise.correct + exercise.errors === exercise.attempts);
  const validAnswers = isRecord(state?.answers) && Object.values(state.answers).every((answer) => typeof answer === 'string');
  const validDays = isRecord(state?.days) && Object.values(state.days).every((count) => Number.isInteger(count) && count >= 0);

  return isRecord(state)
    && isRecord(state.cards)
    && isRecord(state.exercises)
    && isRecord(state.answers)
    && isRecord(state.days)
    && validCards
    && validExercises
    && validAnswers
    && validDays;
}

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return localDate(next);
}

export class ProgressStore {
  constructor(storage) {
    this.storage = null;
    this.state = emptyState();
    this.persistenceError = '';

    try {
      this.storage = storage ?? window.localStorage;
      const saved = this.storage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!isValidState(parsed)) {
          throw new Error('O formato salvo não corresponde aos dados de progresso esperados.');
        }
        this.state = parsed;
      }
    } catch (error) {
      this.persistenceError = `O progresso local não pôde ser carregado. Os dados não foram apagados. ${error.message}`;
    }
  }

  get warning() {
    return this.persistenceError;
  }

  getSnapshot(vocabulary = []) {
    const today = localDate();
    const cardEntries = Object.values(this.state.cards);
    const exerciseEntries = Object.values(this.state.exercises);
    const exerciseAttempts = exerciseEntries.reduce((total, item) => total + item.attempts, 0);
    const exerciseCorrect = exerciseEntries.reduce((total, item) => total + item.correct, 0);
    const reviewedIds = new Set(Object.keys(this.state.cards));
    const dueCount = vocabulary.filter((item) => {
      const card = this.state.cards[item.id];
      return !card || card.nextReviewAt <= today;
    }).length;

    return {
      wordsReviewed: reviewedIds.size,
      exercisesCompleted: exerciseAttempts,
      accuracy: exerciseAttempts ? Math.round((exerciseCorrect / exerciseAttempts) * 100) : 0,
      dueCount,
      cardsAgain: cardEntries.filter((item) => item.repetitions === 0).length,
      week: this.getWeekActivity(),
      todayCount: this.state.days[today] ?? 0
    };
  }

  getWeekActivity() {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - offset));
      const key = localDate(date);
      return { date: key, count: this.state.days[key] ?? 0, today: offset === 6 };
    });
  }

  getDueItems(items) {
    const today = localDate();
    return [...items].sort((left, right) => {
      const leftReview = this.state.cards[left.id]?.nextReviewAt ?? '0000-00-00';
      const rightReview = this.state.cards[right.id]?.nextReviewAt ?? '0000-00-00';
      return leftReview.localeCompare(rightReview);
    }).filter((item) => {
      const card = this.state.cards[item.id];
      return !card || card.nextReviewAt <= today;
    });
  }

  getCardProgress(id) {
    return this.state.cards[id] ?? null;
  }

  getExerciseProgress() {
    return this.state.exercises;
  }

  getAnswer(id) {
    return this.state.answers[id] ?? '';
  }

  recordCardReview(id, remembered) {
    const previous = this.state.cards[id] ?? { repetitions: 0, reviews: 0 };
    const repetitions = remembered ? previous.repetitions + 1 : 0;
    const interval = remembered ? REVIEW_INTERVALS[Math.min(repetitions - 1, REVIEW_INTERVALS.length - 1)] : 0;
    const nextReviewAt = remembered ? addDays(localDate(), interval) : localDate();

    this.#update((state) => {
      state.cards[id] = { repetitions, reviews: previous.reviews + 1, nextReviewAt };
      this.#countToday(state);
    });
  }

  recordExercise(id, correct) {
    this.#update((state) => {
      const previous = state.exercises[id] ?? { attempts: 0, correct: 0, errors: 0 };
      state.exercises[id] = {
        attempts: previous.attempts + 1,
        correct: previous.correct + Number(correct),
        errors: previous.errors + Number(!correct)
      };
      this.#countToday(state);
    });
  }

  saveAnswer(id, answer) {
    this.#update((state) => {
      state.answers[id] = answer;
    });
  }

  clear() {
    if (this.persistenceError) {
      throw new Error(this.persistenceError);
    }
    try {
      this.storage.removeItem(STORAGE_KEY);
      this.state = emptyState();
    } catch (error) {
      throw new Error(`Não foi possível apagar o progresso local: ${error.message}`);
    }
  }

  #countToday(state) {
    const today = localDate();
    state.days[today] = (state.days[today] ?? 0) + 1;
  }

  #update(change) {
    if (this.persistenceError) {
      throw new Error('O progresso não pode ser salvo. Verifique as permissões de armazenamento deste navegador.');
    }
    const next = JSON.parse(JSON.stringify(this.state));
    change(next);
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      this.persistenceError = `O navegador não permitiu salvar o progresso: ${error.message}`;
      throw new Error(this.persistenceError);
    }
    this.state = next;
  }
}
