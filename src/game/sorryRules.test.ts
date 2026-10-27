import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStandardDeck,
  createInitialPawns,
  createInitialGameState,
  getLegalMovesForCard,
  applyMoveToState,
  computeStepWaypoints,
  PLAYER_META,
} from './sorryRules';

test('standard Sorry! deck has 45 cards with five 1s and four of each other rank', () => {
  const deck = createStandardDeck(() => 0.5);
  assert.equal(deck.length, 45);
  assert.equal(deck.filter((c) => c === '1').length, 5);
  assert.equal(deck.filter((c) => c === '2').length, 4);
  assert.equal(deck.filter((c) => c === 'SORRY!').length, 4);
});

test('only cards 1 and 2 can move a pawn out of START onto the track', () => {
  const pawns = createInitialPawns();

  const movesOn1 = getLegalMovesForCard(pawns, 'red', '1');
  assert.equal(movesOn1.length, 1);
  assert.equal(movesOn1[0].leavesStart, true);
  assert.equal(movesOn1[0].primarySteps[0].trackIndex, PLAYER_META.red.startExitTrack);

  const movesOn2 = getLegalMovesForCard(pawns, 'red', '2');
  assert.equal(movesOn2.length, 1);
  assert.equal(movesOn2[0].leavesStart, true);

  const movesOn5 = getLegalMovesForCard(pawns, 'red', '5');
  assert.equal(movesOn5.length, 0);
});

test('card 4 moves a pawn backward 4 spaces and wraps around track 0 -> 56', () => {
  const pawns = createInitialPawns();
  const redPawn = pawns.find((p) => p.id === 'red-0')!;
  redPawn.zone = 'track';
  redPawn.trackIndex = 2;

  const moves = getLegalMovesForCard(pawns, 'red', '4');
  assert.equal(moves.length, 1);
  const steps = moves[0].primarySteps;
  assert.equal(steps.length, 4);
  assert.equal(steps[steps.length - 1].trackIndex, 58);
});

test('landing on start of a foreign slide triggers slide and bumps any pawn on the slide', () => {
  const pawns = createInitialPawns();
  // Red pawn at track 13, moves forward 3 -> lands on track 16 (Blue short slide 16..19)
  const redPawn = pawns.find((p) => p.id === 'red-0')!;
  redPawn.zone = 'track';
  redPawn.trackIndex = 13;

  // Blue pawn sitting on track 18 (middle of the slide)
  const bluePawn = pawns.find((p) => p.id === 'blue-0')!;
  bluePawn.zone = 'track';
  bluePawn.trackIndex = 18;

  const moves = getLegalMovesForCard(pawns, 'red', '3');
  assert.equal(moves.length, 1);
  assert.equal(moves[0].triggeredSlide, true);
  const finalStep = moves[0].primarySteps[moves[0].primarySteps.length - 1];
  assert.equal(finalStep.trackIndex, 19); // End of Blue's short slide
  assert.equal(moves[0].bumpedPawns.length, 1);
  assert.equal(moves[0].bumpedPawns[0].pawnId, 'blue-0');
});

test('landing on own color slide does NOT slide', () => {
  const pawns = createInitialPawns();
  // Red pawn at track 59, moves forward 2 -> lands on track 1 (Red short slide 1..4)
  const redPawn = pawns.find((p) => p.id === 'red-0')!;
  redPawn.zone = 'track';
  redPawn.trackIndex = 59;

  const moves = getLegalMovesForCard(pawns, 'red', '2');
  const trackMove = moves.find((m) => !m.leavesStart)!;
  assert.ok(trackMove);
  assert.equal(trackMove.triggeredSlide, false);
  const finalStep = trackMove.primarySteps[trackMove.primarySteps.length - 1];
  assert.equal(finalStep.trackIndex, 1);
});

test('SORRY! card takes a pawn from START and bumps an opponent pawn on the track', () => {
  const pawns = createInitialPawns();
  const yellowPawn = pawns.find((p) => p.id === 'yellow-0')!;
  yellowPawn.zone = 'track';
  yellowPawn.trackIndex = 35;

  const moves = getLegalMovesForCard(pawns, 'red', 'SORRY!');
  assert.equal(moves.length, 1);
  assert.equal(moves[0].isSorryStrike, true);
  assert.equal(moves[0].bumpedPawns[0].pawnId, 'yellow-0');

  let state = createInitialGameState();
  state = { ...state, pawns, currentTurn: 'red', currentCard: 'SORRY!', turnPhase: 'move' };
  const nextState = applyMoveToState(state, moves[0]);

  const updatedRed = nextState.pawns.find((p) => p.id === 'red-0')!;
  const updatedYellow = nextState.pawns.find((p) => p.id === 'yellow-0')!;
  assert.equal(updatedRed.zone, 'track');
  assert.equal(updatedRed.trackIndex, 35);
  assert.equal(updatedYellow.zone, 'start');
});

test('entering safety zone and winning when all 4 pawns reach HOME', () => {
  let state = createInitialGameState();
  const redPawns = state.pawns.filter((p) => p.color === 'red');
  // Put 3 red pawns in HOME, and 1 red pawn at safetyIndex 3 (needs 2 steps to enter HOME)
  redPawns[0].zone = 'home';
  redPawns[1].zone = 'home';
  redPawns[2].zone = 'home';
  redPawns[3].zone = 'safety';
  redPawns[3].safetyIndex = 3;

  const wp = computeStepWaypoints(redPawns[3], 2);
  assert.ok(wp);
  assert.equal(wp[wp.length - 1].zone, 'home');

  const moves = getLegalMovesForCard(state.pawns, 'red', '2');
  const homeMove = moves.find((m) => m.entersHome);
  assert.ok(homeMove);

  const finalState = applyMoveToState(state, homeMove);
  assert.equal(finalState.winner, 'red');
  assert.equal(finalState.turnPhase, 'gameover');
});
