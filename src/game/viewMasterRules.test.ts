import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIEW_MASTER_REELS,
  advanceViewMasterSlide,
  createInitialViewMasterState,
  insertViewMasterReel,
  toggleViewMasterEyepieceMode,
} from './viewMasterRules';

test('View-Master has 3 collectible reels (Animals, Cars, Scenery) with 7 stereoscopic slides each', () => {
  assert.equal(VIEW_MASTER_REELS.animals.slides.length, 7);
  assert.equal(VIEW_MASTER_REELS.cars.slides.length, 7);
  assert.equal(VIEW_MASTER_REELS.scenery.slides.length, 7);
});

test('Pulling the View-Master advance lever increments slide index, wraps around 7 slides, and rotates the circular reel by 360/14 degrees', () => {
  let state = createInitialViewMasterState();
  assert.equal(state.currentSlideIndex, 0);
  assert.equal(state.wheelRotationDeg, 0);

  state = advanceViewMasterSlide(state, 1);
  assert.equal(state.currentSlideIndex, 1);
  assert.ok(Math.abs(state.wheelRotationDeg - 360 / 14) < 0.01);
  assert.equal(state.totalClicks, 1);

  for (let i = 0; i < 6; i++) {
    state = advanceViewMasterSlide(state, 1);
  }
  assert.equal(state.currentSlideIndex, 0);
  assert.equal(state.totalClicks, 7);
});

test('Inserting a new View-Master reel resets slide index to 0 and switches activeReelId', () => {
  let state = createInitialViewMasterState();
  state = advanceViewMasterSlide(state, 1);
  state = insertViewMasterReel(state, 'cars');
  assert.equal(state.activeReelId, 'cars');
  assert.equal(state.currentSlideIndex, 0);
  assert.equal(state.reelInserted, true);
});

test('Toggling View-Master eyepiece mode switches between tabletop viewer and stereoscopic binocular lens view', () => {
  let state = createInitialViewMasterState();
  assert.equal(state.lookingThroughEyepiece, false);
  state = toggleViewMasterEyepieceMode(state);
  assert.equal(state.lookingThroughEyepiece, true);
  state = toggleViewMasterEyepieceMode(state, false);
  assert.equal(state.lookingThroughEyepiece, false);
});
