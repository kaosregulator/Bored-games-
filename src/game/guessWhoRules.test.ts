import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUESS_WHO_CHARACTERS,
  NOSTALGIA_1999_JOKES,
  createInitialGuessWhoState,
  askGuessWhoQuestion,
  executeAiGuessWhoTurn,
  makeDirectCharacterGuess,
  toggleCharacterStand,
  popNext1999Joke,
} from './guessWhoRules';

test('Guess Who roster has 24 distinct characters with complete trait metadata', () => {
  assert.equal(GUESS_WHO_CHARACTERS.length, 24);
  const ids = new Set(GUESS_WHO_CHARACTERS.map((c) => c.id));
  assert.equal(ids.size, 24);
});

test('asking a trait question folds down all mismatched stands and logs narrator play-by-play + 1999 joke', () => {
  let state = createInitialGuessWhoState(() => 0.25);
  const secretHasGlasses = state.aiSecret.hasGlasses;
  const expectedEliminated = GUESS_WHO_CHARACTERS.filter(
    (c) => c.hasGlasses !== secretHasGlasses
  ).length;

  state = askGuessWhoQuestion(state, 'glasses', () => 0.5);
  assert.equal(state.playerFoldedIds.length, expectedEliminated);
  assert.equal(state.turn, 'ai');
  assert.ok(state.narratorLog[0].playByPlay.includes('glasses'));
  assert.ok(state.narratorLog[0].joke99.length > 10);
});

test('AI turn asks a question, folds Blue stands, and returns turn to player', () => {
  let state = createInitialGuessWhoState(() => 0.1);
  state = askGuessWhoQuestion(state, 'hat', () => 0.3);
  assert.equal(state.turn, 'ai');

  state = executeAiGuessWhoTurn(state, () => 0.4);
  assert.equal(state.turn, 'player');
  assert.ok(state.aiFoldedIds.length > 0);
  assert.equal(state.turnCount, 2);
});

test('direct character guess wins immediately when matching AI secret card', () => {
  let state = createInitialGuessWhoState(() => 0.2);
  const targetId = state.aiSecret.id;

  state = makeDirectCharacterGuess(state, targetId, () => 0.5);
  assert.equal(state.winner, 'player');
  assert.equal(state.playerFoldedIds.length, 23);
});

test('manual stand toggle flips stand down and back up with narrator update', () => {
  let state = createInitialGuessWhoState(() => 0.5);
  state = toggleCharacterStand(state, 'mike', () => 0.5);
  assert.equal(state.playerFoldedIds.includes('mike'), true);

  state = toggleCharacterStand(state, 'mike', () => 0.5);
  assert.equal(state.playerFoldedIds.includes('mike'), false);
});

test('1999 nostalgia joke shuffler cycles through all jokes before repeating', () => {
  const seen = new Set<string>();
  let queue: string[] = [];
  for (let i = 0; i < NOSTALGIA_1999_JOKES.length; i++) {
    const res = popNext1999Joke(queue, () => 0.42);
    seen.add(res.joke);
    queue = res.nextQueue;
  }
  assert.equal(seen.size, NOSTALGIA_1999_JOKES.length);
  assert.equal(queue.length, 0);

  // Next pop automatically refills and reshuffles
  const refill = popNext1999Joke(queue, () => 0.42);
  assert.ok(refill.joke.length > 0);
  assert.equal(refill.nextQueue.length, NOSTALGIA_1999_JOKES.length - 1);
});
