import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceMouseTrackIndex,
  buildNextContraptionStage,
  CHEESE_WHEEL_SPACE_INDEX,
  collectFloatingCheeseInControlMode,
  completeContraptionChainReaction,
  createInitialMouseTrapState,
  MOUSE_TRAP_SPACES,
  rollMouseTrapTurn,
  setMouseTrapBoardMode,
  triggerInteractiveScene,
} from './mouseTrapRules';

test('Mouse Trap square board has 36 spaces with outer square perimeter and 6-space Loop around Cheese Wheel', () => {
  assert.equal(MOUSE_TRAP_SPACES.length, 36);
  assert.equal(MOUSE_TRAP_SPACES[0].type, 'start');
  assert.equal(MOUSE_TRAP_SPACES[CHEESE_WHEEL_SPACE_INDEX].type, 'cheese_wheel');

  // Advancing from space 29 into The Loop wraps within spaces 30..35
  const loopSteps = advanceMouseTrackIndex(29, 8);
  assert.equal(loopSteps[0], 30);
  assert.equal(loopSteps[6], 30); // 6-space loop wraps 35 -> 30
});

test('Landing on a Build space pops up a new 3D Contraption Stage and awards floating cheese', () => {
  const initial = createInitialMouseTrapState('mode1_classic');
  assert.equal(initial.builtStages, 1);

  // Space 1 is a 'build' space
  const outcome = rollMouseTrapTurn(initial, 1);
  assert.equal(outcome.poppedNewStage, true);
  assert.equal(outcome.nextState.builtStages, 2);
  assert.equal(outcome.nextState.mice.red.trackIndex, 1);
  assert.ok(outcome.nextState.mice.red.cheeseCount > initial.mice.red.cheeseCount);
});

test('Completing the contraption chain reaction drops the Red Cage and physically traps the victim mouse so it cannot move', () => {
  let state = createInitialMouseTrapState('mode1_classic');
  state = buildNextContraptionStage(state, true);
  assert.equal(state.builtStages, 5);

  // Trigger chain reaction trapping Blue Mouse on the Cheese Wheel
  state = completeContraptionChainReaction(state, 'blue');
  assert.equal(state.cageDropped, true);
  assert.equal(state.trappedMouse, 'blue');
  assert.equal(state.mice.blue.isTrapped, true);
  assert.equal(state.mice.blue.trackIndex, CHEESE_WHEEL_SPACE_INDEX);

  // Give Blue 0 cheese and roll a 2 on Blue's turn: Blue is physically trapped and CANNOT move!
  state.currentTurn = 'blue';
  state.mice.blue.cheeseCount = 0;
  const trappedRoll = rollMouseTrapTurn(state, 2);
  assert.equal(trappedRoll.stepIndices.length, 0);
  assert.equal(trappedRoll.nextState.mice.blue.trackIndex, CHEESE_WHEEL_SPACE_INDEX);
  assert.equal(trappedRoll.nextState.mice.blue.isTrapped, true);

  // Rolling a 6 frees Blue Mouse from the cage!
  trappedRoll.nextState.currentTurn = 'blue';
  const escapeRoll = rollMouseTrapTurn(trappedRoll.nextState, 6);
  assert.equal(escapeRoll.nextState.mice.blue.isTrapped, false);
  assert.equal(escapeRoll.nextState.cageDropped, false);
});

test('Mouse Control Mode allows collecting floating cheese wedges unless trapped in cage', () => {
  let state = createInitialMouseTrapState('mode2_living_square');
  const before = state.mice.red.cheeseCount;
  state = collectFloatingCheeseInControlMode(state, 'red');
  assert.equal(state.mice.red.cheeseCount, before + 1);
});

test('Supports switching between Mode 1 (Classic Pop-Up) and Mode 2 (Popped-Up Square Trail & Interactive Scenes)', () => {
  let state = createInitialMouseTrapState('mode1_classic');
  assert.equal(state.boardMode, 'mode1_classic');

  state = setMouseTrapBoardMode(state, 'mode2_living_square');
  assert.equal(state.boardMode, 'mode2_living_square');
  assert.equal(state.builtStages, 5);

  const beforeCheese = state.mice.red.cheeseCount;
  state = triggerInteractiveScene(state, 'cheese_vat');
  assert.equal(state.activeSceneId, 'cheese_vat');
  assert.equal(state.mice.red.cheeseCount, beforeCheese + 2);
});
