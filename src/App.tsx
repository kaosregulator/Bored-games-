/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyMoveToState,
  createInitialGameState,
  drawNextCard,
  LegalMove,
  SorryGameState,
} from './game/sorryRules';
import {
  askGuessWhoQuestion,
  createInitialGuessWhoState,
  executeAiGuessWhoTurn,
  GuessWhoGameState,
  makeDirectCharacterGuess,
  popNext1999Joke,
  toggleCharacterStand,
} from './game/guessWhoRules';
import {
  buildNextContraptionStage,
  collectFloatingCheeseInControlMode,
  completeContraptionChainReaction,
  createInitialMouseTrapState,
  InteractiveSceneId,
  MouseColor,
  MouseTrapBoardMode,
  MouseTrapGameState,
  rollMouseTrapTurn,
  setMouseTrapBoardMode,
  triggerInteractiveScene,
} from './game/mouseTrapRules';
import {
  advanceViewMasterSlide,
  createInitialViewMasterState,
  insertViewMasterReel,
  toggleViewMasterEyepiece,
  ViewMasterGameState,
  ViewMasterReelId,
} from './game/viewMasterRules';
import { soundFX } from './game/soundEffects';
import {
  ActiveGameType,
  ActiveMouseStepAnimation,
  ActiveMoveAnimation,
  CameraAngleId,
  RoomSubPhase,
  SorryRoomCanvas,
} from './components/SorryRoomCanvas';
import { GameHudAndMenus } from './components/GameHudAndMenus';

