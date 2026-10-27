import React, { useState } from 'react';
import {
  CARD_INFO,
  LegalMove,
  PLAYER_COLORS,
  PLAYER_META,
  SorryGameState,
} from '../game/sorryRules';
import {
  GUESS_WHO_CHARACTERS,
  GUESS_WHO_QUESTIONS,
  GuessWhoGameState,
} from '../game/guessWhoRules';
import {
  CONTRAPTION_STAGES,
  INTERACTIVE_SCENES,
  InteractiveSceneId,
  MOUSE_COLORS,
  MOUSE_META,
  MOUSE_TRAP_SPACES,
  MouseTrapBoardMode,
  MouseTrapGameState,
} from '../game/mouseTrapRules';
import { ActiveGameType, CameraAngleId, RoomSubPhase } from './SorryRoomCanvas';

interface GameHudAndMenusProps {
  activeGame: ActiveGameType;
  appState: 'title' | 'playing' | 'paused' | 'gameover';
  subPhase: RoomSubPhase;
  gameState: SorryGameState;
  guessWhoState: GuessWhoGameState;
  mouseTrapState: MouseTrapGameState;
  cameraAngle: CameraAngleId;
  followAction: boolean;
  autoPlayAll: boolean;
  muted: boolean;
  musicEnabled: boolean;
  nearTable: boolean;
  isAnimatingMove: boolean;
  isMouseTrapAnimating: boolean;
  onStartBoxEntrance: () => void;
  onStartFpvRoom: () => void;
  onStartDirectBoard: () => void;
  onChangeGame: (nextGame?: ActiveGameType) => void;
  onWalkToTable: () => void;
  onOpenBox: () => void;
  onSkipUnfold: () => void;
  onDrawCard: () => void;
  onSelectMove: (move: LegalMove) => void;
  onPassTurn: () => void;
  onAskGuessWhoQuestion: (questionId: string) => void;
  onMakeDirectGuess: (characterId: string) => void;
  onToggleGuessWhoStand: (characterId: string) => void;
  onCycle1999Joke: () => void;
  onRollMouseTrapDice: () => void;
  onBuildMouseTrapStage: (buildAll?: boolean) => void;
  onTriggerMouseTrapContraption: () => void;
  onCollectFloatingCheese: () => void;
  onToggleMouseTrapBoardMode: (mode?: MouseTrapBoardMode) => void;
  onTriggerMouseTrapScene: (sceneId: InteractiveSceneId) => void;
  onChangeCameraAngle: (angle: CameraAngleId) => void;
  onToggleFollowAction: () => void;
  onToggleAutoPlayAll: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onTogglePause: () => void;
  onReplayUnfold: () => void;
  onRestartGame: () => void;
  onReturnToTitle: () => void;
}

const CAMERA_ANGLE_OPTIONS: {
  id: CameraAngleId;
  label: string;
  shortLabel: string;
  desc: string;
}[] = [
  {
    id: 'tabletop',
    label: 'Tabletop Main View (South · Red)',
    shortLabel: 'Tabletop Main',
    desc: 'Classic seated perspective over your Red side',
  },
  {
    id: 'mouse_pov',
    label: 'Mouse-Eye Control Mode (Zoom Into Board)',
    shortLabel: 'Mouse-Eye POV',
    desc: 'Zoom down onto the living board & take direct control of your Mouse!',
  },
  {
    id: 'top',
    label: 'Top-Down Overhead View',
    shortLabel: 'Top View',
    desc: 'Direct bird’s-eye view of the entire 3D table',
  },
  {
    id: 'side_north',
    label: 'Side View — North (Blue)',
    shortLabel: 'North Side',
    desc: 'View across the table from Blue’s side',
  },
  {
    id: 'side_east',
    label: 'Side View — East (Yellow)',
    shortLabel: 'East Side',
    desc: 'View across the table from East side',
  },
  {
    id: 'side_west',
    label: 'Side View — West (Green)',
    shortLabel: 'West Side',
    desc: 'View across the table from West side',
  },
  {
    id: 'fpv',
    label: 'First-Person Walk (FPV)',
    shortLabel: 'FPV Walk',
    desc: 'Walk freely around the dark room with WASD / Arrows',
  },
];

export const SorryTitleEmblem: React.FC<{ className?: string }> = ({
  className = 'w-80 h-auto',
}) => (
  <svg
    viewBox="0 0 520 140"
    className={className}
    role="img"
    aria-label="SORRY! Classic 3D Tabletop Game"
  >
    <defs>
      <filter id="sorryShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#000000" floodOpacity="0.85" />
      </filter>
    </defs>
    <g transform="translate(260, 70) rotate(-3)">
      <rect x="-235" y="-50" width="160" height="12" rx="6" fill="#ef4444" />
      <rect x="75" y="-50" width="160" height="12" rx="6" fill="#0ea5e9" />
      <rect x="-215" y="40" width="160" height="12" rx="6" fill="#22c55e" />
      <rect x="55" y="40" width="160" height="12" rx="6" fill="#eab308" />

      <rect
        x="-220"
        y="-42"
        width="440"
        height="84"
        rx="18"
        fill="#090a0f"
        stroke="#ffffff"
        strokeWidth="6"
        filter="url(#sorryShadow)"
      />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        stroke="#090a0f"
        strokeWidth="10"
        paintOrder="stroke fill"
        fontFamily='"Bricolage Grotesque", sans-serif'
        fontWeight="900"
        fontSize="82"
        letterSpacing="3"
      >
        SORRY!
      </text>
    </g>
  </svg>
);

