import React, { useEffect, useRef, useState } from 'react';
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
import {
  getCurrentViewMasterSlide,
  VIEW_MASTER_REEL_ORDER,
  VIEW_MASTER_REELS,
  ViewMasterGameState,
  ViewMasterReelId,
} from '../game/viewMasterRules';
import { renderViewMasterSlideToCanvas } from '../game/step2ToyChestAndViewMaster3D';
import { ActiveGameType, CameraAngleId, RoomSubPhase } from './SorryRoomCanvas';

interface GameHudAndMenusProps {
  activeGame: ActiveGameType;
  appState: 'title' | 'playing' | 'paused' | 'gameover';
  subPhase: RoomSubPhase;
  gameState: SorryGameState;
  guessWhoState: GuessWhoGameState;
  mouseTrapState: MouseTrapGameState;
  viewMasterState: ViewMasterGameState;
  toyChestOpen: boolean;
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
  onTriggerPhysicsBump: () => void;
  onToggleToyChest: () => void;
  onAdvanceViewMasterSlide: () => void;
  onSelectViewMasterReel: (reelId: ViewMasterReelId) => void;
  onToggleViewMasterEyepiece: () => void;
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
    label: 'Tabletop Main View (Drag to Orbit)',
    shortLabel: 'Tabletop',
    desc: 'Seated perspective — click & drag anywhere to orbit/pan',
  },
  {
    id: 'fpv',
    label: 'Stand Up & Roam Room (Game Continues!)',
    shortLabel: 'Stand & Roam',
    desc: 'Stand up to pan/walk around the room while the game keeps playing',
  },
  {
    id: 'toy_chest',
    label: 'Step2 Toy Chest Side View',
    shortLabel: 'Toy Chest',
    desc: 'Inspect the 3D Step2 Lift & Hide Toy Chest beside the table',
  },
  {
    id: 'mouse_pov',
    label: 'Mouse-Eye POV (Zoom Into Board)',
    shortLabel: 'Mouse POV',
    desc: 'Zoom onto the board & drive your Mouse with WASD',
  },
  {
    id: 'top',
    label: 'Top-Down Overhead View',
    shortLabel: 'Top View',
    desc: 'Direct bird’s-eye view of the entire 3D table',
  },
  {
    id: 'side_north',
    label: 'North Side View',
    shortLabel: 'North Side',
    desc: 'View across the table from North side',
  },
  {
    id: 'side_east',
    label: 'East Side View',
    shortLabel: 'East Side',
    desc: 'View across the table from East side',
  },
  {
    id: 'side_west',
    label: 'West Side View',
    shortLabel: 'West Side',
    desc: 'View across the table from West side',
  },
];

export const SorryTitleEmblem: React.FC<{ className?: string }> = ({
  className = 'w-72 h-auto',
}) => (
  <svg
    viewBox="0 0 520 140"
    className={className}
    role="img"
    aria-label="SORRY! Classic 3D Tabletop Game"
  >
    <g transform="translate(260, 70) rotate(-3)">
      <rect x="-220" y="-42" width="440" height="84" rx="18" fill="#090a0f" stroke="#ffffff" strokeWidth="6" />
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
  className = 'w-72 h-auto',
}) => (
  <svg
    viewBox="0 0 540 150"
    className={className}
    role="img"
    aria-label="GUESS WHO? Classic 1999 Mystery Face Game"
  >
    <g transform="translate(270, 75) rotate(-2)">
      <rect x="-245" y="-52" width="490" height="104" rx="26" fill="#1e3a8a" stroke="#facc15" strokeWidth="7" />
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
  className = 'w-72 h-auto',
}) => (
  <svg
    viewBox="0 0 560 150"
    className={className}
    role="img"
    aria-label="MOUSE TRAP! 3D Pop-Up Contraption Game"
  >
    <g transform="translate(280, 75) rotate(-2)">
      <rect x="-255" y="-52" width="510" height="104" rx="26" fill="#4c1d95" stroke="#facc15" strokeWidth="7" />
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
        CANNON.JS PHYSICS · POP-UP 3D CONTRAPTION
      </text>
    </g>
  </svg>
);

export const ViewMasterTitleEmblem: React.FC<{ className?: string }> = ({
  className = 'w-72 h-auto',
}) => (
  <svg
    viewBox="0 0 560 150"
    className={className}
    role="img"
    aria-label="VIEW-MASTER 3D Stereoscopic Viewer & Reels"
  >
    <g transform="translate(280, 75) rotate(-2)">
      <rect x="-255" y="-52" width="510" height="104" rx="26" fill="#b91c1c" stroke="#fde047" strokeWidth="7" />
      <text
        x="0"
        y="-8"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        stroke="#7f1d1d"
        strokeWidth="10"
        paintOrder="stroke fill"
        fontFamily='"Bricolage Grotesque", sans-serif'
        fontWeight="900"
        fontSize="58"
        letterSpacing="2"
      >
        VIEW-MASTER 3D
      </text>
      <text
        x="0"
        y="34"
        textAnchor="middle"
        fill="#fde047"
        fontFamily='"Plus Jakarta Sans", sans-serif'
        fontWeight="800"
        fontSize="15"
        letterSpacing="2"
      >
        ANIMALS · 1999 EXOTIC CARS · WORLD SCENERY REELS
      </text>
    </g>
  </svg>
);