export default function App() {
  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const isAutostart = urlParams?.get('autostart') === '1';
  const paramGame = urlParams?.get('game') as ActiveGameType | null;
  const initialGame: ActiveGameType =
    paramGame === 'sorry' ||
    paramGame === 'guess_who' ||
    paramGame === 'mouse_trap' ||
    paramGame === 'view_master'
      ? paramGame
      : 'sorry';
  const paramChest = urlParams?.get('chest') === '1';
  const paramCamera = urlParams?.get('camera') as CameraAngleId | null;
  const paramStereo = urlParams?.get('stereo') === '1';
  const paramReel = urlParams?.get('reel') as ViewMasterReelId | null;

  const [activeGame, setActiveGame] = useState<ActiveGameType>(initialGame);
  const [appState, setAppState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(
    isAutostart ? 'playing' : 'title'
  );
  const [subPhase, setSubPhase] = useState<RoomSubPhase>(
    isAutostart ? 'board_play' : 'unfolding'
  );
  const [gameState, setGameState] = useState<SorryGameState>(() =>
    createInitialGameState()
  );
  const [guessWhoState, setGuessWhoState] = useState<GuessWhoGameState>(() =>
    createInitialGuessWhoState()
  );
  const [mouseTrapState, setMouseTrapState] = useState<MouseTrapGameState>(() =>
    createInitialMouseTrapState()
  );
  const [viewMasterState, setViewMasterState] = useState<ViewMasterGameState>(() => {
    const base = createInitialViewMasterState(
      paramReel === 'animals' || paramReel === 'cars' || paramReel === 'scenery'
        ? paramReel
        : 'animals'
    );
    return paramStereo ? toggleViewMasterEyepiece(base, true) : base;
  });
  const [toyChestOpen, setToyChestOpen] = useState<boolean>(paramChest);
  const [cameraAngle, setCameraAngle] = useState<CameraAngleId>(
    paramCamera ?? (paramChest ? 'toy_chest' : 'tabletop')
  );
  const [followAction, setFollowAction] = useState<boolean>(true);
  const [autoPlayAll, setAutoPlayAll] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [nearTable, setNearTable] = useState<boolean>(false);
  const [activeAnimation, setActiveAnimation] = useState<ActiveMoveAnimation | null>(
    null
  );
  const [activeMouseStepAnim, setActiveMouseStepAnim] =
    useState<ActiveMouseStepAnimation | null>(null);
  const [chainReactionStartMs, setChainReactionStartMs] = useState<number | null>(
    null
  );
  const [scenePulseStartMs, setScenePulseStartMs] = useState<number | null>(null);
  const [viewMasterLeverAnimMs, setViewMasterLeverAnimMs] = useState<number | null>(
    null
  );
  const [viewMasterInsertAnimMs, setViewMasterInsertAnimMs] = useState<number | null>(
    null
  );
  const [physicsBumpTrigger, setPhysicsBumpTrigger] = useState<number>(0);
  const [unfoldTriggerCount, setUnfoldTriggerCount] = useState<number>(0);
  const [walkToTableTrigger, setWalkToTableTrigger] = useState<number>(0);

  useEffect(() => {
    document.body.dataset.state = appState;
    document.body.dataset.subphase = subPhase;
    document.body.dataset.game = activeGame;
    document.body.dataset.camera = cameraAngle;
    document.body.dataset.cinematic = followAction ? 'on' : 'off';
    document.body.dataset.toychest = toyChestOpen ? 'open' : 'closed';
    (window as unknown as Record<string, unknown>).render_game_to_text = () =>
      JSON.stringify({
        appState,
        subPhase,
        activeGame,
        cameraAngle,
        toyChestOpen,
        viewMaster: {
          activeReel: viewMasterState.activeReelId,
          slideIndex: viewMasterState.currentSlideIndex,
          eyepieceMode: viewMasterState.lookingThroughEyepiece,
        },
      });
  }, [
    appState,
    subPhase,
    activeGame,
    cameraAngle,
    followAction,
    toyChestOpen,
    viewMasterState,
  ]);

  // Main Entrance: Open the 3D Cardboard Game Box -> Unfold the Board -> Lay Out Pieces!
  const handleStartBoxEntrance = useCallback(() => {
    document.body.dataset.state = 'playing';
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundFX.startNostalgiaMusic();
    setAppState('playing');
    setSubPhase('unfolding');
    setCameraAngle('tabletop');
    setActiveAnimation(null);
    setActiveMouseStepAnim(null);
    setChainReactionStartMs(null);
    setUnfoldTriggerCount((c) => c + 1);
    if (activeGame === 'sorry') {
      setGameState(createInitialGameState());
    } else if (activeGame === 'guess_who') {
      setGuessWhoState(createInitialGuessWhoState());
    } else if (activeGame === 'view_master') {
      setViewMasterState(createInitialViewMasterState('animals'));
    } else {
      setMouseTrapState(createInitialMouseTrapState());
    }
  }, [activeGame]);

  // Enter First-Person Room where the closed cardboard box sits on the table
  const handleStartFpvRoom = useCallback(() => {
    document.body.dataset.state = 'playing';
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundFX.startNostalgiaMusic();
    setAppState('playing');
    setSubPhase('fpv_room');
    setNearTable(false);
    setActiveAnimation(null);
    setActiveMouseStepAnim(null);
    setChainReactionStartMs(null);
  }, []);

  // Jump straight to unfolded board play
  const handleStartDirectBoard = useCallback(() => {
    document.body.dataset.state = 'playing';
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundFX.startNostalgiaMusic();
    setAppState('playing');
    setSubPhase('board_play');
    setCameraAngle('tabletop');
    setActiveAnimation(null);
    setActiveMouseStepAnim(null);
    setChainReactionStartMs(null);
    if (activeGame === 'sorry') {
      const fresh = createInitialGameState();
      fresh.lastActionLog =
        'Board unfolded! Click Draw Card [Space] to begin Classic Sorry!';
      setGameState(fresh);
    } else if (activeGame === 'guess_who') {
      setGuessWhoState(createInitialGuessWhoState());
    } else if (activeGame === 'view_master') {
      setViewMasterState(createInitialViewMasterState('animals'));
    } else {
      setMouseTrapState(createInitialMouseTrapState());
    }
  }, [activeGame]);

  // Switch between SORRY! 3D, GUESS WHO? 3D, MOUSE TRAP! 3D, and VIEW-MASTER 3D
  const handleChangeGame = useCallback(
    (explicitGame?: ActiveGameType) => {
      const nextOrder: Record<ActiveGameType, ActiveGameType> = {
        sorry: 'guess_who',
        guess_who: 'mouse_trap',
        mouse_trap: 'view_master',
        view_master: 'sorry',
      };
      const nextGame: ActiveGameType = explicitGame ?? nextOrder[activeGame];
      setActiveGame(nextGame);
      setActiveAnimation(null);
      setActiveMouseStepAnim(null);
      setChainReactionStartMs(null);
      soundFX.startNostalgiaMusic();

      if (nextGame === 'sorry') {
        setGameState(createInitialGameState());
      } else if (nextGame === 'guess_who') {
        setGuessWhoState(createInitialGuessWhoState());
      } else if (nextGame === 'view_master') {
        setViewMasterState(createInitialViewMasterState('animals'));
      } else {
        setMouseTrapState(createInitialMouseTrapState());
      }

      if (appState !== 'title') {
        setAppState('playing');
        setSubPhase('unfolding');
        setCameraAngle('tabletop');
        setUnfoldTriggerCount((c) => c + 1);
      }
    },
    [activeGame, appState]
  );

  // Step2 Lift & Hide Toy Chest Handlers
  const handleToggleToyChest = useCallback(() => {
    setToyChestOpen((prev) => {
      const next = !prev;
      soundFX.playToyChestSlide(next);
      return next;
    });
  }, []);

  const handleSelectGameFromToyChest = useCallback(
    (gameId: ActiveGameType) => {
      soundFX.playToyChestSlide(false);
      setToyChestOpen(false);
      handleChangeGame(gameId);
    },
    [handleChangeGame]
  );

  // View-Master 3D Handlers
  const handleAdvanceViewMasterSlide = useCallback(() => {
    soundFX.startNostalgiaMusic();
    soundFX.playViewMasterLeverClick();
    setViewMasterLeverAnimMs(performance.now());
    setViewMasterState((prev) => advanceViewMasterSlide(prev));
  }, []);

  const handleSelectViewMasterReel = useCallback((reelId: ViewMasterReelId) => {
    soundFX.startNostalgiaMusic();
    soundFX.playViewMasterReelInsert();
    setViewMasterInsertAnimMs(performance.now());
    setViewMasterState((prev) => insertViewMasterReel(prev, reelId));
  }, []);

  const handleToggleViewMasterEyepiece = useCallback(() => {
    soundFX.playViewMasterLeverClick();
    setViewMasterState((prev) => toggleViewMasterEyepiece(prev));
  }, []);

  const handleOpenBox = useCallback(() => {
    soundFX.startNostalgiaMusic();
    setAppState('playing');
    setSubPhase('unfolding');
    setUnfoldTriggerCount((c) => c + 1);
  }, []);

  const handleUnfoldComplete = useCallback(() => {
    setSubPhase('board_play');
    setCameraAngle('tabletop');
    setGameState((prev) => ({
      ...prev,
      lastActionLog:
        'The SORRY! board is laid out! Draw a card to move your Red pawns.',
    }));
  }, []);

  // ===========================================================================
  // SORRY! HANDLERS
  // ===========================================================================
  const handleDrawCard = useCallback(() => {
    soundFX.startNostalgiaMusic();
    setGameState((prev) => {
      if (prev.turnPhase !== 'draw' || prev.winner) return prev;
      soundFX.playCardFlip();
      return drawNextCard(prev);
    });
  }, []);

  const handleSelectMove = useCallback(
    (move: LegalMove) => {
      if (activeAnimation) return;
      setActiveAnimation({
        move,
        actingColor: gameState.currentTurn,
        card: gameState.currentCard ?? '1',
        startTime: performance.now(),
      });
    },
    [activeAnimation, gameState.currentTurn, gameState.currentCard]
  );

  const handlePassTurn = useCallback(() => {
    if (activeAnimation) return;
    setGameState((prev) => applyMoveToState(prev, null));
  }, [activeAnimation]);

  const handleAnimationFinished = useCallback((move: LegalMove) => {
    setActiveAnimation(null);
    setGameState((prev) => {
      const next = applyMoveToState(prev, move);
      if (next.winner) {
        soundFX.playVictoryFanfare();
        setAppState('gameover');
      }
      return next;
    });
  }, []);

  // ===========================================================================
  // GUESS WHO? 1999 HANDLERS
  // ===========================================================================
  const handleAskGuessWhoQuestion = useCallback((questionId: string) => {
    soundFX.startNostalgiaMusic();
    setGuessWhoState((prev) => askGuessWhoQuestion(prev, questionId));
  }, []);

  const handleMakeDirectGuess = useCallback((characterId: string) => {
    soundFX.startNostalgiaMusic();
    setGuessWhoState((prev) => {
      const next = makeDirectCharacterGuess(prev, characterId);
      if (next.winner) {
        soundFX.playVictoryFanfare();
        setAppState('gameover');
      }
      return next;
    });
  }, []);

  const handleToggleGuessWhoStand = useCallback((characterId: string) => {
    setGuessWhoState((prev) => toggleCharacterStand(prev, characterId));
  }, []);

  const handleCycle1999Joke = useCallback(() => {
    setGuessWhoState((prev) => {
      const { joke, nextQueue } = popNext1999Joke(prev.jokeQueue);
      if (prev.narratorLog.length === 0) return prev;
      const updatedTop = { ...prev.narratorLog[0], joke99: joke };
      return {
        ...prev,
        jokeQueue: nextQueue,
        narratorLog: [updatedTop, ...prev.narratorLog.slice(1)],
      };
    });
  }, []);

  // ===========================================================================
  // MOUSE TRAP! 3D LIVING CONTRAPTION & MOUSE CONTROL HANDLERS
  // ===========================================================================
  const triggerContraptionSequence = useCallback(
    (victimColor?: MouseColor | null) => {
      soundFX.playContraptionChainReaction();
      setChainReactionStartMs(performance.now());
      window.setTimeout(() => {
        setChainReactionStartMs(null);
        setMouseTrapState((prev) => {
          const next = completeContraptionChainReaction(prev, victimColor);
          if (next.winner) {
            soundFX.playVictoryFanfare();
            setAppState('gameover');
          }
          return next;
        });
      }, 2650);
    },
    []
  );

  const handleRollMouseTrapDice = useCallback(() => {
    if (activeMouseStepAnim || chainReactionStartMs !== null) return;
    soundFX.startNostalgiaMusic();
    soundFX.playMouseSqueak();

    const startIndex =
      mouseTrapState.mice[mouseTrapState.currentTurn]?.trackIndex ?? 0;
    const outcome = rollMouseTrapTurn(mouseTrapState);

    if (outcome.stepIndices.length === 0) {
      setMouseTrapState(outcome.nextState);
      return;
    }

    const actingColor = mouseTrapState.currentTurn;
    setActiveMouseStepAnim({
      color: actingColor,
      stepIndices: outcome.stepIndices,
      startIndex,
      startTimeMs: performance.now(),
    });

    const animDurMs = outcome.stepIndices.length * 210 + 60;
    window.setTimeout(() => {
      setActiveMouseStepAnim(null);
      if (outcome.poppedNewStage) {
        soundFX.playTrapPopUp();
      } else {
        soundFX.playCheeseCollect();
      }
      setMouseTrapState(outcome.nextState);

      if (outcome.triggeredSceneId) {
        setScenePulseStartMs(performance.now());
      }

      if (outcome.triggeredChainReaction) {
        triggerContraptionSequence(outcome.targetVictimMouse);
      }
    }, animDurMs);
  }, [
    activeMouseStepAnim,
    chainReactionStartMs,
    mouseTrapState,
    triggerContraptionSequence,
  ]);

  const handleBuildMouseTrapStage = useCallback((buildAll: boolean = false) => {
    soundFX.playTrapPopUp();
    setMouseTrapState((prev) => buildNextContraptionStage(prev, buildAll));
  }, []);

  const handleTriggerMouseTrapContraption = useCallback(() => {
    if (chainReactionStartMs !== null) return;
    setMouseTrapState((prev) => buildNextContraptionStage(prev, true));
    triggerContraptionSequence(null);
  }, [chainReactionStartMs, triggerContraptionSequence]);

  const handleCollectFloatingCheese = useCallback(() => {
    soundFX.playCheeseCollect();
    setMouseTrapState((prev) => collectFloatingCheeseInControlMode(prev, 'red'));
  }, []);

  const handleToggleMouseTrapBoardMode = useCallback((mode?: MouseTrapBoardMode) => {
    soundFX.playTrapPopUp();
    setMouseTrapState((prev) => setMouseTrapBoardMode(prev, mode));
  }, []);

  const handleTriggerMouseTrapScene = useCallback((sceneId: InteractiveSceneId) => {
    soundFX.playCheeseCollect();
    setScenePulseStartMs(performance.now());
    setMouseTrapState((prev) => triggerInteractiveScene(prev, sceneId));
  }, []);

  // Autonomous AI Turn Timer for Mouse Trap! 3D
  useEffect(() => {
    if (
      appState !== 'playing' ||
      subPhase !== 'board_play' ||
      activeGame !== 'mouse_trap' ||
      activeMouseStepAnim !== null ||
      chainReactionStartMs !== null ||
      mouseTrapState.winner !== null
    ) {
      return;
    }

    const isAiTurn = autoPlayAll || mouseTrapState.currentTurn !== 'red';
    if (!isAiTurn) return;

    const t = window.setTimeout(() => {
      handleRollMouseTrapDice();
    }, 950);

    return () => window.clearTimeout(t);
  }, [
    appState,
    subPhase,
    activeGame,
    activeMouseStepAnim,
    chainReactionStartMs,
    autoPlayAll,
    mouseTrapState.currentTurn,
    mouseTrapState.winner,
    handleRollMouseTrapDice,
  ]);

  // AI Turn Timer for Guess Who?
  useEffect(() => {
    if (
      appState !== 'playing' ||
      subPhase !== 'board_play' ||
      activeGame !== 'guess_who' ||
      guessWhoState.turn !== 'ai' ||
      guessWhoState.winner !== null
    ) {
      return;
    }

    const t = window.setTimeout(() => {
      setGuessWhoState((prev) => {
        const next = executeAiGuessWhoTurn(prev);
        if (next.winner) {
          soundFX.playVictoryFanfare();
          setAppState('gameover');
        }
        return next;
      });
    }, 1150);

    return () => window.clearTimeout(t);
  }, [appState, subPhase, activeGame, guessWhoState.turn, guessWhoState.winner]);

  // Autonomous AI Turn Controller for Sorry!
  const aiTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (aiTimerRef.current) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    if (
      appState !== 'playing' ||
      subPhase !== 'board_play' ||
      activeGame !== 'sorry' ||
      activeAnimation !== null ||
      gameState.winner !== null
    ) {
      return;
    }

    const isAiTurn = autoPlayAll || gameState.currentTurn !== 'red';
    if (!isAiTurn) return;

    if (gameState.turnPhase === 'draw') {
      aiTimerRef.current = window.setTimeout(() => {
        soundFX.playCardFlip();
        setGameState((prev) => drawNextCard(prev));
      }, 650);
    } else if (gameState.turnPhase === 'move') {
      aiTimerRef.current = window.setTimeout(() => {
        if (gameState.legalMoves.length > 0) {
          handleSelectMove(gameState.legalMoves[0]);
        } else {
          handlePassTurn();
        }
      }, 720);
    }

    return () => {
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
      }
    };
  }, [
    appState,
    subPhase,
    activeGame,
    activeAnimation,
    autoPlayAll,
    gameState.currentTurn,
    gameState.turnPhase,
    gameState.legalMoves,
    gameState.winner,
    handleSelectMove,
    handlePassTurn,
  ]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (appState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartBoxEntrance();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setAppState((prev) =>
          prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev
        );
        return;
      }

      if (e.code === 'KeyM') {
        soundFX.muted = !soundFX.muted;
        setMuted(soundFX.muted);
        return;
      }

      if (e.code === 'KeyR' && appState === 'playing' && subPhase === 'board_play') {
        handleStartDirectBoard();
        return;
      }

      if (
        e.code === 'Space' &&
        appState === 'playing' &&
        subPhase === 'board_play'
      ) {
        if (activeGame === 'view_master') {
          e.preventDefault();
          handleAdvanceViewMasterSlide();
        } else if (
          activeGame === 'sorry' &&
          !activeAnimation &&
          (gameState.currentTurn === 'red' || autoPlayAll)
        ) {
          e.preventDefault();
          if (gameState.turnPhase === 'draw') {
            handleDrawCard();
          } else if (gameState.turnPhase === 'move') {
            if (gameState.legalMoves.length > 0) {
              handleSelectMove(gameState.legalMoves[0]);
            } else {
              handlePassTurn();
            }
          }
        } else if (
          activeGame === 'mouse_trap' &&
          !activeMouseStepAnim &&
          chainReactionStartMs === null &&
          (mouseTrapState.currentTurn === 'red' || autoPlayAll)
        ) {
          e.preventDefault();
          handleRollMouseTrapDice();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    appState,
    subPhase,
    activeGame,
    activeAnimation,
    activeMouseStepAnim,
    chainReactionStartMs,
    autoPlayAll,
    gameState.currentTurn,
    gameState.turnPhase,
    gameState.legalMoves,
    mouseTrapState.currentTurn,
    handleStartBoxEntrance,
    handleStartDirectBoard,
    handleDrawCard,
    handleSelectMove,
    handlePassTurn,
    handleRollMouseTrapDice,
    handleAdvanceViewMasterSlide,
  ]);

  const handleChangeCameraAngle = useCallback(
    (angle: CameraAngleId) => {
      setCameraAngle(angle);
      if (subPhase === 'fpv_room' && angle !== 'fpv') {
        handleStartDirectBoard();
        setCameraAngle(angle);
      }
    },
    [subPhase, handleStartDirectBoard]
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      <SorryRoomCanvas
        activeGame={activeGame}
        appState={appState}
        subPhase={subPhase}
        gameState={gameState}
        guessWhoState={guessWhoState}
        mouseTrapState={mouseTrapState}
        viewMasterState={viewMasterState}
        toyChestOpen={toyChestOpen}
        cameraAngle={cameraAngle}
        followAction={followAction}
        nearTable={nearTable}
        onNearTableChange={setNearTable}
        onRequestOpenBox={handleOpenBox}
        onUnfoldComplete={handleUnfoldComplete}
        onSelectMove={handleSelectMove}
        onDrawCard={handleDrawCard}
        onAnimationFinished={handleAnimationFinished}
        onToggleGuessWhoStand={handleToggleGuessWhoStand}
        onRollMouseTrapDice={handleRollMouseTrapDice}
        onCollectFloatingCheese={handleCollectFloatingCheese}
        onTriggerMouseTrapScene={handleTriggerMouseTrapScene}
        onToggleToyChest={handleToggleToyChest}
        onSelectGameFromToyChest={handleSelectGameFromToyChest}
        onAdvanceViewMasterSlide={handleAdvanceViewMasterSlide}
        onSelectViewMasterReel={handleSelectViewMasterReel}
        onToggleViewMasterEyepiece={handleToggleViewMasterEyepiece}
        activeAnimation={activeAnimation}
        activeMouseStepAnim={activeMouseStepAnim}
        chainReactionStartMs={chainReactionStartMs}
        scenePulseStartMs={scenePulseStartMs}
        viewMasterLeverAnimMs={viewMasterLeverAnimMs}
        viewMasterInsertAnimMs={viewMasterInsertAnimMs}
        physicsBumpTrigger={physicsBumpTrigger}
        unfoldTriggerCount={unfoldTriggerCount}
        walkToTableTrigger={walkToTableTrigger}
      />

      <GameHudAndMenus
        activeGame={activeGame}
        appState={appState}
        subPhase={subPhase}
        gameState={gameState}
        guessWhoState={guessWhoState}
        mouseTrapState={mouseTrapState}
        viewMasterState={viewMasterState}
        toyChestOpen={toyChestOpen}
        cameraAngle={cameraAngle}
        followAction={followAction}
        autoPlayAll={autoPlayAll}
        muted={muted}
        musicEnabled={musicEnabled}
        nearTable={nearTable}
        isAnimatingMove={Boolean(activeAnimation)}
        isMouseTrapAnimating={
          Boolean(activeMouseStepAnim) || chainReactionStartMs !== null
        }
        onStartBoxEntrance={handleStartBoxEntrance}
        onStartFpvRoom={handleStartFpvRoom}
        onStartDirectBoard={handleStartDirectBoard}
        onChangeGame={handleChangeGame}
        onWalkToTable={() => setWalkToTableTrigger((c) => c + 1)}
        onOpenBox={handleOpenBox}
        onSkipUnfold={handleUnfoldComplete}
        onDrawCard={handleDrawCard}
        onSelectMove={handleSelectMove}
        onPassTurn={handlePassTurn}
        onAskGuessWhoQuestion={handleAskGuessWhoQuestion}
        onMakeDirectGuess={handleMakeDirectGuess}
        onToggleGuessWhoStand={handleToggleGuessWhoStand}
        onCycle1999Joke={handleCycle1999Joke}
        onRollMouseTrapDice={handleRollMouseTrapDice}
        onBuildMouseTrapStage={handleBuildMouseTrapStage}
        onTriggerMouseTrapContraption={handleTriggerMouseTrapContraption}
        onCollectFloatingCheese={handleCollectFloatingCheese}
        onToggleMouseTrapBoardMode={handleToggleMouseTrapBoardMode}
        onTriggerMouseTrapScene={handleTriggerMouseTrapScene}
        onTriggerPhysicsBump={() => setPhysicsBumpTrigger((c) => c + 1)}
        onToggleToyChest={handleToggleToyChest}
        onAdvanceViewMasterSlide={handleAdvanceViewMasterSlide}
        onSelectViewMasterReel={handleSelectViewMasterReel}
        onToggleViewMasterEyepiece={handleToggleViewMasterEyepiece}
        onChangeCameraAngle={handleChangeCameraAngle}
        onToggleFollowAction={() => setFollowAction((prev) => !prev)}
        onToggleAutoPlayAll={() => setAutoPlayAll((prev) => !prev)}
        onToggleMute={() => {
          soundFX.muted = !soundFX.muted;
          setMuted(soundFX.muted);
        }}
        onToggleMusic={() => {
          soundFX.musicEnabled = !soundFX.musicEnabled;
          setMusicEnabled(soundFX.musicEnabled);
          if (soundFX.musicEnabled) {
            soundFX.startNostalgiaMusic();
          }
        }}
        onTogglePause={() =>
          setAppState((prev) => (prev === 'playing' ? 'paused' : 'playing'))
        }
        onReplayUnfold={handleOpenBox}
        onRestartGame={handleStartDirectBoard}
        onReturnToTitle={() => {
          setActiveAnimation(null);
          setActiveMouseStepAnim(null);
          setChainReactionStartMs(null);
          setAppState('title');
        }}
      />
    </main>
  );
}