export const GuessWhoTitleEmblem: React.FC<{ className?: string }> = ({
  className = 'w-80 h-auto',
}) => (
  <svg
    viewBox="0 0 540 150"
    className={className}
    role="img"
    aria-label="GUESS WHO? Classic 1999 Mystery Face Game"
  >
    <g transform="translate(270, 75) rotate(-2)">
      <rect
        x="-245"
        y="-52"
        width="490"
        height="104"
        rx="26"
        fill="#1e3a8a"
        stroke="#facc15"
        strokeWidth="7"
      />
      <text
        x="0"
        y="-8"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ef4444"
        stroke="#ffffff"
        strokeWidth="11"
        paintOrder="stroke fill"
        fontFamily='"Bricolage Grotesque", sans-serif'
        fontWeight="900"
        fontSize="66"
        letterSpacing="2"
      >
        GUESS WHO?
      </text>
      <text
        x="0"
        y="34"
        textAnchor="middle"
        fill="#fde047"
        fontFamily='"Plus Jakarta Sans", sans-serif'
        fontWeight="800"
        fontSize="16"
        letterSpacing="2.5"
      >
        1999 EDITION · THE MYSTERY FACE GAME
      </text>
    </g>
  </svg>
);

export const MouseTrapTitleEmblem: React.FC<{ className?: string }> = ({
  className = 'w-80 h-auto',
}) => (
  <svg
    viewBox="0 0 560 150"
    className={className}
    role="img"
    aria-label="MOUSE TRAP! 3D Pop-Up Contraption Game"
  >
    <g transform="translate(280, 75) rotate(-2)">
      <rect
        x="-255"
        y="-52"
        width="510"
        height="104"
        rx="26"
        fill="#4c1d95"
        stroke="#facc15"
        strokeWidth="7"
      />
      <text
        x="0"
        y="-8"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fde047"
        stroke="#090a0f"
        strokeWidth="11"
        paintOrder="stroke fill"
        fontFamily='"Bricolage Grotesque", sans-serif'
        fontWeight="900"
        fontSize="62"
        letterSpacing="2"
      >
        MOUSE TRAP!
      </text>
      <text
        x="0"
        y="34"
        textAnchor="middle"
        fill="#fca5a5"
        fontFamily='"Plus Jakarta Sans", sans-serif'
        fontWeight="800"
        fontSize="15"
        letterSpacing="2"
      >
        POP-UP 3D CONTRAPTION · FLOATING CHEESE · LIVE MICE
      </text>
    </g>
  </svg>
);