/**
 * Stereoscopic View-Master Rotary Reel Viewer Component
 * Renders the authentic circular 14-window reel rotation transition, Kodachrome slide canvas,
 * and interactive orange advance lever on the right side.
 */
const ViewMasterStereoscopicOverlay: React.FC<{
  viewMasterState: ViewMasterGameState;
  onAdvanceSlide: () => void;
  onSelectReel: (reelId: ViewMasterReelId) => void;
  onCloseEyepiece: () => void;
}> = ({ viewMasterState, onAdvanceSlide, onSelectReel, onCloseEyepiece }) => {
  const leftEyeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightEyeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shutterClack, setShutterClack] = useState(false);
  const [leverPressed, setLeverPressed] = useState(false);

  const currentSlide = getCurrentViewMasterSlide(viewMasterState);
  const currentReel = VIEW_MASTER_REELS[viewMasterState.activeReel];

  useEffect(() => {
    setShutterClack(true);
    setLeverPressed(true);
    const t1 = window.setTimeout(() => setShutterClack(false), 210);
    const t2 = window.setTimeout(() => setLeverPressed(false), 260);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [viewMasterState.wheelRotationCount, viewMasterState.activeReel]);

  useEffect(() => {
    if (leftEyeCanvasRef.current) {
      const ctxL = leftEyeCanvasRef.current.getContext('2d');
      if (ctxL) {
        renderViewMasterSlideToCanvas(
          ctxL,
          leftEyeCanvasRef.current.width,
          leftEyeCanvasRef.current.height,
          currentSlide,
          1.0
        );
      }
    }
    if (rightEyeCanvasRef.current) {
      const ctxR = rightEyeCanvasRef.current.getContext('2d');
      if (ctxR) {
        renderViewMasterSlideToCanvas(
          ctxR,
          rightEyeCanvasRef.current.width,
          rightEyeCanvasRef.current.height,
          currentSlide,
          1.0
        );
      }
    }
  }, [currentSlide]);

  const wheelAngleDeg = viewMasterState.wheelRotationCount * (360 / 14);

  return (
    <div className="fixed inset-0 z-30 pointer-events-auto bg-black/75 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-6">
      {/* Top Bar inside View-Master Eyepiece */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950/65 border border-white/15 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-xs tracking-wider">
            3D VIEW-MASTER EYEPIECE
          </span>
          <span className="text-xs md:text-sm font-bold text-amber-300">
            {currentReel.title} ({currentReel.serialCode})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {VIEW_MASTER_REEL_ORDER.map((rId) => {
            const rMeta = VIEW_MASTER_REELS[rId];
            const active = viewMasterState.activeReel === rId;
            return (
              <button
                key={rId}
                type="button"
                onClick={() => onSelectReel(rId)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-zinc-950 shadow'
                    : 'bg-white/10 text-zinc-200 hover:bg-white/20'
                }`}
              >
                Insert: {rMeta.shortTitle}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onCloseEyepiece}
            className="ml-2 px-3 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/15 cursor-pointer"
          >
            Lower 3D Viewer ✕
          </button>
        </div>
      </div>

      {/* Center Stereoscopic Dual-Aperture Binocular Frame + Rotating 14-Window Reel Wheel */}
      <div className="relative w-full max-w-4xl flex items-center justify-center my-auto">
        {/* Background Rotating Circular White 14-Window View-Master Reel Disc */}
        <div
          aria-hidden="true"
          style={{
            transform: `rotate(-${wheelAngleDeg}deg)`,
            transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="absolute -top-12 w-72 h-72 md:w-88 md:h-88 rounded-full border-4 border-slate-300 bg-stone-100/90 shadow-2xl flex items-center justify-center pointer-events-none opacity-85"
        >
          {Array.from({ length: 14 }).map((_, idx) => {
            const deg = idx * (360 / 14);
            return (
              <div
                key={idx}
                style={{
                  transform: `rotate(${deg}deg) translateY(-122px)`,
                }}
                className="absolute w-6 h-4 rounded-sm bg-zinc-900 border border-amber-400/50"
              />
            );
          })}
          <div className="w-16 h-16 rounded-full bg-slate-400 border-4 border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-950">
            REEL
          </div>
        </div>

        {/* Sculpted Red View-Master Interior Mask & Dual Stereoscopic Apertures */}
        <div className="relative z-10 w-full rounded-3xl bg-gradient-to-b from-red-900/80 via-zinc-950/95 to-zinc-950/95 border-4 border-red-600/80 p-4 md:p-6 shadow-2xl">
          {/* Top White Circular Reel Slot Callout */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              Slide {viewMasterState.slideIndex + 1} of 7 · {currentSlide.code}
            </div>
            <div className="text-xs font-bold text-zinc-300">
              Location: <span className="text-white">{currentSlide.locationOrEra}</span>
            </div>
          </div>

          {/* Stereoscopic Left & Right Eye Kodachrome Film Windows with Rotary Wheel Transition */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div
              className={`relative rounded-2xl overflow-hidden border-4 border-zinc-900 shadow-inner transition-all duration-200 ${
                shutterClack
                  ? 'translate-y-3 rotate-2 scale-95 brightness-50'
                  : 'translate-y-0 rotate-0 scale-100 brightness-100'
              }`}
            >
              <canvas
                ref={leftEyeCanvasRef}
                width={520}
                height={380}
                className="w-full h-auto block bg-black"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-amber-300">
                LEFT EYE · 3D PARALLAX
              </div>
            </div>

            <div
              className={`relative rounded-2xl overflow-hidden border-4 border-zinc-900 shadow-inner hidden md:block transition-all duration-200 ${
                shutterClack
                  ? '-translate-y-3 -rotate-2 scale-95 brightness-50'
                  : 'translate-y-0 rotate-0 scale-100 brightness-100'
              }`}
            >
              <canvas
                ref={rightEyeCanvasRef}
                width={520}
                height={380}
                className="w-full h-auto block bg-black"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-amber-300">
                RIGHT EYE · STEREOSCOPIC
              </div>
            </div>
          </div>

          {/* Caption & Interactive Orange Advance Lever */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-white">
                {currentSlide.title}
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5 max-w-xl">
                {currentSlide.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onAdvanceSlide}
              className={`px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-sm shadow-xl border-2 border-amber-200 transition-transform cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                leverPressed ? 'translate-y-2 rotate-3' : 'translate-y-0'
              }`}
            >
              <span>🟠 Pull Orange Lever (Next Slide)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-400 font-medium">
        Tip: Press <span className="text-amber-300 font-bold">[Space]</span> or click the Orange Lever to rotate the circular View-Master reel with authentic mechanical click-clack sound!
      </div>
    </div>
  );
};

export const GameHudAndMenus: React.FC<GameHudAndMenusProps> = ({
  activeGame,
  appState,
  subPhase,
  gameState,
  guessWhoState,
  mouseTrapState,
  viewMasterState,
  toyChestOpen,
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
  onTriggerPhysicsBump,
  onToggleToyChest,
  onAdvanceViewMasterSlide,
  onSelectViewMasterReel,
  onToggleViewMasterEyepiece,
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
  const isViewMaster = activeGame === 'view_master';

  const nextGameLabel =
    activeGame === 'sorry'
      ? 'GUESS WHO? 3D'
      : activeGame === 'guess_who'
      ? 'MOUSE TRAP! 3D'
      : activeGame === 'mouse_trap'
      ? 'VIEW-MASTER 3D'
      : 'SORRY! 3D';

  // ===========================================================================
  // 1. TITLE SCREEN OVERLAY (TRANSPARENT GLASS CARDS + 4 GAMES + TOY CHEST)
  // ===========================================================================
  if (appState === 'title') {
    return (
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 md:p-7">
        <div className="flex flex-col items-center w-full">
          {/* Ultra-clean Transparent Top Bar on Title Screen */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 px-4 py-2 rounded-2xl bg-zinc-950/45 backdrop-blur-md border border-white/15">
            <div className="text-xs font-semibold tracking-wider text-amber-300/95 uppercase">
              1999 Studio Room · Step2 Toy Chest · 4 Classic 3D Games
            </div>
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['sorry', '1. SORRY! 3D'],
                  ['guess_who', '2. GUESS WHO?'],
                  ['mouse_trap', '3. MOUSE TRAP!'],
                  ['view_master', '4. VIEW-MASTER 3D'],
                ] as [ActiveGameType, string][]
              ).map(([gId, label]) => (
                <button
                  key={gId}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onChangeGame(gId);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeGame === gId
                      ? 'bg-amber-400 text-zinc-950 shadow'
                      : 'bg-white/10 text-zinc-100 border border-white/15 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-medium text-zinc-200 hover:bg-white/20 transition-colors cursor-pointer"
              >
                {muted ? '🔇 Muted' : '🔊 90s Audio'}
              </button>
            </div>
          </div>

          {isViewMaster ? (
            <ViewMasterTitleEmblem className="w-60 md:w-72 h-auto" />
          ) : isMouseTrap ? (
            <MouseTrapTitleEmblem className="w-60 md:w-72 h-auto" />
          ) : isGuessWho ? (
            <GuessWhoTitleEmblem className="w-60 md:w-72 h-auto" />
          ) : (
            <SorryTitleEmblem className="w-60 md:w-72 h-auto" />
          )}

          <div className="mt-2 px-4 py-2 rounded-2xl bg-zinc-950/45 backdrop-blur-md border border-white/15 max-w-lg text-center">
            <p className="text-xs md:text-sm text-zinc-100 font-medium leading-relaxed">
              {isViewMaster ? (
                <>
                  Pick up the red <span className="text-amber-300 font-bold">3D View-Master</span>!
                  Insert circular 14-window reels for <span className="text-emerald-300 font-bold">Animals</span>,{' '}
                  <span className="text-rose-300 font-bold">1999 Exotic Cars</span>, and{' '}
                  <span className="text-sky-300 font-bold">World Scenery</span>, and pull the orange lever!
                </>
              ) : isMouseTrap ? (
                <>
                  Open <span className="text-yellow-300 font-bold">MOUSE TRAP!</span> with{' '}
                  <span className="text-emerald-300 font-bold">Cannon.js Physics</span>, 1990s Studio
                  HDR Area Lighting, Pop-Up Contraption stages, and Step2 Toy Chest storage!
                </>
              ) : isGuessWho ? (
                <>
                  Open the <span className="text-yellow-300 font-bold">GUESS WHO?</span> box on the
                  table! Flip the 24 picture stands and listen to the 1999 Nostalgia Narrator!
                </>
              ) : (
                <>
                  Open the <span className="text-amber-300 font-bold">SORRY!</span> cardboard game
                  box under the studio lights, or slide open the{' '}
                  <span className="text-sky-300 font-bold">Step2 Toy Chest</span> beside the table!
                </>
              )}
            </p>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 mt-3.5">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartBoxEntrance();
              }}
              className="px-8 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-sm md:text-base tracking-wide shadow-2xl transition-all cursor-pointer whitespace-nowrap"
            >
              PLAY (Open Cardboard Box)
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeGame();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white font-bold text-xs md:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              Change Game ({nextGameLabel})
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartFpvRoom();
              }}
              className="px-4 py-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/80 backdrop-blur-md border border-white/15 text-zinc-100 font-semibold text-xs md:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              First-Person Walk (FPV)
            </button>
          </div>
        </div>

        <div className="mx-auto px-4 py-1.5 rounded-xl bg-zinc-950/45 backdrop-blur-md border border-white/10 text-center text-xs text-zinc-200 font-medium">
          Click & Drag to Orbit Camera · Step2 Sliding Toy Chest · Cannon.js Physics · View-Master 3D Reels
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
  const isStandingRoam = cameraAngle === 'fpv';
  const isToyChestCam = cameraAngle === 'toy_chest';
  const activeMouseMeta = MOUSE_META[mouseTrapState.currentTurn];
  const isHumanRedMouseTurn = !autoPlayAll && mouseTrapState.currentTurn === 'red';
  const currentVmSlide = getCurrentViewMasterSlide(viewMasterState);
  const currentVmReel = VIEW_MASTER_REELS[viewMasterState.activeReel];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3.5 md:p-5">
      {/* Stereoscopic View-Master Eyepiece Modal when looking into the 3D Viewer */}
      {isViewMaster && subPhase === 'board_play' && viewMasterState.eyepieceMode && (
        <ViewMasterStereoscopicOverlay
          viewMasterState={viewMasterState}
          onAdvanceSlide={onAdvanceViewMasterSlide}
          onSelectReel={onSelectViewMasterReel}
          onCloseEyepiece={onToggleViewMasterEyepiece}
        />
      )}

      {/* =====================================================================
          ULTRA-CLEAN TOP BAR: SINGLE ORGANIZED HAMBURGER MENU + QUICK STAND/CHEST PILLS
         ===================================================================== */}
      <div className="flex items-start justify-between gap-2">
        <div className="relative pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
            {/* True Organized Hamburger Menu Button */}
            <button
              type="button"
              aria-label="Hamburger Menu"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.currentTarget.blur();
                setMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-950/55 hover:bg-zinc-900/75 backdrop-blur-md border border-white/15 text-zinc-100 shadow-xl transition-all cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-amber-400 shrink-0"
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
                <div className="text-xs font-extrabold text-white leading-none">
                  Menu & Games
                </div>
                <div className="text-[10px] text-amber-300/95 font-semibold mt-0.5">
                  {currentCameraOption.shortLabel} · Drag to Pan
                </div>
              </div>
            </button>

            {/* Quick Stand Up & Roam Toggle (Game Continues Live!) */}
            {subPhase === 'board_play' && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeCameraAngle(isStandingRoam ? 'tabletop' : 'fpv');
                }}
                className={`px-3 py-2 rounded-2xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer ${
                  isStandingRoam
                    ? 'bg-emerald-500/85 border-emerald-300 text-zinc-950 shadow-lg'
                    : 'bg-zinc-950/45 hover:bg-zinc-900/65 border-white/15 text-zinc-100'
                }`}
              >
                {isStandingRoam
                  ? '🪑 Sit Back at Table'
                  : '🚶 Stand Up & Pan Room (Game Continues)'}
              </button>
            )}

            {/* Quick Step2 Toy Chest Toggle (Slides Open Blue Door!) */}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleToyChest();
                if (!toyChestOpen && cameraAngle !== 'toy_chest' && cameraAngle !== 'fpv') {
                  onChangeCameraAngle('toy_chest');
                }
              }}
              className={`px-3 py-2 rounded-2xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer ${
                toyChestOpen || isToyChestCam
                  ? 'bg-sky-500/85 border-sky-200 text-slate-950 shadow-lg'
                  : 'bg-zinc-950/45 hover:bg-zinc-900/65 border-white/15 text-sky-200'
              }`}
            >
              {toyChestOpen ? '🟦 Toy Chest: OPEN (Click Box)' : '🧰 Step2 Toy Chest'}
            </button>
          </div>

          {/* =================================================================
              ORGANIZED TRANSPARENT GLASS HAMBURGER MENU DRAWER
             ================================================================= */}
          {menuOpen && (
            <div
              role="menu"
              aria-label="Organized Game, Toy Chest, Camera, and Physics Menu"
              className="mt-2 w-88 md:w-96 max-h-[82vh] overflow-y-auto rounded-2xl bg-zinc-950/75 backdrop-blur-xl border border-white/20 shadow-2xl p-4 text-zinc-100 space-y-3.5"
            >
              {/* 1. 4 Classic Games & Step2 Toy Chest */}
              <div className="pb-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                    1. Toy Chest & 4 Classic Games
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleToyChest();
                      onChangeCameraAngle('toy_chest');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/30 hover:bg-sky-500/50 border border-sky-300/40 text-[11px] font-bold text-sky-200 cursor-pointer"
                  >
                    {toyChestOpen ? 'Slide Lid Closed' : 'Slide Blue Lid Open'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['sorry', '1. SORRY! 3D', 'bg-amber-400 text-zinc-950'],
                      ['guess_who', '2. GUESS WHO? 3D', 'bg-sky-400 text-slate-950'],
                      ['mouse_trap', '3. MOUSE TRAP! 3D', 'bg-purple-500 text-white'],
                      ['view_master', '4. VIEW-MASTER 3D', 'bg-red-600 text-white'],
                    ] as [ActiveGameType, string, string][]
                  ).map(([gId, label, activeCls]) => (
                    <button
                      key={gId}
                      type="button"
                      role="menuitemradio"
                      aria-checked={activeGame === gId}
                      onClick={() => {
                        onChangeGame(gId);
                        setMenuOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-left ${
                        activeGame === gId
                          ? `${activeCls} border-white shadow`
                          : 'bg-white/5 text-zinc-200 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Camera Angles, Free Orbit & Stand-Up Roam */}
              <div className="pb-3 border-b border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                    2. Camera Views & Stand-Up Roam
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Drag screen to orbit · Scroll to zoom
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
                        className={`px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                          active
                            ? 'bg-amber-400/25 border-amber-300 text-amber-200 font-bold'
                            : 'bg-white/5 hover:bg-white/15 text-zinc-200 border-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{opt.shortLabel}</div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={followAction}
                    onClick={() => onToggleFollowAction()}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      followAction
                        ? 'bg-amber-400/25 border-amber-400/60 text-amber-200'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Cinematic AI Pan: {followAction ? 'ON' : 'OFF'}
                  </button>
                  {!isGuessWho && !isViewMaster && (
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={autoPlayAll}
                      onClick={() => onToggleAutoPlayAll()}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        autoPlayAll
                          ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                          : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      Auto-Play All: {autoPlayAll ? 'ON' : 'OFF'}
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Game-Specific Controls (Mouse Trap Physics / Modes / View-Master Reels / 1999 Narrator) */}
              {isMouseTrap && (
                <div className="pb-3 border-b border-white/10 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                    3. Mouse Trap! 3D & Cannon.js Physics
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleMouseTrapBoardMode('mode1_classic')}
                      className={`px-2.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                        mouseTrapState.boardMode === 'mode1_classic'
                          ? 'bg-yellow-400 text-slate-950 border-white'
                          : 'bg-white/5 text-zinc-200 border-white/10'
                      }`}
                    >
                      Mode 1: Classic Pop-Up
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleMouseTrapBoardMode('mode2_living_square')}
                      className={`px-2.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                        mouseTrapState.boardMode === 'mode2_living_square'
                          ? 'bg-lime-400 text-slate-950 border-white'
                          : 'bg-white/5 text-zinc-200 border-white/10'
                      }`}
                    >
                      Mode 2: 3D Popped Trail
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onBuildMouseTrapStage(true);
                        setMenuOpen(false);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-sky-500/30 hover:bg-sky-500/45 border border-sky-300/40 text-xs font-bold text-sky-200 cursor-pointer"
                    >
                      Pop Up All 5 Stages ({mouseTrapState.builtStages}/5)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onTriggerMouseTrapContraption();
                        setMenuOpen(false);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 border border-yellow-300/50 text-xs font-extrabold text-white cursor-pointer"
                    >
                      Drop Red Cage Trap!
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTriggerPhysicsBump()}
                    className="w-full px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-xs font-bold text-amber-200 cursor-pointer"
                  >
                    💥 Jostle Table (Test Cannon.js Pawn & Cheese Physics)
                  </button>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {INTERACTIVE_SCENES.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          onTriggerMouseTrapScene(sc.id);
                          setMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-left text-[11px] font-bold text-yellow-200 cursor-pointer"
                      >
                        {sc.shortName} ({sc.badge})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isGuessWho && latestNarrator && (
                <div className="pb-3 border-b border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-300">
                      3. 1999 Nostalgia Host ({latestNarrator.speaker})
                    </span>
                    <button
                      type="button"
                      onClick={onCycle1999Joke}
                      className="px-2 py-0.5 rounded bg-yellow-400 text-slate-950 font-extrabold text-[10px] cursor-pointer"
                    >
                      Next ’99 Joke ↻
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-snug">
                    {latestNarrator.playByPlay}
                  </p>
                  <p className="text-xs italic text-amber-200 leading-snug">
                    “{latestNarrator.joke99}”
                  </p>
                </div>
              )}

              {isViewMaster && (
                <div className="pb-3 border-b border-white/10 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300">
                    3. View-Master 3D Reels
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VIEW_MASTER_REEL_ORDER.map((rId) => (
                      <button
                        key={rId}
                        type="button"
                        onClick={() => {
                          onSelectViewMasterReel(rId);
                          setMenuOpen(false);
                        }}
                        className={`px-2 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                          viewMasterState.activeReel === rId
                            ? 'bg-amber-400 text-zinc-950 border-white'
                            : 'bg-white/5 text-zinc-200 border-white/10'
                        }`}
                      >
                        {VIEW_MASTER_REELS[rId].shortTitle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Audio, Box Unfold & Match Controls */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleMusic()}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  ♫ ’99 Music: {musicEnabled && !muted ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMute()}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  {muted ? '🔇 Unmute Sound' : '🔊 Sound: ON'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReplayUnfold();
                    setMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-amber-300 cursor-pointer"
                >
                  📦 Replay Box Unfold
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRestartGame();
                    setMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  ↻ Restart Match
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Compact Transparent Pill: Clear Screen Toggle + Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {subPhase === 'board_play' && (
            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="px-3 py-2 rounded-2xl bg-zinc-950/45 hover:bg-zinc-900/65 backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
            >
              {dockCollapsed ? '▴ Show HUD' : '▾ Clear Screen'}
            </button>
          )}
          <button
            type="button"
            aria-label="Pause Game [P]"
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            className="w-9 h-9 rounded-2xl bg-zinc-950/45 hover:bg-zinc-900/65 backdrop-blur-md border border-white/15 flex items-center justify-center text-zinc-200 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* =====================================================================
          UNFOLDING CARDBOARD BOX PROGRESS BANNER (TRANSPARENT GLASS)
         ===================================================================== */}
      {subPhase === 'unfolding' && (
        <div className="mx-auto mb-6 pointer-events-auto flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-zinc-950/55 backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="text-xs md:text-sm font-bold text-amber-200">
            {isViewMaster
              ? 'Opening VIEW-MASTER 3D Box & Setting Up Stereoscopic Reels...'
              : isMouseTrap
              ? 'Opening MOUSE TRAP! Box & Unfolding Living Contraption...'
              : isGuessWho
              ? 'Opening GUESS WHO? Box & Unfolding 48 Picture Stands...'
              : 'Opening SORRY! Box & Laying Out 16 Pawns...'}
          </div>
          <button
            type="button"
            onClick={onSkipUnfold}
            className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold text-white cursor-pointer"
          >
            Skip
          </button>
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR FPV ROOM WALK (TRANSPARENT GLASS)
         ===================================================================== */}
      {subPhase === 'fpv_room' && (
        <div className="mx-auto w-full max-w-xl pointer-events-auto rounded-2xl bg-zinc-950/50 backdrop-blur-md border border-white/15 p-3.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <div className="text-xs md:text-sm font-bold text-zinc-100">
              {nearTable
                ? 'You are at the table! Open the cardboard box or inspect the Step2 Toy Chest.'
                : 'Walk with WASD / Arrows · Drag Mouse to Pan Room'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!nearTable && (
              <button
                type="button"
                onClick={onWalkToTable}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-zinc-100 font-semibold text-xs cursor-pointer"
              >
                Walk to Table
              </button>
            )}
            <button
              type="button"
              onClick={onOpenBox}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs md:text-sm shadow-lg cursor-pointer"
            >
              Open Box [E]
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR 4TH GAME: 3D VIEW-MASTER STEREOSCOPIC VIEWER & REELS
         ===================================================================== */}
      {subPhase === 'board_play' && isViewMaster && !dockCollapsed && (
        <div className="mx-auto w-full max-w-4xl pointer-events-auto rounded-2xl bg-zinc-950/50 backdrop-blur-md border border-white/15 p-3 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="px-2.5 py-1 rounded-lg bg-red-600/90 border border-amber-300/60 text-white font-black text-[11px] shrink-0">
                REEL {currentVmSlide.code}
              </div>
              <div className="text-xs md:text-sm font-extrabold text-white truncate">
                {currentVmReel.title} · Slide {viewMasterState.slideIndex + 1}/7:{' '}
                <span className="text-amber-300">{currentVmSlide.title}</span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-300 truncate">
              {viewMasterState.lastActionLog}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-1.5">
              {VIEW_MASTER_REEL_ORDER.map((rId) => {
                const rMeta = VIEW_MASTER_REELS[rId];
                const active = viewMasterState.activeReel === rId;
                return (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => onSelectViewMasterReel(rId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-zinc-950 shadow'
                        : 'bg-white/10 text-zinc-200 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    💿 {rMeta.shortTitle}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAdvanceViewMasterSlide}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs shadow-lg border border-amber-200 cursor-pointer"
              >
                🟠 Pull Lever [Space]
              </button>

              <button
                type="button"
                onClick={onToggleViewMasterEyepiece}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg border border-white/20 cursor-pointer"
              >
                👀 Look Into 3D Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR 3D MOUSE TRAP! (TRANSPARENT GLASS CARD)
         ===================================================================== */}
      {subPhase === 'board_play' && isMouseTrap && !dockCollapsed && (
        <div className="mx-auto w-full max-w-4xl pointer-events-auto rounded-2xl bg-zinc-950/50 backdrop-blur-md border border-white/15 p-3 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {MOUSE_COLORS.map((color) => {
                const m = mouseTrapState.mice[color];
                const meta = MOUSE_META[color];
                const isTurn = mouseTrapState.currentTurn === color;
                return (
                  <div
                    key={color}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${
                      m.isTrapped
                        ? 'bg-red-950/75 border-red-400 text-red-200'
                        : isTurn
                        ? 'bg-white/15 border-amber-400 text-white font-bold'
                        : 'bg-black/35 border-white/10 text-zinc-300'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <span className="font-bold">
                      {meta.name}
                      {color === 'red' ? ' (You)' : ''}
                    </span>
                    <span className="font-mono text-[11px] text-amber-300 font-bold">
                      🧀{m.cheeseCount}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] font-medium text-amber-200/95 truncate max-w-xs md:max-w-md">
              {mouseTrapState.lastActionLog}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 font-black flex items-center justify-center text-sm shadow">
                {mouseTrapState.lastDiceRoll ?? '🎲'}
              </div>
              <div className="text-xs text-zinc-200 font-semibold">
                {isMousePov
                  ? 'Mouse-Eye POV: Use WASD to scamper & snatch Floating Cheese!'
                  : `${activeMouseMeta.name}’s Turn · Trap Built: ${mouseTrapState.builtStages}/5`}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {!isMouseTrapAnimating && isHumanRedMouseTurn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRollMouseTrapDice();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs shadow-lg cursor-pointer"
                >
                  Roll Die [Space]
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMouseTrapBoardMode();
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-lime-300 cursor-pointer"
              >
                {mouseTrapState.boardMode === 'mode2_living_square'
                  ? 'Mode 2: 3D Trail'
                  : 'Mode 1: Classic'}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerMouseTrapContraption();
                }}
                className="px-3 py-2 rounded-xl bg-red-600/85 hover:bg-red-500 text-white font-extrabold text-xs border border-white/20 cursor-pointer"
              >
                Drop Trap!
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onChangeCameraAngle(isMousePov ? 'tabletop' : 'mouse_pov');
                }}
                className="px-3 py-2 rounded-xl bg-emerald-400/90 hover:bg-emerald-300 text-zinc-950 font-extrabold text-xs cursor-pointer"
              >
                {isMousePov ? 'Tabletop View' : 'Mouse POV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR 3D GUESS WHO? (TRANSPARENT GLASS CARD + INLINE NARRATOR)
         ===================================================================== */}
      {subPhase === 'board_play' && isGuessWho && !dockCollapsed && (
        <div className="mx-auto w-full max-w-4xl pointer-events-auto rounded-2xl bg-zinc-950/50 backdrop-blur-md border border-white/15 p-3 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-zinc-950 font-extrabold text-xs">
                Mystery Card: {guessWhoState.playerSecret.name}
              </span>
              <span className="text-xs font-bold text-zinc-200 font-mono">
                Standing: {standingPlayerCharacters.length}/24 · CPU: {standingAiCount}/24
              </span>
              {latestNarrator && (
                <button
                  type="button"
                  onClick={onCycle1999Joke}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-amber-200 italic truncate max-w-xs cursor-pointer"
                  title={latestNarrator.joke99}
                >
                  🎙️ “{latestNarrator.joke99}” ↻
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setGuessTab('questions')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                  guessTab === 'questions' ? 'bg-red-600 text-white' : 'text-zinc-300'
                }`}
              >
                Ask Trait
              </button>
              <button
                type="button"
                onClick={() => setGuessTab('accuse')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                  guessTab === 'accuse' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-300'
                }`}
              >
                Accuse ({standingPlayerCharacters.length})
              </button>
            </div>
          </div>

          {guessWhoState.turn === 'ai' ? (
            <div className="py-1 text-center text-xs font-bold text-amber-300">
              CPU is asking a question & flipping stands...
            </div>
          ) : guessTab === 'questions' ? (
            <div className="flex flex-wrap items-center gap-1.5 max-h-20 overflow-y-auto">
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
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      alreadyAsked
                        ? 'bg-black/30 text-zinc-500 line-through cursor-not-allowed'
                        : 'bg-red-600/85 hover:bg-red-500 text-white border border-white/15'
                    }`}
                  >
                    {q.shortLabel}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 max-h-20 overflow-y-auto">
              {standingPlayerCharacters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onMakeDirectGuess(char.id);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs cursor-pointer"
                >
                  Guess {char.name}?
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          BOTTOM DOCK FOR CLASSIC SORRY! (TRANSPARENT GLASS CARD)
         ===================================================================== */}
      {subPhase === 'board_play' && activeGame === 'sorry' && !dockCollapsed && (
        <div className="mx-auto w-full max-w-4xl pointer-events-auto rounded-2xl bg-zinc-950/50 backdrop-blur-md border border-white/15 p-3 shadow-2xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-1.5">
              {pawnSummary.map(({ color, meta, homeCount, trackCount }) => {
                const isTurn = gameState.currentTurn === color;
                return (
                  <div
                    key={color}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${
                      isTurn
                        ? 'bg-white/15 border-amber-400/80 text-white font-bold'
                        : 'bg-black/35 border-white/10 text-zinc-300'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <span>
                      {meta.name}
                      {color === 'red' && !autoPlayAll ? ' (You)' : ''}
                    </span>
                    <span className="font-mono text-[11px] text-amber-300">
                      Home {homeCount}/4 · Track {trackCount}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-zinc-200 font-medium truncate max-w-xs md:max-w-sm">
              {gameState.lastActionLog}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-11 rounded-xl flex flex-col items-center justify-center font-extrabold border-2 shrink-0"
                style={{
                  backgroundColor: gameState.currentCard ? '#f8fafc' : '#18181b',
                  borderColor: activePlayerMeta.hex,
                  color: gameState.currentCard ? '#0f172a' : '#a1a1aa',
                }}
              >
                <span className="text-[8px] uppercase font-bold text-zinc-500">Card</span>
                <span className="text-sm font-mono leading-none">
                  {gameState.currentCard ?? '—'}
                </span>
              </div>
              <div className="text-xs text-zinc-200">
                <span
                  className="font-extrabold"
                  style={{ color: activePlayerMeta.accentHex }}
                >
                  {activePlayerMeta.name}’s Turn
                </span>{' '}
                ·{' '}
                {gameState.currentCard
                  ? CARD_INFO[gameState.currentCard].ruleSummary
                  : 'Click Draw Card [Space] or click the 3D deck on the table.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {isAnimatingMove ? (
                <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-amber-300">
                  Pieces Moving...
                </span>
              ) : isHumanRedTurn ? (
                gameState.turnPhase === 'draw' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onDrawCard();
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs md:text-sm shadow-lg cursor-pointer"
                  >
                    Draw Card [Space]
                  </button>
                ) : gameState.legalMoves.length > 0 ? (
                  gameState.legalMoves.slice(0, 4).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectMove(m);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shadow cursor-pointer"
                    >
                      {m.label}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onPassTurn();
                    }}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs cursor-pointer"
                  >
                    Pass Turn [Space]
                  </button>
                )
              ) : (
                <span className="text-xs font-semibold text-amber-300">
                  {activePlayerMeta.name} playing...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PAUSE & GAME OVER STATUS MODALS (TRANSPARENT GLASS)
         ===================================================================== */}
      {(appState === 'paused' || appState === 'gameover') && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={appState === 'paused' ? 'Game Paused' : 'Game Over'}
          className="fixed inset-0 z-30 pointer-events-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-zinc-950/85 border border-white/20 p-6 shadow-2xl text-center space-y-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {appState === 'paused' ? '1999 Tabletop Paused' : 'Match Complete'}
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-100 mt-1">
                {appState === 'paused'
                  ? isViewMaster
                    ? 'VIEW-MASTER 3D'
                    : isMouseTrap
                    ? 'MOUSE TRAP! 3D'
                    : isGuessWho
                    ? 'GUESS WHO? 3D'
                    : 'SORRY! 3D'
                  : 'Victory!'}
              </h2>
            </div>

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
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 font-semibold text-xs cursor-pointer"
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