export const GameHudAndMenus: React.FC<GameHudAndMenusProps> = ({
  activeGame,
  appState,
  subPhase,
  gameState,
  guessWhoState,
  mouseTrapState,
  cameraAngle,
  followAction,
  autoPlayAll,
  muted,
  musicEnabled,
  nearTable,
  isAnimatingMove,
  isMouseTrapAnimating,
  onStartBoxEntrance,
  onStartFpvRoom,
  onChangeGame,
  onWalkToTable,
  onOpenBox,
  onSkipUnfold,
  onDrawCard,
  onSelectMove,
  onPassTurn,
  onAskGuessWhoQuestion,
  onMakeDirectGuess,
  onCycle1999Joke,
  onRollMouseTrapDice,
  onBuildMouseTrapStage,
  onTriggerMouseTrapContraption,
  onCollectFloatingCheese,
  onToggleMouseTrapBoardMode,
  onTriggerMouseTrapScene,
  onChangeCameraAngle,
  onToggleFollowAction,
  onToggleAutoPlayAll,
  onToggleMute,
  onToggleMusic,
  onTogglePause,
  onReplayUnfold,
  onRestartGame,
  onReturnToTitle,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [guessTab, setGuessTab] = useState<'questions' | 'accuse'>('questions');

  const currentCameraOption =
    CAMERA_ANGLE_OPTIONS.find((c) => c.id === cameraAngle) ?? CAMERA_ANGLE_OPTIONS[0];

  const isGuessWho = activeGame === 'guess_who';
  const isMouseTrap = activeGame === 'mouse_trap';

  const nextGameLabel =
    activeGame === 'sorry'
      ? 'GUESS WHO? 3D'
      : activeGame === 'guess_who'
      ? 'MOUSE TRAP! 3D'
      : 'SORRY! 3D';

  // ===========================================================================
  // 1. TITLE SCREEN OVERLAY (CARDBOARD BOX ENTRANCE + 3-GAME SWITCHER)
  // ===========================================================================
  if (appState === 'title') {
    return (
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-8">
        <div className="flex flex-col items-center w-full">
          {/* Top Bar on Title Screen */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="text-xs font-semibold tracking-wider text-amber-300/90 uppercase">
              1999 Tabletop Room · Cardboard Box Unfold & Living 3D Boards
            </div>
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeGame('sorry');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeGame === 'sorry'
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                1. SORRY! 3D
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeGame('guess_who');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeGame === 'guess_who'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                2. GUESS WHO? 3D
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeGame('mouse_trap');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeGame === 'mouse_trap'
                    ? 'bg-purple-500 text-white border border-yellow-300'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                3. MOUSE TRAP! 3D
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMusic();
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-xs font-medium text-amber-300 hover:border-amber-400/60 transition-colors cursor-pointer whitespace-nowrap"
              >
                {musicEnabled && !muted ? '90s Music: ON' : '90s Music: OFF'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
                className="px-3 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-xs font-medium text-zinc-200 hover:border-amber-400/60 transition-colors cursor-pointer whitespace-nowrap"
              >
                {muted ? 'Audio: Muted' : 'Audio: On'}
              </button>
            </div>
          </div>

          {isMouseTrap ? (
            <MouseTrapTitleEmblem className="w-64 md:w-80 h-auto" />
          ) : isGuessWho ? (
            <GuessWhoTitleEmblem className="w-64 md:w-80 h-auto" />
          ) : (
            <SorryTitleEmblem className="w-64 md:w-80 h-auto" />
          )}

          <div className="mt-2 px-4 py-2 rounded-xl bg-zinc-950/85 border border-zinc-800/80 max-w-lg text-center">
            <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed">
              {isMouseTrap ? (
                <>
                  Open the <span className="text-yellow-300 font-bold">MOUSE TRAP!</span> box! Watch
                  the 3D Rube Goldberg contraption pop up out of the living board, chase{' '}
                  <span className="text-amber-300 font-bold">Floating Cheese</span>, drop the Red
                  Cage to trap rivals, or <span className="text-rose-400 font-bold">zoom in to control your Mouse!</span>
                </>
              ) : isGuessWho ? (
                <>
                  Open the <span className="text-yellow-300 font-bold">GUESS WHO?</span> cardboard
                  box on the table! Watch the 3D Red & Blue trays unfold, flip the 24 picture
                  stands, and enjoy live play-by-play from our 1999 Nostalgia Narrator!
                </>
              ) : (
                <>
                  Open the <span className="text-amber-300 font-bold">SORRY!</span> cardboard game
                  box under the single hanging lamp! Watch the box open, the board unfold flat, and
                  all 16 pieces leap out to play Classic Sorry!
                </>
              )}
            </p>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartBoxEntrance();
              }}
              className={`px-9 py-3 rounded-xl font-extrabold text-base md:text-lg tracking-wide shadow-2xl transition-all cursor-pointer whitespace-nowrap ${
                isMouseTrap
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
                  : isGuessWho
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
                  : 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
              }`}
            >
              PLAY (Open Cardboard Box)
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeGame();
              }}
              className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs md:text-sm shadow-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Change Game (Next: {nextGameLabel})
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartFpvRoom();
              }}
              className="px-4 py-3 rounded-xl bg-zinc-950/95 hover:bg-zinc-900 border border-zinc-700 text-zinc-100 font-semibold text-xs md:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              First-Person Walk (FPV)
            </button>
          </div>
        </div>

        <div className="mx-auto px-4 py-1.5 rounded-lg bg-zinc-950/85 text-center text-xs text-zinc-300 font-medium tracking-wide">
          AI Turn Cinematic Pan · Pop-Up Mouse Trap Contraption · Floating Cheese · Mouse POV Control
        </div>
      </div>
    );
  }

  const pawnSummary = PLAYER_COLORS.map((color) => {
    const cPawns = gameState.pawns.filter((p) => p.color === color);
    return {
      color,
      meta: PLAYER_META[color],
      startCount: cPawns.filter((p) => p.zone === 'start').length,
      trackCount: cPawns.filter((p) => p.zone === 'track' || p.zone === 'safety').length,
      homeCount: cPawns.filter((p) => p.zone === 'home').length,
    };
  });

  const activePlayerMeta = PLAYER_META[gameState.currentTurn];
  const isHumanRedTurn = !autoPlayAll && gameState.currentTurn === 'red';

  const standingPlayerCharacters = GUESS_WHO_CHARACTERS.filter(
    (c) => !guessWhoState.playerFoldedIds.includes(c.id)
  );
  const standingAiCount =
    GUESS_WHO_CHARACTERS.length - guessWhoState.aiFoldedIds.length;
  const latestNarrator = guessWhoState.narratorLog[0];

  const isMousePov = cameraAngle === 'mouse_pov';
  const activeMouseMeta = MOUSE_META[mouseTrapState.currentTurn];
  const isHumanRedMouseTurn = !autoPlayAll && mouseTrapState.currentTurn === 'red';

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-5">
      {/* =====================================================================
          TOP BAR: HAMBURGER MENU + GAME SWITCHERS + MOUSE CONTROL + UTILITIES
         ===================================================================== */}
      <div className="flex items-start justify-between gap-3">
        <div className="relative pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
            {/* Hamburger Menu Button */}
            <button
              type="button"
              aria-label="Camera & View Menu"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.currentTarget.blur();
                setMenuOpen((prev) => !prev);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-zinc-100 shadow-xl transition-colors cursor-pointer ${
                isMouseTrap
                  ? 'bg-purple-950/95 hover:bg-purple-900 border-yellow-400/70'
                  : isGuessWho
                  ? 'bg-blue-950/95 hover:bg-blue-900 border-yellow-400/60'
                  : 'bg-zinc-950/95 hover:bg-zinc-900 border-zinc-800 hover:border-amber-400/60'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-5 h-5 shrink-0 ${
                  isGuessWho || isMouseTrap ? 'text-yellow-400' : 'text-amber-400'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M6 18L18 6" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-100 leading-none whitespace-nowrap">
                  Camera & Views
                </div>
                <div className="text-[11px] text-amber-300/90 font-medium mt-0.5 whitespace-nowrap">
                  {subPhase === 'fpv_room'
                    ? 'FPV Room Walk'
                    : `${currentCameraOption.shortLabel}${
                        followAction ? ' · AI Pan ON' : ''
                      }`}
                </div>
              </div>
            </button>

            {/* Quick 3-Game Switcher Buttons */}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeGame();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap border border-amber-300"
            >
              Change Game: {nextGameLabel}
            </button>

            {/* Direct Jump to MOUSE TRAP! 3D when in Sorry or Guess Who */}
            {!isMouseTrap && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeGame('mouse_trap');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap border border-yellow-400/70"
              >
                Play MOUSE TRAP! 3D
              </button>
            )}

            {/* Prominent Mode 1 vs Mode 2 Switcher + Mouse Control in Mouse Trap! */}
            {isMouseTrap && subPhase === 'board_play' && (
              <>
                <div className="flex items-center rounded-xl bg-slate-950/95 border border-yellow-400/70 p-0.5 shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onToggleMouseTrapBoardMode('mode1_classic');
                    }}
                    className={`px-2.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                      mouseTrapState.boardMode === 'mode1_classic'
                        ? 'bg-yellow-400 text-slate-950 shadow'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    Mode 1: Classic Pop-Up
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onToggleMouseTrapBoardMode('mode2_living_square');
                    }}
                    className={`px-2.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                      mouseTrapState.boardMode === 'mode2_living_square'
                        ? 'bg-lime-400 text-slate-950 shadow'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    Mode 2: 3D Popped Trail & Scenes
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onChangeCameraAngle(isMousePov ? 'tabletop' : 'mouse_pov');
                  }}
                  className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap border ${
                    isMousePov
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-yellow-300'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200'
                  }`}
                >
                  {isMousePov
                    ? 'Exit Mouse Control (Back to Tabletop)'
                    : 'Take Control of Mouse (Zoom Into Board!)'}
                </button>
              </>
            )}

            {/* Quick Cinematic AI Turn Pan & Follow-Action Toggle */}
            {subPhase === 'board_play' && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleFollowAction();
                }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  followAction
                    ? 'bg-amber-400/20 border-amber-400/70 text-amber-200'
                    : 'bg-zinc-950/90 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {followAction ? 'Cinematic AI Pan: ON' : 'Cinematic AI Pan: OFF'}
              </button>
            )}
          </div>

          {/* Hamburger Dropdown Menu */}
          {menuOpen && (
            <div
              role="menu"
              aria-label="Camera Angles and Game Options"
              className="mt-2 w-84 rounded-2xl bg-zinc-950/98 border border-zinc-800 shadow-2xl p-3.5 text-zinc-100 space-y-3"
            >
              {/* 3-Game Switcher inside Hamburger Menu */}
              <div className="pb-2.5 border-b border-zinc-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1.5">
                  Choose 3D Tabletop Game Box
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeGame === 'sorry'}
                    onClick={() => {
                      onChangeGame('sorry');
                      setMenuOpen(false);
                    }}
                    className={`px-2 py-2 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
                      activeGame === 'sorry'
                        ? 'bg-amber-400 text-zinc-950 border-amber-300'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    SORRY! 3D
                  </button>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeGame === 'guess_who'}
                    onClick={() => {
                      onChangeGame('guess_who');
                      setMenuOpen(false);
                    }}
                    className={`px-2 py-2 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
                      activeGame === 'guess_who'
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    GUESS WHO?
                  </button>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeGame === 'mouse_trap'}
                    onClick={() => {
                      onChangeGame('mouse_trap');
                      setMenuOpen(false);
                    }}
                    className={`px-2 py-2 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
                      activeGame === 'mouse_trap'
                        ? 'bg-purple-500 text-white border-yellow-300'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    MOUSE TRAP!
                  </button>
                </div>
              </div>

              {/* Action Camera Choreography */}
              <div className="pb-2.5 border-b border-zinc-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                  Action Camera Choreography
                </div>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={followAction}
                  onClick={() => onToggleFollowAction()}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <div>
                    <div className="text-xs font-bold text-zinc-100">
                      Follow the Action & AI Turn Pan (Cinematic)
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                      Gently pans around the tabletop during AI turns & zooms on trap chain reactions
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold shrink-0 ${
                      followAction
                        ? 'bg-amber-400 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {followAction ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Camera Angles */}
              <div className="pb-2.5 border-b border-zinc-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Main Camera Angle
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {CAMERA_ANGLE_OPTIONS.map((opt) => {
                    const active = cameraAngle === opt.id && subPhase === 'board_play';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => {
                          onChangeCameraAngle(opt.id);
                          setMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-400/20 border border-amber-400/60 text-amber-200'
                            : 'hover:bg-zinc-900 text-zinc-200 border border-transparent'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                        </div>
                        {active && (
                          <span className="text-[11px] font-bold text-amber-300 shrink-0">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box Unfold & Music Controls */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={musicEnabled}
                  onClick={() => onToggleMusic()}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                >
                  <span>1999 Nostalgia Music</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      musicEnabled
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {musicEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {!isGuessWho && (
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={autoPlayAll}
                    onClick={() => onToggleAutoPlayAll()}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span>Auto-Play All 4 Players (Watch AI Pan)</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        autoPlayAll
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {autoPlayAll ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onReplayUnfold();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                >
                  <span>Replay Cardboard Box Unfold</span>
                  <span className="text-[11px] text-amber-300">Unfold</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Utility Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMusic();
            }}
            className={`px-3 h-10 rounded-xl border text-xs font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 ${
              musicEnabled && !muted
                ? 'bg-zinc-950/90 border-amber-400/50 text-amber-300'
                : 'bg-zinc-950/90 border-zinc-800 text-zinc-400'
            }`}
          >
            <span>♫ ’99 Music: {musicEnabled && !muted ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute Sound [M]' : 'Mute Sound [M]'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Restart Match [R]"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestartGame();
            }}
            className="w-10 h-10 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game [P]"
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            className="w-10 h-10 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SIDE NARRATOR PANEL FOR GUESS WHO? (WORD-FOR-WORD PLAY + 1999 JOKES)
         ===================================================================== */}
      {isGuessWho && subPhase === 'board_play' && latestNarrator && (
        <aside
          aria-label="1999 Nostalgia Narrator Commentary"
          className="pointer-events-auto self-end my-auto w-full max-w-xs rounded-2xl bg-blue-950/95 border-2 border-yellow-400/80 p-3.5 shadow-2xl space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-blue-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                LIVE ’99 HOST
              </span>
              <span className="text-xs font-extrabold text-yellow-300">
                {latestNarrator.speaker}
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-sky-300">
              {latestNarrator.timestamp}
            </span>
          </div>

          <div className="rounded-xl bg-slate-950/90 border border-blue-900/80 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-0.5">
              Turn-by-Turn Play-by-Play
            </div>
            <p className="text-xs font-semibold text-white leading-snug">
              {latestNarrator.playByPlay}
            </p>
          </div>

          <div className="rounded-xl bg-yellow-400/15 border border-yellow-400/40 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-300">
                1999 Nostalgia Joke
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onCycle1999Joke();
                }}
                className="px-2 py-0.5 rounded bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-[10px] transition-colors cursor-pointer"
              >
                Next ’99 Joke ↻
              </button>
            </div>
            <p className="text-xs italic text-yellow-100 leading-snug">
              “{latestNarrator.joke99}”
            </p>
          </div>
        </aside>
      )}

      {/* =====================================================================
          SIDE CONTRAPTION & INTERACTIVE SCENES PANEL FOR MOUSE TRAP! 3D
         ===================================================================== */}
      {isMouseTrap && subPhase === 'board_play' && (
        <aside
          aria-label="3D Pop-Up Contraption Stages and Interactive Scenes"
          className="pointer-events-auto self-end my-auto w-full max-w-xs rounded-2xl bg-purple-950/95 border-2 border-yellow-400/80 p-3 shadow-2xl space-y-2"
        >
          <div className="flex items-center justify-between gap-2 border-b border-purple-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                {mouseTrapState.boardMode === 'mode2_living_square' ? 'MODE 2' : 'MODE 1'}
              </span>
              <span className="text-xs font-extrabold text-yellow-300">
                Contraption ({mouseTrapState.builtStages}/5 Built)
              </span>
            </div>
            {mouseTrapState.builtStages < 5 && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onBuildMouseTrapStage(true);
                }}
                className="px-2 py-0.5 rounded bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-[10px] transition-colors cursor-pointer"
              >
                Pop Up All 5!
              </button>
            )}
          </div>

          <div className="space-y-1">
            {CONTRAPTION_STAGES.map((st) => {
              const built = st.stage <= mouseTrapState.builtStages;
              return (
                <div
                  key={st.id}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] border ${
                    built
                      ? 'bg-emerald-950/70 border-emerald-400/50 text-emerald-200 font-bold'
                      : 'bg-slate-950/70 border-purple-900/60 text-purple-300'
                  }`}
                >
                  <span>{st.shortName}</span>
                  <span className="text-[10px] uppercase font-extrabold">
                    {built ? 'Popped Up ✓' : 'In Board'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive 3D Pop-Up Scenes Grid (Click to Trigger Scene & +Cheese!) */}
          <div className="pt-1 border-t border-purple-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-lime-300">
              <span>Interactive 3D Board Scenes</span>
              <span>Click 3D or Below</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {INTERACTIVE_SCENES.map((sc) => {
                const isActive = mouseTrapState.activeSceneId === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onTriggerMouseTrapScene(sc.id);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-left border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-lime-400 text-slate-950 border-white font-extrabold'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-yellow-200 border-purple-700 font-bold'
                    }`}
                  >
                    <div className="text-[11px] leading-tight truncate">{sc.shortName}</div>
                    <div
                      className={`text-[9px] font-extrabold ${
                        isActive ? 'text-slate-900' : 'text-emerald-300'
                      }`}
                    >
                      {sc.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerMouseTrapContraption();
              }}
              className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg border border-yellow-300/60 transition-colors cursor-pointer"
            >
              Turn Crank & Drop Red Cage Trap!
            </button>
          </div>
        </aside>
      )}

      {/* =====================================================================
          CENTER GAZE RETICLE (IN FIRST-PERSON ROOM EXPLORATION)
         ===================================================================== */}
      {subPhase === 'fpv_room' && (
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
          aria-hidden="true"
        >
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 transition-transform ${
              nearTable
                ? 'border-amber-400 scale-125 bg-amber-400/30'
                : 'border-white/50 bg-black/20'
            }`}
          />
          {nearTable && (
            <div className="mt-2 px-3 py-1 rounded-md bg-zinc-950/90 border border-amber-400/70 text-[11px] font-bold text-amber-300 tracking-wide whitespace-nowrap">
              {isMouseTrap ? 'MOUSE TRAP!' : isGuessWho ? 'GUESS WHO?' : 'SORRY!'} Cardboard Box —
              Press [E] or Click Open
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          UNFOLDING CARDBOARD BOX PROGRESS BANNER
         ===================================================================== */}
      {subPhase === 'unfolding' && (
        <div className="mx-auto mb-6 pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-2xl bg-zinc-950/95 border border-amber-400/60 shadow-2xl">
          <div className="text-sm font-bold text-amber-200">
            {isMouseTrap
              ? 'Opening MOUSE TRAP! Cardboard Box, Unfolding Living Board & Pop-Up Contraptions...'
              : isGuessWho
              ? 'Opening GUESS WHO? Cardboard Box & Unfolding 48 Picture Stands...'
              : 'Opening SORRY! Cardboard Box, Unfolding Board & Laying Out 16 Pieces...'}
          </div>
          <button
            type="button"
            onClick={onSkipUnfold}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
          >
            Skip Unfold
          </button>
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR FPV ROOM WALK
         ===================================================================== */}
      {subPhase === 'fpv_room' && (
        <div className="mx-auto w-full max-w-2xl pointer-events-auto rounded-2xl bg-zinc-950/95 border border-zinc-800 p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="text-sm font-bold text-zinc-100">
              {nearTable
                ? `You are at the table! Open the ${
                    isMouseTrap ? 'MOUSE TRAP!' : isGuessWho ? 'GUESS WHO?' : 'SORRY!'
                  } cardboard box.`
                : 'First-Person Room Exploration — Walk up to the cardboard box on the table'}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Use <span className="text-zinc-200 font-semibold">WASD / Arrow Keys</span> to walk,{' '}
              <span className="text-zinc-200 font-semibold">Drag Mouse</span> to look around
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!nearTable && (
              <button
                type="button"
                onClick={onWalkToTable}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Walk Up to Table
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBox}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Open Box [E]
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR 3D MOUSE TRAP! (POP-UP TRAPS, FLOATING CHEESE & MOUSE CONTROL)
         ===================================================================== */}
      {subPhase === 'board_play' && isMouseTrap && (
        <div className="mx-auto w-full max-w-[960px] flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto px-4 py-1 rounded-t-xl bg-purple-950/95 border border-b-0 border-yellow-400/70 text-[11px] font-extrabold text-yellow-300 hover:text-white transition-colors cursor-pointer"
          >
            {dockCollapsed
              ? '▴ Show Mouse Trap! 3D Controls'
              : '▾ Hide Console (Inspect Pop-Up Contraption)'}
          </button>

          {!dockCollapsed && (
            <div className="w-full pointer-events-auto rounded-2xl bg-purple-950/95 border-2 border-yellow-400/80 p-3.5 shadow-2xl space-y-2.5">
              {/* Top Row: 4 Living Mice Status Pills (Cheese Count, Space, Trapped State) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-800">
                <div className="flex flex-wrap items-center gap-2">
                  {MOUSE_COLORS.map((color) => {
                    const m = mouseTrapState.mice[color];
                    const meta = MOUSE_META[color];
                    const isTurn = mouseTrapState.currentTurn === color;
                    return (
                      <div
                        key={color}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                          m.isTrapped
                            ? 'bg-red-950/90 border-red-400 text-red-200'
                            : isTurn
                            ? 'bg-slate-900 border-yellow-400 text-white shadow'
                            : 'bg-slate-950/70 border-purple-800/80 text-purple-200'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span className="font-extrabold">
                          {meta.name}
                          {color === 'red' ? ' (You)' : ''}
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-yellow-300 font-bold">
                          🧀 {m.cheeseCount}
                        </span>
                        <span className="text-[10px] text-purple-300">
                          {m.isTrapped
                            ? '🔒 TRAPPED IN CAGE!'
                            : `Space ${m.trackIndex + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs font-semibold text-yellow-200 truncate max-w-xs md:max-w-sm">
                  {mouseTrapState.lastActionLog}
                </div>
              </div>

              {/* Action Row: Dice Roll + Pop-Up Trap Builder + Mouse Control Mode */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 border-2 border-white flex flex-col items-center justify-center font-extrabold shrink-0 shadow">
                    <span className="text-[9px] uppercase tracking-tighter font-bold">
                      Die
                    </span>
                    <span className="text-base font-mono tabular-nums leading-none">
                      {mouseTrapState.lastDiceRoll ?? '🎲'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: activeMouseMeta.accentHex }}
                      >
                        {isMousePov
                          ? 'Mouse-Eye POV Active — Drive Your Living Red Mouse!'
                          : `${activeMouseMeta.name}’s Turn`}
                      </span>
                      {mouseTrapState.mice[mouseTrapState.currentTurn].isTrapped && (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase">
                          Trapped Under Red Cage!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-purple-200 mt-0.5">
                      {isMousePov
                        ? 'Use WASD / Arrow Keys to scamper across the living board and snatch Floating Cheese, or Roll Die!'
                        : `Current Space: ${
                            MOUSE_TRAP_SPACES[
                              mouseTrapState.mice[mouseTrapState.currentTurn].trackIndex
                            ]?.label ?? 'START'
                          }`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {isMouseTrapAnimating ? (
                    <div className="px-4 py-2 rounded-xl bg-slate-900 border border-yellow-400/60 text-xs font-extrabold text-yellow-300">
                      Contraption / Mouse in Motion...
                    </div>
                  ) : (
                    <>
                      {isHumanRedMouseTurn ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            onRollMouseTrapDice();
                          }}
                          className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs md:text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap"
                        >
                          {mouseTrapState.mice.red.isTrapped
                            ? 'Roll / Pay Cheese to Escape Cage [Space]'
                            : 'Roll Die & Scamper [Space]'}
                        </button>
                      ) : (
                        <span className="px-3 py-2 rounded-xl bg-slate-900 text-xs font-bold text-yellow-300">
                          {activeMouseMeta.name} scampering (AI Camera Panning)...
                        </span>
                      )}

                      {isMousePov && !mouseTrapState.mice.red.isTrapped && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            onCollectFloatingCheese();
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Leap & Snatch Floating Cheese (+1 🧀)
                        </button>
                      )}

                      {mouseTrapState.builtStages < 5 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            onBuildMouseTrapStage(false);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Pop Up Trap Stage ({mouseTrapState.builtStages + 1}/5)
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onChangeCameraAngle(isMousePov ? 'tabletop' : 'mouse_pov');
                        }}
                        className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs shadow transition-colors cursor-pointer whitespace-nowrap ${
                          isMousePov
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                        }`}
                      >
                        {isMousePov ? 'Back to Tabletop View' : 'Zoom In & Control Mouse'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR 3D GUESS WHO? (DISTINCTIVE 1999 RETRO RED/BLUE/YELLOW UI)
         ===================================================================== */}
      {subPhase === 'board_play' && isGuessWho && (
        <div className="mx-auto w-full max-w-[940px] flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto px-4 py-1 rounded-t-xl bg-blue-950/95 border border-b-0 border-yellow-400/70 text-[11px] font-extrabold text-yellow-300 hover:text-white transition-colors cursor-pointer"
          >
            {dockCollapsed ? '▴ Show Guess Who? Console' : '▾ Hide Console (Inspect 3D Trays)'}
          </button>

          {!dockCollapsed && (
            <div className="w-full pointer-events-auto rounded-2xl bg-blue-950/95 border-2 border-yellow-400/80 p-3.5 shadow-2xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-800">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3 py-1 rounded-xl bg-yellow-400 text-slate-950 font-extrabold text-xs shadow">
                    Your Mystery Card: {guessWhoState.playerSecret.name}
                  </div>
                  <div className="text-xs font-bold text-white font-mono tabular-nums">
                    Red Tray Standing: {standingPlayerCharacters.length}/24 · Blue Tray:{' '}
                    {standingAiCount}/24
                  </div>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-blue-800">
                  <button
                    type="button"
                    onClick={() => setGuessTab('questions')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      guessTab === 'questions'
                        ? 'bg-red-600 text-white'
                        : 'text-sky-300 hover:text-white'
                    }`}
                  >
                    1. Ask Yes/No Trait ({GUESS_WHO_QUESTIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuessTab('accuse')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      guessTab === 'accuse'
                        ? 'bg-yellow-400 text-slate-950'
                        : 'text-sky-300 hover:text-white'
                    }`}
                  >
                    2. Guess Mystery Person ({standingPlayerCharacters.length})
                  </button>
                </div>
              </div>

              {guessWhoState.turn === 'ai' ? (
                <div className="py-2 text-center text-xs font-extrabold text-yellow-300">
                  CPU (Blue Tray) is asking a question & flipping stands (AI Camera Panning)...
                </div>
              ) : guessTab === 'questions' ? (
                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                  {GUESS_WHO_QUESTIONS.map((q) => {
                    const alreadyAsked = guessWhoState.askedQuestionIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        disabled={alreadyAsked}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onAskGuessWhoQuestion(q.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                          alreadyAsked
                            ? 'bg-slate-900/60 text-slate-500 border border-slate-800 cursor-not-allowed line-through'
                            : 'bg-red-600 hover:bg-red-500 text-white border border-red-400/50 shadow'
                        }`}
                      >
                        {q.shortLabel}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-sky-200 font-medium">
                    Ready to accuse? Click a standing suspect below (or click any 3D stand on the
                    table to flip it manually):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                    {standingPlayerCharacters.map((char) => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onMakeDirectGuess(char.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs shadow transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Guess {char.name}?
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR CLASSIC SORRY!
         ===================================================================== */}
      {subPhase === 'board_play' && activeGame === 'sorry' && (
        <div className="mx-auto w-full max-w-[920px] flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto px-4 py-1 rounded-t-xl bg-zinc-950/95 border border-b-0 border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {dockCollapsed ? '▴ Show Game Controls' : '▾ Hide Controls'}
          </button>

          {!dockCollapsed && (
            <div className="w-full pointer-events-auto rounded-2xl bg-zinc-950/95 border border-zinc-800 p-3.5 md:p-4 shadow-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  {pawnSummary.map(({ color, meta, startCount, trackCount, homeCount }) => {
                    const isTurn = gameState.currentTurn === color;
                    return (
                      <div
                        key={color}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                          isTurn
                            ? 'bg-zinc-900 border-amber-400/80 text-zinc-100 shadow-sm'
                            : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <span className="font-bold text-zinc-100">
                          {meta.name}
                          {color === 'red' && !autoPlayAll ? ' (You)' : ''}
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-zinc-300">
                          Home {homeCount}/4 · Track {trackCount} · Start {startCount}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-zinc-300 font-medium truncate max-w-xs md:max-w-sm">
                  {gameState.lastActionLog}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-14 rounded-xl flex flex-col items-center justify-center font-extrabold border-2 shrink-0 shadow-md"
                    style={{
                      backgroundColor: gameState.currentCard ? '#f8fafc' : '#18181b',
                      borderColor: activePlayerMeta.hex,
                      color: gameState.currentCard ? '#0f172a' : '#a1a1aa',
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-tighter font-bold text-zinc-500">
                      Card
                    </span>
                    <span className="text-base font-mono tabular-nums leading-none mt-0.5">
                      {gameState.currentCard ?? '—'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: activePlayerMeta.accentHex }}
                      >
                        {activePlayerMeta.name}’s Turn
                      </span>
                      <span className="text-xs text-zinc-400">
                        ·{' '}
                        {isAnimatingMove
                          ? '3D Piece Moving on Board...'
                          : gameState.turnPhase === 'draw'
                          ? 'Waiting to Draw Card'
                          : 'Select a Move'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 max-w-md">
                      {gameState.currentCard
                        ? CARD_INFO[gameState.currentCard].ruleSummary
                        : 'Click Draw Card (or click the 3D card deck on the table) to reveal a card.'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {isAnimatingMove ? (
                    <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-amber-300">
                      Pieces Moving on Table...
                    </div>
                  ) : isHumanRedTurn ? (
                    gameState.turnPhase === 'draw' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onDrawCard();
                        }}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap"
                      >
                        Draw Card [Space]
                      </button>
                    ) : gameState.legalMoves.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                        {gameState.legalMoves.slice(0, 4).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              onSelectMove(m);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shadow transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onPassTurn();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        No Legal Moves — Next Turn [Space]
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-300">
                        {activePlayerMeta.name} playing (Cinematic AI Camera Panning)...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PAUSE & GAME OVER STATUS MODALS
         ===================================================================== */}
      {(appState === 'paused' || appState === 'gameover') && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={appState === 'paused' ? 'Game Paused' : 'Game Over'}
          className="fixed inset-0 z-30 pointer-events-auto bg-black/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-center space-y-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {appState === 'paused'
                  ? '1999 Tabletop Paused'
                  : isMouseTrap
                  ? 'Contraption Victory!'
                  : isGuessWho
                  ? guessWhoState.winner === 'player'
                    ? 'Mystery Solved!'
                    : 'Mystery Lost!'
                  : gameState.winner === 'red'
                  ? 'Sweet Revenge Victory!'
                  : 'Match Complete'}
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-100 mt-1">
                {appState === 'paused'
                  ? isMouseTrap
                    ? 'MOUSE TRAP! 3D (Pop-Up Contraption)'
                    : isGuessWho
                    ? 'GUESS WHO? 3D (1999 Edition)'
                    : 'SORRY! 3D Tabletop Room'
                  : isMouseTrap
                  ? `${MOUSE_META[mouseTrapState.winner ?? 'red'].name} Wins Mouse Trap!`
                  : isGuessWho
                  ? guessWhoState.winner === 'player'
                    ? `You Found ${guessWhoState.aiSecret.name}!`
                    : `CPU Found ${guessWhoState.playerSecret.name}!`
                  : `${PLAYER_META[gameState.winner ?? 'red'].name} Wins the Game!`}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isMouseTrap
                  ? mouseTrapState.winReason || mouseTrapState.lastActionLog
                  : isGuessWho
                  ? guessWhoState.winReason
                  : gameState.lastActionLog}
              </p>
            </div>

            {isMouseTrap ? (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">Turns</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-zinc-100 mt-0.5">
                    {Math.round(mouseTrapState.turnCount)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">
                    Your Cheese
                  </div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-yellow-300 mt-0.5">
                    {Math.round(mouseTrapState.mice.red.cheeseCount)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">
                    Traps Sprung
                  </div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-rose-400 mt-0.5">
                    {Math.round(mouseTrapState.trapsTriggered)}
                  </div>
                </div>
              </div>
            ) : isGuessWho ? (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">Turns</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-zinc-100 mt-0.5">
                    {Math.round(guessWhoState.turnCount)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">
                    Stands Folded
                  </div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-yellow-300 mt-0.5">
                    {Math.round(guessWhoState.playerFoldedIds.length)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">
                    CPU Secret
                  </div>
                  <div className="text-sm font-extrabold text-emerald-300 mt-1.5 truncate">
                    {guessWhoState.winner ? guessWhoState.aiSecret.name : '???'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">Turns</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-zinc-100 mt-0.5">
                    {Math.round(gameState.stats.turnsPlayed)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">Bumps</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-amber-300 mt-0.5">
                    {Math.round(
                      gameState.stats.bumpsInflicted.red +
                        gameState.stats.bumpsInflicted.blue +
                        gameState.stats.bumpsInflicted.yellow +
                        gameState.stats.bumpsInflicted.green
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] font-bold uppercase text-zinc-400">Slides</div>
                  <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-300 mt-0.5">
                    {Math.round(
                      gameState.stats.slidesTriggered.red +
                        gameState.stats.slidesTriggered.blue +
                        gameState.stats.slidesTriggered.yellow +
                        gameState.stats.slidesTriggered.green
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {appState === 'paused' ? (
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-sm cursor-pointer"
                >
                  Resume Game
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestartGame}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-sm cursor-pointer"
                >
                  Play Again
                </button>
              )}

              <button
                type="button"
                onClick={() => onChangeGame()}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs cursor-pointer"
              >
                Change Game ({nextGameLabel})
              </button>

              <button
                type="button"
                onClick={onReturnToTitle}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold text-xs cursor-pointer"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
