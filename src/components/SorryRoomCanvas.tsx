import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  CardRank,
  LegalMove,
  PlayerColor,
  PLAYER_COLORS,
  PLAYER_META,
  SorryGameState,
  StepWaypoint,
  getNormalizedBoardCoords,
  wrapTrackIndex,
} from '../game/sorryRules';
import {
  GUESS_WHO_CHARACTERS,
  GuessWhoGameState,
} from '../game/guessWhoRules';
import {
  InteractiveSceneId,
  MOUSE_META,
  MOUSE_TRAP_SPACES,
  MouseColor,
  MouseTrapGameState,
} from '../game/mouseTrapRules';
import { buildMouseTrap3DScene } from '../game/mouseTrap3DBuilder';
import {
  ViewMasterGameState,
  ViewMasterReelId,
} from '../game/viewMasterRules';
import {
  buildStep2ToyChest3D,
  buildViewMaster3DScene,
  create1990sStudioHDREnvironment,
  createViewMasterBoxLidTexture,
} from '../game/step2ToyChestAndViewMaster3D';
import {
  createCardBackTexture,
  createCardFrontTexture,
  createGuessWhoBoxLidTexture,
  createGuessWhoCharacterTexture,
  createGuessWhoStandBackTexture,
  createMouseTrapBoardTexture,
  createMouseTrapBoxLidTexture,
  createSorryBoardTexture,
  createSorryBoxLidTexture,
  createWalnutWoodTextures,
} from '../game/boardTextures';
import { soundFX } from '../game/soundEffects';

export type ActiveGameType = 'sorry' | 'guess_who' | 'mouse_trap' | 'view_master';

export type CameraAngleId =
  | 'fpv'
  | 'tabletop'
  | 'top'
  | 'side_south'
  | 'side_north'
  | 'side_east'
  | 'side_west'
  | 'mouse_pov'
  | 'toy_chest';

export type RoomSubPhase = 'fpv_room' | 'unfolding' | 'board_play';

export interface ActiveMoveAnimation {
  move: LegalMove;
  actingColor: PlayerColor;
  card: CardRank;
  startTime: number;
}

export interface ActiveMouseStepAnimation {
  color: MouseColor;
  stepIndices: number[];
  startIndex: number;
  startTimeMs: number;
}

interface SorryRoomCanvasProps {
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
  nearTable: boolean;
  onNearTableChange: (near: boolean) => void;
  onRequestOpenBox: () => void;
  onUnfoldComplete: () => void;
  onSelectMove: (move: LegalMove) => void;
  onDrawCard: () => void;
  onAnimationFinished: (move: LegalMove) => void;
  onToggleGuessWhoStand: (characterId: string) => void;
  onRollMouseTrapDice: () => void;
  onCollectFloatingCheese: () => void;
  onTriggerMouseTrapScene: (sceneId: InteractiveSceneId) => void;
  onToggleToyChest: () => void;
  onSelectGameFromToyChest: (game: ActiveGameType) => void;
  onAdvanceViewMasterSlide: () => void;
  onSelectViewMasterReel: (reelId: ViewMasterReelId) => void;
  onToggleViewMasterEyepiece: () => void;
  activeAnimation: ActiveMoveAnimation | null;
  activeMouseStepAnim: ActiveMouseStepAnimation | null;
  chainReactionStartMs: number | null;
  scenePulseStartMs: number | null;
  viewMasterLeverAnimMs: number | null;
  viewMasterInsertAnimMs: number | null;
  physicsBumpTrigger: number;
  unfoldTriggerCount: number;
  walkToTableTrigger: number;
}

// Pre-allocated math scratch objects outside the render loop (Zero-GC rule)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3TargetPos = new THREE.Vector3();
const _vec3TargetLook = new THREE.Vector3();
const _colorScratch = new THREE.Color();

const BOARD_WORLD_SIZE = 1.16;
const TABLE_SURFACE_Y = 0.78;
const BOARD_SURFACE_Y = TABLE_SURFACE_Y + 0.016;

function boardUVToWorld(u: number, v: number, yOffset: number = 0): THREE.Vector3 {
  return new THREE.Vector3(
    u * BOARD_WORLD_SIZE,
    BOARD_SURFACE_Y + yOffset,
    v * BOARD_WORLD_SIZE
  );
}

/**
 * Builds a composite 5-part 3D Classic Sorry! Pawn (`THREE.Group`)
 */
function createPawnGroup(colorHex: string, isSoftwareGl: boolean): THREE.Group {
  const group = new THREE.Group();

  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.021, 0.0),
    new THREE.Vector2(0.022, 0.005),
    new THREE.Vector2(0.017, 0.011),
    new THREE.Vector2(0.012, 0.024),
    new THREE.Vector2(0.009, 0.044),
    new THREE.Vector2(0.013, 0.049),
    new THREE.Vector2(0.008, 0.053),
    new THREE.Vector2(0.0, 0.054),
  ];
  const latheGeo = new THREE.LatheGeometry(points, 20);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.45,
    transparent: true,
    opacity: isSoftwareGl ? 0.94 : 1.0,
    ior: 1.5,
  });

  const bodyMesh = new THREE.Mesh(latheGeo, bodyMat);
  bodyMesh.castShadow = !isSoftwareGl;
  bodyMesh.receiveShadow = !isSoftwareGl;
  group.add(bodyMesh);

  const headGeo = new THREE.SphereGeometry(0.0135, 18, 16);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  headMesh.position.y = 0.063;
  headMesh.castShadow = !isSoftwareGl;
  group.add(headMesh);

  const ringGeo = new THREE.TorusGeometry(0.0195, 0.0022, 10, 20);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.65,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.004;
  group.add(ringMesh);

  const neckRingGeo = new THREE.TorusGeometry(0.0115, 0.0018, 8, 18);
  neckRingGeo.rotateX(Math.PI / 2);
  const neckRing = new THREE.Mesh(neckRingGeo, ringMat);
  neckRing.position.y = 0.05;
  group.add(neckRing);

  const shadowGeo = new THREE.CircleGeometry(0.025, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.001;
  group.add(shadowDisc);

  return group;
}

export const SorryRoomCanvas: React.FC<SorryRoomCanvasProps> = ({
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
  nearTable,
  onNearTableChange,
  onRequestOpenBox,
  onUnfoldComplete,
  onSelectMove,
  onDrawCard,
  onAnimationFinished,
  onToggleGuessWhoStand,
  onRollMouseTrapDice,
  onCollectFloatingCheese,
  onTriggerMouseTrapScene,
  onToggleToyChest,
  onSelectGameFromToyChest,
  onAdvanceViewMasterSlide,
  onSelectViewMasterReel,
  onToggleViewMasterEyepiece,
  activeAnimation,
  activeMouseStepAnim,
  chainReactionStartMs,
  scenePulseStartMs,
  viewMasterLeverAnimMs,
  viewMasterInsertAnimMs,
  physicsBumpTrigger,
  unfoldTriggerCount,
  walkToTableTrigger,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const latestRef = useRef({
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
    nearTable,
    onNearTableChange,
    onRequestOpenBox,
    onUnfoldComplete,
    onSelectMove,
    onDrawCard,
    onAnimationFinished,
    onToggleGuessWhoStand,
    onRollMouseTrapDice,
    onCollectFloatingCheese,
    onTriggerMouseTrapScene,
    onToggleToyChest,
    onSelectGameFromToyChest,
    onAdvanceViewMasterSlide,
    onSelectViewMasterReel,
    onToggleViewMasterEyepiece,
    activeAnimation,
    activeMouseStepAnim,
    chainReactionStartMs,
    scenePulseStartMs,
    viewMasterLeverAnimMs,
    viewMasterInsertAnimMs,
    physicsBumpTrigger,
  });

  useEffect(() => {
    latestRef.current = {
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
      nearTable,
      onNearTableChange,
      onRequestOpenBox,
      onUnfoldComplete,
      onSelectMove,
      onDrawCard,
      onAnimationFinished,
      onToggleGuessWhoStand,
      onRollMouseTrapDice,
      onCollectFloatingCheese,
      onTriggerMouseTrapScene,
      onToggleToyChest,
      onSelectGameFromToyChest,
      onAdvanceViewMasterSlide,
      onSelectViewMasterReel,
      onToggleViewMasterEyepiece,
      activeAnimation,
      activeMouseStepAnim,
      chainReactionStartMs,
      scenePulseStartMs,
      viewMasterLeverAnimMs,
      viewMasterInsertAnimMs,
      physicsBumpTrigger,
    };
  });

  const unfoldStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (subPhase === 'unfolding') {
      unfoldStartRef.current = performance.now();
      soundFX.playBoxUnfold();
    }
  }, [subPhase, unfoldTriggerCount, activeGame]);

  const autoWalkToTableRef = useRef<boolean>(false);
  useEffect(() => {
    if (walkToTableTrigger > 0) {
      autoWalkToTableRef.current = true;
    }
  }, [walkToTableTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020204);
    scene.fog = new THREE.FogExp2(0x020204, 0.11);

    // 1990s Product Studio HDR Equirectangular Environment + Physically-Based Area Lights
    RectAreaLightUniformsLib.init();
    scene.environment = create1990sStudioHDREnvironment(renderer);
    scene.environmentIntensity = 0.58;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.08, 35);
    camera.position.set(0, 1.85, 2.25);
    camera.lookAt(0, TABLE_SURFACE_Y, 0);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // =========================================================================
    // 1. DARK 3D ROOM & SINGLE OVERHEAD HANGING PENDANT LAMP
    // =========================================================================
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const floorGeo = new THREE.PlaneGeometry(16, 16);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090807,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = !isSoftwareGl;
    roomGroup.add(floorMesh);

    const rugGeo = new THREE.CircleGeometry(1.75, 48);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x161210,
      roughness: 0.95,
      metalness: 0.0,
    });
    const rugMesh = new THREE.Mesh(rugGeo, rugMat);
    rugMesh.position.y = 0.015;
    rugMesh.receiveShadow = !isSoftwareGl;
    roomGroup.add(rugMesh);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x040406,
      roughness: 0.92,
      metalness: 0.02,
    });
    const wallPositions: [number, number, number, number][] = [
      [0, 2.5, -5.5, 0],
      [0, 2.5, 5.5, Math.PI],
      [-5.5, 2.5, 0, Math.PI / 2],
      [5.5, 2.5, 0, -Math.PI / 2],
    ];
    for (const [wx, wy, wz, ry] of wallPositions) {
      const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 5), wallMat);
      wMesh.position.set(wx, wy, wz);
      wMesh.rotation.y = ry;
      roomGroup.add(wMesh);
    }

    // Hanging Pendant Lamp directly over the center of the table
    const pendantGroup = new THREE.Group();
    pendantGroup.position.set(0, 3.6, 0);
    scene.add(pendantGroup);

    const canopyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.05, 20),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6, metalness: 0.7 })
    );
    canopyMesh.position.y = -0.025;
    pendantGroup.add(canopyMesh);

    const cordLen = 1.52;
    const cordMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, cordLen, 10),
      new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.85 })
    );
    cordMesh.position.y = -cordLen / 2;
    pendantGroup.add(cordMesh);

    const socketMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.042, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.28, metalness: 0.88 })
    );
    socketMesh.position.y = -cordLen - 0.02;
    pendantGroup.add(socketMesh);

    const shadePoints = [
      new THREE.Vector2(0.04, 0.14),
      new THREE.Vector2(0.12, 0.11),
      new THREE.Vector2(0.26, 0.02),
      new THREE.Vector2(0.29, -0.04),
      new THREE.Vector2(0.28, -0.045),
      new THREE.Vector2(0.11, 0.095),
      new THREE.Vector2(0.038, 0.135),
    ];
    const shadeGeo = new THREE.LatheGeometry(shadePoints, 32);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x141417,
      roughness: 0.55,
      metalness: 0.45,
      side: THREE.DoubleSide,
    });
    const shadeMesh = new THREE.Mesh(shadeGeo, shadeMat);
    shadeMesh.position.y = -cordLen - 0.16;
    pendantGroup.add(shadeMesh);

    const innerReflectorGeo = new THREE.ConeGeometry(0.265, 0.15, 28, 1, true);
    const innerReflectorMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.BackSide,
    });
    const innerReflector = new THREE.Mesh(innerReflectorGeo, innerReflectorMat);
    innerReflector.position.y = -cordLen - 0.12;
    pendantGroup.add(innerReflector);

    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );
    bulbMesh.position.y = -cordLen - 0.12;
    pendantGroup.add(bulbMesh);

    const coneShaftGeo = new THREE.ConeGeometry(1.48, 2.1, 32, 1, true);
    const coneShaftMat = new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.042,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const coneShaftMesh = new THREE.Mesh(coneShaftGeo, coneShaftMat);
    coneShaftMesh.position.y = -cordLen - 1.15;
    pendantGroup.add(coneShaftMesh);

    const spotLight = new THREE.SpotLight(0xfff1d6, 7.2, 9.0, Math.PI * 0.36, 0.68, 1.5);
    spotLight.position.set(0, -cordLen - 0.14, 0);
    spotLight.target.position.set(0, TABLE_SURFACE_Y, 0);
    pendantGroup.add(spotLight);
    scene.add(spotLight.target);

    if (!isSoftwareGl) {
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      spotLight.shadow.camera.near = 0.4;
      spotLight.shadow.camera.far = 4.5;
      spotLight.shadow.bias = -0.0005;
      spotLight.shadow.normalBias = 0.02;
    }

    const bulbPointLight = new THREE.PointLight(0xffedd5, 1.8, 4.5, 1.6);
    bulbPointLight.position.set(0, -cordLen - 0.18, 0);
    pendantGroup.add(bulbPointLight);

    const hemiFill = new THREE.HemisphereLight(0x334155, 0x1c140d, 0.28);
    scene.add(hemiFill);

    // Physically-Based 1990s Commercial Product Studio RectAreaLight Softboxes
    const studioKeySoftbox = new THREE.RectAreaLight(0xfff1d6, 3.2, 1.35, 1.35);
    studioKeySoftbox.position.set(0.35, TABLE_SURFACE_Y + 1.45, 0.65);
    studioKeySoftbox.lookAt(0, TABLE_SURFACE_Y, 0);
    scene.add(studioKeySoftbox);

    const studioCoolRimSoftbox = new THREE.RectAreaLight(0x93c5fd, 2.1, 1.4, 0.85);
    studioCoolRimSoftbox.position.set(-1.35, TABLE_SURFACE_Y + 1.1, -1.15);
    studioCoolRimSoftbox.lookAt(0, TABLE_SURFACE_Y, 0);
    scene.add(studioCoolRimSoftbox);

    const studioWarmFillSoftbox = new THREE.RectAreaLight(0xfde68a, 1.85, 1.1, 0.9);
    studioWarmFillSoftbox.position.set(1.45, TABLE_SURFACE_Y + 1.05, 0.85);
    studioWarmFillSoftbox.lookAt(0.5, TABLE_SURFACE_Y - 0.1, 0.1);
    scene.add(studioWarmFillSoftbox);

    // Dedicated warm accent light illuminating the Step2 Toy Chest next to the table
    const toyChestSpot = new THREE.PointLight(0xfff7ed, 2.4, 4.2, 1.4);
    toyChestSpot.position.set(1.48, 1.55, 0.55);
    scene.add(toyChestSpot);

    // =========================================================================
    // 2. COMPOSITE 3D WOODEN TABLE & CHAIRS
    // =========================================================================
    const tableGroup = new THREE.Group();
    scene.add(tableGroup);

    const woodTextures = createWalnutWoodTextures(maxAniso);
    const tableWoodMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: woodTextures.map,
      bumpMap: woodTextures.bumpMap,
      bumpScale: 0.006,
      roughness: 0.42,
      metalness: 0.08,
    });
    const tableTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1c100b,
      roughness: 0.68,
      metalness: 0.15,
    });
    const brassFootMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85,
    });

    const topSlabMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.055, 1.68),
      tableWoodMat
    );
    topSlabMesh.position.y = TABLE_SURFACE_Y - 0.0275;
    topSlabMesh.receiveShadow = !isSoftwareGl;
    topSlabMesh.castShadow = !isSoftwareGl;
    tableGroup.add(topSlabMesh);

    const rimThickness = 0.045;
    const rimHeight = 0.018;
    const rimConfigs: [number, number, number, number][] = [
      [0, TABLE_SURFACE_Y + 0.004, -0.84 + rimThickness / 2, 1.68],
      [0, TABLE_SURFACE_Y + 0.004, 0.84 - rimThickness / 2, 1.68],
    ];
    for (const [rx, ry, rz, rw] of rimConfigs) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(rw, rimHeight, rimThickness),
        tableTrimMat
      );
      bar.position.set(rx, ry, rz);
      tableGroup.add(bar);
    }
    for (const sideX of [-0.84 + rimThickness / 2, 0.84 - rimThickness / 2]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(rimThickness, rimHeight, 1.68 - rimThickness * 2),
        tableTrimMat
      );
      bar.position.set(sideX, TABLE_SURFACE_Y + 0.004, 0);
      tableGroup.add(bar);
    }

    const apronMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.46, 0.09, 1.46),
      tableTrimMat
    );
    apronMesh.position.y = TABLE_SURFACE_Y - 0.09;
    tableGroup.add(apronMesh);

    const legOffsets: [number, number][] = [
      [-0.7, -0.7],
      [0.7, -0.7],
      [0.7, 0.7],
      [-0.7, 0.7],
    ];
    for (const [lx, lz] of legOffsets) {
      const legMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.026, TABLE_SURFACE_Y - 0.04, 14),
        tableTrimMat
      );
      legMesh.position.set(lx, (TABLE_SURFACE_Y - 0.04) / 2, lz);
      legMesh.castShadow = !isSoftwareGl;
      tableGroup.add(legMesh);

      const ferrule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.025, 0.06, 14),
        brassFootMat
      );
      ferrule.position.set(lx, 0.03, lz);
      tableGroup.add(ferrule);
    }

    const createChair = () => {
      const chair = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.46), tableWoodMat);
      seat.position.y = 0.46;
      chair.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.035), tableWoodMat);
      backrest.position.set(0, 0.7, 0.21);
      chair.add(backrest);

      const cLegs: [number, number][] = [
        [-0.19, -0.19],
        [0.19, -0.19],
        [-0.19, 0.19],
        [0.19, 0.19],
      ];
      for (const [cx, cz] of cLegs) {
        const cLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.015, 0.46, 10),
          tableTrimMat
        );
        cLeg.position.set(cx, 0.23, cz);
        chair.add(cLeg);
      }
      return chair;
    };

    const chairPlacements: [number, number, number][] = [
      [0, 1.28, 0],
      [0, -1.18, Math.PI],
      [1.18, 0, Math.PI / 2],
      [-1.18, 0, -Math.PI / 2],
    ];
    for (const [cx, cz, ry] of chairPlacements) {
      const ch = createChair();
      ch.position.set(cx, 0, cz);
      ch.rotation.y = ry;
      tableGroup.add(ch);
    }

    // =========================================================================
    // 3. REAL 3D CARDBOARD GAME BOX (HOLLOW INNER TRAY + TELESCOPING LID)
    // =========================================================================
    const boardTexture = createSorryBoardTexture(maxAniso);
    const sorryBoxLidTexture = createSorryBoxLidTexture(maxAniso);
    const guessWhoBoxLidTexture = createGuessWhoBoxLidTexture(maxAniso);
    const mouseTrapBoardTexture = createMouseTrapBoardTexture(maxAniso);
    const mouseTrapBoxLidTexture = createMouseTrapBoxLidTexture(maxAniso);
    const viewMasterBoxLidTexture = createViewMasterBoxLidTexture(maxAniso);
    const cardBackTexture = createCardBackTexture(maxAniso);

    const cardFrontTextures: Record<CardRank, THREE.CanvasTexture> = {
      '1': createCardFrontTexture('1', maxAniso),
      '2': createCardFrontTexture('2', maxAniso),
      '3': createCardFrontTexture('3', maxAniso),
      '4': createCardFrontTexture('4', maxAniso),
      '5': createCardFrontTexture('5', maxAniso),
      '7': createCardFrontTexture('7', maxAniso),
      '8': createCardFrontTexture('8', maxAniso),
      '10': createCardFrontTexture('10', maxAniso),
      '11': createCardFrontTexture('11', maxAniso),
      '12': createCardFrontTexture('12', maxAniso),
      'SORRY!': createCardFrontTexture('SORRY!', maxAniso),
    };

    const boxGroup = new THREE.Group();
    boxGroup.position.set(0, TABLE_SURFACE_Y, 0);
    scene.add(boxGroup);

    // Inner hollow kraft-cardboard bottom tray (5 walls so it's a real open cardboard box!)
    const boxBaseGroup = new THREE.Group();
    boxGroup.add(boxBaseGroup);

    const kraftCardboardMat = new THREE.MeshStandardMaterial({
      color: 0xc29b61,
      roughness: 0.85,
      metalness: 0.02,
    });
    const outerTrayWallMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.55,
    });

    const trayBottom = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.008, 0.62),
      kraftCardboardMat
    );
    trayBottom.position.y = 0.004;
    boxBaseGroup.add(trayBottom);

    const wallH = 0.088;
    const trayWalls: [number, number, number, number][] = [
      [0, wallH / 2, -0.305, 0.62],
      [0, wallH / 2, 0.305, 0.62],
    ];
    for (const [wx, wy, wz, ww] of trayWalls) {
      const wMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ww, wallH, 0.012),
        kraftCardboardMat
      );
      wMesh.position.set(wx, wy, wz);
      boxBaseGroup.add(wMesh);
    }
    for (const sideX of [-0.305, 0.305]) {
      const wMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, wallH, 0.6),
        outerTrayWallMat
      );
      wMesh.position.set(sideX, wallH / 2, 0);
      boxBaseGroup.add(wMesh);
    }

    // Cardboard Box Lid with dynamic top artwork (SORRY! or GUESS WHO?)
    const boxLidTopMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: sorryBoxLidTexture,
      roughness: 0.3,
    });
    const boxLidMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4 }),
      boxLidTopMat,
      kraftCardboardMat,
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 }),
    ];
    const boxLidMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.095, 0.64),
      boxLidMaterials
    );
    boxLidMesh.position.y = 0.052;
    boxLidMesh.castShadow = !isSoftwareGl;
    boxGroup.add(boxLidMesh);

    // =========================================================================
    // 4. SORRY! HINGED UNFOLDING BOARD, CARDS & 16 PAWNS
    // =========================================================================
    const sorryBoardGroup = new THREE.Group();
    sorryBoardGroup.position.set(0, TABLE_SURFACE_Y, 0);
    scene.add(sorryBoardGroup);

    const boardSideMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.55,
    });
    const boardTopMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: boardTexture,
      roughness: 0.28,
      metalness: 0.04,
    });
    const boardMaterials = [
      boardSideMat,
      boardSideMat,
      boardTopMat,
      boardSideMat,
      boardSideMat,
      boardSideMat,
    ];
    const boardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WORLD_SIZE, 0.016, BOARD_WORLD_SIZE),
      boardMaterials
    );
    boardMesh.position.y = 0.008;
    boardMesh.receiveShadow = !isSoftwareGl;
    boardMesh.castShadow = !isSoftwareGl;
    sorryBoardGroup.add(boardMesh);

    // Hinged visual folding flaps during the box-unfold animation
    const foldingFlapLeft = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WORLD_SIZE * 0.5, 0.014, BOARD_WORLD_SIZE),
      boardSideMat
    );
    foldingFlapLeft.visible = false;
    sorryBoardGroup.add(foldingFlapLeft);

    const deckPos = boardUVToWorld(0.44 - 0.5, 0.63 - 0.5, 0);
    const discardPos = boardUVToWorld(0.56 - 0.5, 0.37 - 0.5, 0);

    const cardSideMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    const cardBackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cardBackTexture,
      roughness: 0.32,
    });

    const drawDeckMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.024, 0.168),
      [cardSideMat, cardSideMat, cardBackMat, cardSideMat, cardSideMat, cardSideMat]
    );
    drawDeckMesh.position.set(deckPos.x, 0.016 + 0.012, deckPos.z);
    drawDeckMesh.rotation.y = -0.18;
    drawDeckMesh.castShadow = !isSoftwareGl;
    drawDeckMesh.userData = { type: 'draw_deck' };
    sorryBoardGroup.add(drawDeckMesh);

    const discardFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cardFrontTextures['2'],
      roughness: 0.32,
    });
    const discardCardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.008, 0.168),
      [cardSideMat, cardSideMat, discardFrontMat, cardBackMat, cardSideMat, cardSideMat]
    );
    discardCardMesh.position.set(discardPos.x, 0.016 + 0.004, discardPos.z);
    discardCardMesh.rotation.y = -0.18;
    discardCardMesh.castShadow = !isSoftwareGl;
    sorryBoardGroup.add(discardCardMesh);

    const flippingCardFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cardFrontTextures['1'],
      roughness: 0.3,
    });
    const flippingCardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.004, 0.168),
      [cardSideMat, cardSideMat, flippingCardFrontMat, cardBackMat, cardSideMat, cardSideMat]
    );
    flippingCardMesh.visible = false;
    sorryBoardGroup.add(flippingCardMesh);

    const pawnMeshes = new Map<string, THREE.Group>();
    const pawnHitboxes: THREE.Mesh[] = [];
    const highlightRings: THREE.Mesh[] = [];

    for (const color of PLAYER_COLORS) {
      const hex = PLAYER_META[color].hex;
      for (let i = 0; i < 4; i++) {
        const id = `${color}-${i}`;
        const pGroup = createPawnGroup(hex, isSoftwareGl);
        pGroup.userData = { pawnId: id, color, pawnIndex: i };
        scene.add(pGroup);
        pawnMeshes.set(id, pGroup);

        const hitGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.085, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.y = 0.042;
        hitMesh.userData = { type: 'pawn', pawnId: id };
        pGroup.add(hitMesh);
        pawnHitboxes.push(hitMesh);
      }
    }

    const ringGeo = new THREE.RingGeometry(0.024, 0.035, 24);
    ringGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const rMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const rMesh = new THREE.Mesh(ringGeo, rMat);
      rMesh.visible = false;
      scene.add(rMesh);
      highlightRings.push(rMesh);
    }

    // =========================================================================
    // 5. 3D GUESS WHO? TRAYS & 48 HINGED FOLDING PICTURE STANDS
    // =========================================================================
    const guessWhoGroup = new THREE.Group();
    guessWhoGroup.position.set(0, TABLE_SURFACE_Y, 0);
    guessWhoGroup.visible = false;
    scene.add(guessWhoGroup);

    // Pre-generate character textures for all 24 characters
    const charTextures = new Map<string, THREE.CanvasTexture>();
    for (const char of GUESS_WHO_CHARACTERS) {
      charTextures.set(char.id, createGuessWhoCharacterTexture(char, false, maxAniso));
    }
    const redStandBackTex = createGuessWhoStandBackTexture('red', maxAniso);
    const blueStandBackTex = createGuessWhoStandBackTexture('blue', maxAniso);

    const redTrayGroup = new THREE.Group();
    const blueTrayGroup = new THREE.Group();
    guessWhoGroup.add(redTrayGroup);
    guessWhoGroup.add(blueTrayGroup);

    const playerStandPivots = new Map<string, THREE.Group>();
    const aiStandPivots = new Map<string, THREE.Group>();
    const playerStandHitboxes: THREE.Mesh[] = [];

    const yellowPlasticMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.32,
      metalness: 0.05,
    });

    const buildGuessWhoTray = (
      trayGroup: THREE.Group,
      trayType: 'red' | 'blue',
      standMap: Map<string, THREE.Group>,
      collectHitboxes: boolean
    ) => {
      const trayPlasticMat = new THREE.MeshStandardMaterial({
        color: trayType === 'red' ? 0xdc2626 : 0x0284c7,
        roughness: 0.35,
        metalness: 0.06,
      });
      const darkSlotMat = new THREE.MeshStandardMaterial({
        color: trayType === 'red' ? 0x7f1d1d : 0x0c4a6e,
        roughness: 0.7,
      });

      // Molded plastic tray base (0.82m wide x 0.48m deep)
      const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.026, 0.48),
        trayPlasticMat
      );
      baseMesh.position.y = 0.013;
      baseMesh.castShadow = !isSoftwareGl;
      baseMesh.receiveShadow = !isSoftwareGl;
      trayGroup.add(baseMesh);

      // Raised side & back rails
      const leftRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.042, 0.48),
        trayPlasticMat
      );
      leftRail.position.set(-0.396, 0.021, 0);
      trayGroup.add(leftRail);

      const rightRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.042, 0.48),
        trayPlasticMat
      );
      rightRail.position.set(0.396, 0.021, 0);
      trayGroup.add(rightRail);

      // Score slider peg on front lip
      const scorePeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.024, 12),
        yellowPlasticMat
      );
      scorePeg.position.set(-0.22, 0.03, 0.21);
      trayGroup.add(scorePeg);

      // 4 rows x 6 columns of hinged folding picture stands (24 characters)
      const cols = 6;
      const rows = 4;
      const standW = 0.098;
      const standH = 0.118;
      const standDepth = 0.008;

      GUESS_WHO_CHARACTERS.forEach((char, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const x = (col - 2.5) * 0.122;
        const z = -0.165 + row * 0.092;

        // Recessed well under each stand
        const slotWell = new THREE.Mesh(
          new THREE.PlaneGeometry(standW * 0.95, 0.068),
          darkSlotMat
        );
        slotWell.rotateX(-Math.PI / 2);
        slotWell.position.set(x, 0.0265, z - 0.025);
        trayGroup.add(slotWell);

        // Hinge pivot at bottom edge of the picture frame
        const pivot = new THREE.Group();
        pivot.position.set(x, 0.026, z);
        pivot.rotation.x = -0.16; // Upright tilted slightly back toward viewer
        trayGroup.add(pivot);
        standMap.set(char.id, pivot);

        const frontTex = charTextures.get(char.id)!;
        const backTex = trayType === 'red' ? redStandBackTex : blueStandBackTex;

        const standMaterials = [
          yellowPlasticMat,
          yellowPlasticMat,
          yellowPlasticMat,
          yellowPlasticMat,
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: frontTex,
            roughness: 0.28,
          }),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: backTex,
            roughness: 0.38,
          }),
        ];

        const standMesh = new THREE.Mesh(
          new THREE.BoxGeometry(standW, standH, standDepth),
          standMaterials
        );
        standMesh.position.y = standH / 2;
        standMesh.castShadow = !isSoftwareGl;
        standMesh.userData = { type: 'guess_who_stand', characterId: char.id };
        pivot.add(standMesh);

        if (collectHitboxes) {
          playerStandHitboxes.push(standMesh);
        }
      });
    };

    buildGuessWhoTray(redTrayGroup, 'red', playerStandPivots, true);
    buildGuessWhoTray(blueTrayGroup, 'blue', aiStandPivots, false);

    // Position Red Tray on South side (facing player at +Z) and Blue Tray on North side (facing -Z)
    redTrayGroup.position.set(0, 0, 0.31);
    blueTrayGroup.position.set(0, 0, -0.31);
    blueTrayGroup.rotation.y = Math.PI;

    // Front Mystery Card for Player (Red Tray) and Opponent (Blue Tray)
    const playerMysteryFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: charTextures.get('mike')!,
      roughness: 0.28,
    });
    const playerMysteryCardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.118, 0.148, 0.008),
      [
        yellowPlasticMat,
        yellowPlasticMat,
        yellowPlasticMat,
        yellowPlasticMat,
        playerMysteryFrontMat,
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: redStandBackTex }),
      ]
    );
    playerMysteryCardMesh.position.set(0.16, 0.026 + 0.074, 0.205);
    playerMysteryCardMesh.rotation.x = -0.12;
    playerMysteryCardMesh.castShadow = !isSoftwareGl;
    redTrayGroup.add(playerMysteryCardMesh);

    const aiMysteryFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: charTextures.get('emma')!,
      roughness: 0.28,
    });
    const aiMysteryCardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.118, 0.148, 0.008),
      [
        yellowPlasticMat,
        yellowPlasticMat,
        yellowPlasticMat,
        yellowPlasticMat,
        aiMysteryFrontMat,
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: blueStandBackTex }),
      ]
    );
    aiMysteryCardMesh.position.set(0, 0.026 + 0.074, 0.205);
    aiMysteryCardMesh.rotation.x = -0.12;
    aiMysteryCardMesh.castShadow = !isSoftwareGl;
    blueTrayGroup.add(aiMysteryCardMesh);

    // =========================================================================
    // 5B. 3D MOUSE TRAP LIVING POP-UP BOARD, FLOATING CHEESE & LIVE MICE
    // =========================================================================
    const mouseTrapHandles = buildMouseTrap3DScene(mouseTrapBoardTexture, isSoftwareGl);
    mouseTrapHandles.rootGroup.position.set(0, TABLE_SURFACE_Y, 0);
    mouseTrapHandles.rootGroup.visible = false;
    scene.add(mouseTrapHandles.rootGroup);

    const mouseControlState = {
      localPos: new THREE.Vector3(
        MOUSE_TRAP_SPACES[0].u * BOARD_WORLD_SIZE,
        0.016,
        MOUSE_TRAP_SPACES[0].v * BOARD_WORLD_SIZE
      ),
      yaw: 0,
      lastCheeseCollectMs: 0,
    };

    // =========================================================================
    // 5C. 3D STEP2 LIFT & HIDE TOY CHEST BESIDE THE TABLE (STORES GAME BOXES!)
    // =========================================================================
    const toyChestHandles = buildStep2ToyChest3D(
      {
        sorry: sorryBoxLidTexture,
        guess_who: guessWhoBoxLidTexture,
        mouse_trap: mouseTrapBoxLidTexture,
        view_master: viewMasterBoxLidTexture,
      },
      isSoftwareGl
    );
    // Positioned right beside the table on the East/South-East side so it's visible and easy to inspect!
    toyChestHandles.rootGroup.position.set(1.48, 0.015, 0.32);
    toyChestHandles.rootGroup.rotation.y = -0.62;
    scene.add(toyChestHandles.rootGroup);

    // =========================================================================
    // 5D. 3D VIEW-MASTER STEREOSCOPIC VIEWER & INTERACTIVE REELS ON TABLETOP
    // =========================================================================
    const viewMasterHandles = buildViewMaster3DScene(isSoftwareGl);
    viewMasterHandles.rootGroup.position.set(0, TABLE_SURFACE_Y, 0);
    viewMasterHandles.rootGroup.visible = false;
    scene.add(viewMasterHandles.rootGroup);

    // =========================================================================
    // 6. POOLED PARTICLE SYSTEM
    // =========================================================================
    const PARTICLE_COUNT = 36;
    const particleGeo = new THREE.SphereGeometry(0.009, 6, 6);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      PARTICLE_COUNT
    );
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particlePool = Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.5,
      color: new THREE.Color(0xffffff),
    }));
    const _dummyMatrix = new THREE.Matrix4();

    const spawnBurstParticles = (origin: THREE.Vector3, hexColor: string, count: number) => {
      _colorScratch.set(hexColor);
      let spawned = 0;
      for (const p of particlePool) {
        if (!p.active && spawned < count) {
          p.active = true;
          p.pos.copy(origin).add(new THREE.Vector3(0, 0.03, 0));
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 1.1;
          p.vel.set(Math.cos(angle) * speed, 0.8 + Math.random() * 1.2, Math.sin(angle) * speed);
          p.life = 0;
          p.maxLife = 0.35 + Math.random() * 0.25;
          p.color.copy(_colorScratch);
          spawned++;
        }
      }
    };

    const attractPawns = [
      { id: 'red-0', color: 'red' as PlayerColor, track: 4, progress: 0 },
      { id: 'blue-0', color: 'blue' as PlayerColor, track: 19, progress: 0.3 },
      { id: 'yellow-0', color: 'yellow' as PlayerColor, track: 34, progress: 0.6 },
      { id: 'green-0', color: 'green' as PlayerColor, track: 49, progress: 0.15 },
    ];

    // =========================================================================
    // 7. UNIVERSAL PC CAMERA ORBIT/ZOOM, FPV ROAM & POINTER INTERACTION
    // =========================================================================
    const fpvState = {
      pos: new THREE.Vector3(0, 1.66, 3.35),
      yaw: 0,
      pitch: -0.22,
      walkBobDist: 0,
      lastFootstepDist: 0,
      isDraggingLook: false,
      dragStartX: 0,
      dragStartY: 0,
    };

    const orbitControl = {
      yawOffset: 0,
      pitchOffset: 0,
      zoomScale: 1.0,
      lastCameraAngle: 'tabletop' as CameraAngleId,
      lastInteractionMs: performance.now(),
    };

    let lastPhysicsBumpCount = 0;

    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keysHeld.add(e.code);
      orbitControl.lastInteractionMs = performance.now();
      if (e.code === 'KeyE') {
        const cur = latestRef.current;
        if (cur.appState === 'playing' && cur.subPhase === 'fpv_room') {
          cur.onRequestOpenBox();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const clearInputs = () => {
      keysHeld.clear();
      fpvState.isDraggingLook = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      fpvState.isDraggingLook = true;
      fpvState.dragStartX = e.clientX;
      fpvState.dragStartY = e.clientY;
      orbitControl.lastInteractionMs = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!fpvState.isDraggingLook) return;
      const cur = latestRef.current;
      if (cur.appState !== 'playing') return;

      const dx = e.clientX - fpvState.dragStartX;
      const dy = e.clientY - fpvState.dragStartY;
      fpvState.dragStartX = e.clientX;
      fpvState.dragStartY = e.clientY;
      orbitControl.lastInteractionMs = performance.now();

      if (cur.subPhase === 'fpv_room' || cur.cameraAngle === 'fpv') {
        fpvState.yaw -= dx * 0.0045;
        fpvState.pitch = THREE.MathUtils.clamp(
          fpvState.pitch - dy * 0.0035,
          -1.05,
          0.65
        );
      } else {
        // Universal PC Click-and-Drag Camera Orbit across all 4 games!
        orbitControl.yawOffset -= dx * 0.0055;
        orbitControl.pitchOffset = THREE.MathUtils.clamp(
          orbitControl.pitchOffset + dy * 0.004,
          -0.38,
          0.52
        );
      }
    };

    const onWheel = (e: WheelEvent) => {
      const cur = latestRef.current;
      if (cur.appState !== 'playing') return;
      orbitControl.lastInteractionMs = performance.now();
      orbitControl.zoomScale = THREE.MathUtils.clamp(
        orbitControl.zoomScale + e.deltaY * 0.0007,
        0.55,
        1.75
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      fpvState.isDraggingLook = false;
      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (moveDist > 8) return;

      const cur = latestRef.current;
      if (cur.appState !== 'playing') return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);

      // 1. Check if clicking the 3D Step2 Lift & Hide Toy Chest beside the table (or stored 3D game boxes inside it!)
      const chestHits = raycaster.intersectObjects(toyChestHandles.hitboxes, false);
      if (chestHits.length > 0) {
        const hitData = chestHits[0].object.userData;
        if (hitData.type === 'toy_chest_box' && cur.toyChestOpen && hitData.gameId) {
          cur.onSelectGameFromToyChest(hitData.gameId as ActiveGameType);
          return;
        }
        cur.onToggleToyChest();
        return;
      }

      if (cur.subPhase === 'fpv_room') {
        const hits = raycaster.intersectObjects([boxLidMesh, trayBottom], false);
        if (hits.length > 0) {
          cur.onRequestOpenBox();
        }
        return;
      }

      // 2. View-Master 3D Stereoscopic Viewer & Reels interaction
      if (cur.subPhase === 'board_play' && cur.activeGame === 'view_master') {
        const vmHits = raycaster.intersectObjects(viewMasterHandles.hitboxes, false);
        if (vmHits.length > 0) {
          const uData = vmHits[0].object.userData;
          if (uData.type === 'view_master_reel' && uData.reelId) {
            cur.onSelectViewMasterReel(uData.reelId as ViewMasterReelId);
            return;
          }
          if (uData.type === 'view_master_eyepiece') {
            cur.onToggleViewMasterEyepiece();
            return;
          }
          if (uData.type === 'view_master_lever' || uData.type === 'view_master_body') {
            cur.onAdvanceViewMasterSlide();
            return;
          }
        }
        return;
      }

      if (cur.subPhase === 'board_play' && cur.activeGame === 'guess_who') {
        // Check if clicking one of the 24 3D picture stands on Red's tray!
        const standHits = raycaster.intersectObjects(playerStandHitboxes, false);
        if (standHits.length > 0) {
          const charId = standHits[0].object.userData.characterId;
          if (charId) {
            soundFX.playStandFlipClack(0);
            cur.onToggleGuessWhoStand(charId);
          }
        }
        return;
      }

      if (cur.subPhase === 'board_play' && cur.activeGame === 'mouse_trap') {
        const diceHits = raycaster.intersectObject(mouseTrapHandles.diceMesh, false);
        if (diceHits.length > 0) {
          cur.onRollMouseTrapDice();
          return;
        }
        const sceneHits = raycaster.intersectObjects(
          mouseTrapHandles.sceneHitboxes,
          false
        );
        if (sceneHits.length > 0) {
          const sceneId = sceneHits[0].object.userData
            .sceneId as InteractiveSceneId | undefined;
          if (sceneId) {
            spawnBurstParticles(sceneHits[0].point, '#facc15', 16);
            cur.onTriggerMouseTrapScene(sceneId);
          }
        }
        return;
      }

      if (cur.subPhase === 'board_play' && cur.activeGame === 'sorry') {
        if (
          cur.gameState.turnPhase === 'draw' &&
          cur.gameState.currentTurn === 'red'
        ) {
          const deckHits = raycaster.intersectObject(drawDeckMesh, false);
          if (deckHits.length > 0) {
            cur.onDrawCard();
            return;
          }
        }

        if (
          cur.gameState.turnPhase === 'move' &&
          cur.gameState.currentTurn === 'red' &&
          cur.gameState.legalMoves.length > 0
        ) {
          const pawnHits = raycaster.intersectObjects(pawnHitboxes, false);
          if (pawnHits.length > 0) {
            const clickedPawnId = pawnHits[0].object.userData.pawnId;
            const matchingMove = cur.gameState.legalMoves.find(
              (m) =>
                m.primaryPawnId === clickedPawnId ||
                m.swapTargetPawnId === clickedPawnId ||
                m.bumpedPawns.some((b) => b.pawnId === clickedPawnId)
            );
            if (matchingMove) {
              cur.onSelectMove(matchingMove);
            }
          }
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================================
    // 8. MAIN ANIMATION LOOP
    // =========================================================================
    const clock = new THREE.Clock();
    let frameId = 0;
    let cameraTrauma = 0;
    let lastNotifiedMoveId: string | null = null;
    let lastCardShown: CardRank | null = null;
    let cardFlipStartTime = -1;
    let lastStepSoundIndex = -1;
    let playedSlideSoundForMove = false;
    let playedBumpSoundForMove = false;
    let lastPlayerFoldCount = 0;
    let lastAiFoldCount = 0;
    let guessWhoZoomUntil = 0;
    let guessWhoZoomTargetZ = 0.25;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function applyUserOrbitAndZoom(
      basePos: THREE.Vector3,
      lookTarget: THREE.Vector3
    ) {
      if (
        Math.abs(orbitControl.yawOffset) < 0.0001 &&
        Math.abs(orbitControl.pitchOffset) < 0.0001 &&
        Math.abs(orbitControl.zoomScale - 1.0) < 0.0001
      ) {
        return;
      }
      const relX = basePos.x - lookTarget.x;
      const relY = basePos.y - lookTarget.y;
      const relZ = basePos.z - lookTarget.z;

      const horizDist = Math.hypot(relX, relZ) * orbitControl.zoomScale;
      const baseTheta = Math.atan2(relX, relZ) + orbitControl.yawOffset;
      const newY = Math.max(
        0.28,
        relY * orbitControl.zoomScale + orbitControl.pitchOffset * 0.85
      );

      basePos.set(
        lookTarget.x + Math.sin(baseTheta) * horizDist,
        lookTarget.y + newY,
        lookTarget.z + Math.cos(baseTheta) * horizDist
      );
    }

    function getBaseCameraPose(
      angle: CameraAngleId,
      elapsed: number,
      gameType: ActiveGameType
    ): { pos: THREE.Vector3; look: THREE.Vector3 } {
      let res: { pos: THREE.Vector3; look: THREE.Vector3 };
      switch (angle) {
        case 'top':
          res = {
            pos: _vec3A.set(0, TABLE_SURFACE_Y + 1.35, 0.04),
            look: _vec3B.set(0, TABLE_SURFACE_Y, 0),
          };
          break;
        case 'side_north':
          res = {
            pos: _vec3A.set(0, TABLE_SURFACE_Y + 0.64, -1.04),
            look: _vec3B.set(0, TABLE_SURFACE_Y + 0.02, 0.04),
          };
          break;
        case 'side_east':
          res = {
            pos: _vec3A.set(1.04, TABLE_SURFACE_Y + 0.64, 0),
            look: _vec3B.set(-0.04, TABLE_SURFACE_Y + 0.02, 0),
          };
          break;
        case 'side_west':
          res = {
            pos: _vec3A.set(-1.04, TABLE_SURFACE_Y + 0.64, 0),
            look: _vec3B.set(0.04, TABLE_SURFACE_Y + 0.02, 0),
          };
          break;
        case 'toy_chest':
          res = {
            pos: _vec3A.set(0.55, 1.15, 1.48),
            look: _vec3B.set(1.42, 0.46, 0.28),
          };
          break;
        case 'fpv': {
          const bobY = Math.sin(fpvState.walkBobDist * 9.0) * 0.022;
          const pos = _vec3A.set(
            fpvState.pos.x,
            fpvState.pos.y + bobY,
            fpvState.pos.z
          );
          const lookDirX = -Math.sin(fpvState.yaw) * Math.cos(fpvState.pitch);
          const lookDirY = Math.sin(fpvState.pitch);
          const lookDirZ = -Math.cos(fpvState.yaw) * Math.cos(fpvState.pitch);
          const look = _vec3B.set(
            pos.x + lookDirX * 2.0,
            pos.y + lookDirY * 2.0,
            pos.z + lookDirZ * 2.0
          );
          return { pos, look };
        }
        case 'tabletop':
        case 'side_south':
        default: {
          const sway = Math.sin(elapsed * 0.45) * 0.015;
          if (gameType === 'guess_who') {
            res = {
              pos: _vec3A.set(sway - 0.06, TABLE_SURFACE_Y + 0.52, 0.88),
              look: _vec3B.set(-0.04, TABLE_SURFACE_Y + 0.06, 0.08),
            };
          } else if (gameType === 'mouse_trap') {
            res = {
              pos: _vec3A.set(sway * 0.6 - 0.04, TABLE_SURFACE_Y + 0.66, 0.92),
              look: _vec3B.set(-0.01, TABLE_SURFACE_Y + 0.09, -0.02),
            };
          } else if (gameType === 'view_master') {
            res = {
              pos: _vec3A.set(sway * 0.5, TABLE_SURFACE_Y + 0.56, 0.86),
              look: _vec3B.set(0, TABLE_SURFACE_Y + 0.12, 0.02),
            };
          } else {
            res = {
              pos: _vec3A.set(sway, TABLE_SURFACE_Y + 0.68, 1.02),
              look: _vec3B.set(0, TABLE_SURFACE_Y + 0.01, -0.03),
            };
          }
          break;
        }
      }

      applyUserOrbitAndZoom(res.pos, res.look);
      return res;
    }

    function updateFpvStandingRoam(dt: number) {
      let moveZ = 0;
      let moveX = 0;
      if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) moveZ += 1;
      if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) moveZ -= 1;
      if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) moveX -= 1;
      if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) moveX += 1;
      if (keysHeld.has('KeyQ')) fpvState.yaw += 1.5 * dt;

      if (moveZ !== 0 || moveX !== 0) {
        const speed = 2.15;
        const forwardX = -Math.sin(fpvState.yaw);
        const forwardZ = -Math.cos(fpvState.yaw);
        const rightX = Math.cos(fpvState.yaw);
        const rightZ = -Math.sin(fpvState.yaw);
        const vx = (forwardX * moveZ + rightX * moveX) * speed * dt;
        const vz = (forwardZ * moveZ + rightZ * moveX) * speed * dt;
        const nextX = THREE.MathUtils.clamp(fpvState.pos.x + vx, -3.8, 3.8);
        const nextZ = THREE.MathUtils.clamp(fpvState.pos.z + vz, -3.8, 3.8);
        if (Math.hypot(nextX, nextZ) > 1.18) {
          fpvState.pos.x = nextX;
          fpvState.pos.z = nextZ;
          const stepDelta = Math.hypot(vx, vz);
          fpvState.walkBobDist += stepDelta;
          if (fpvState.walkBobDist - fpvState.lastFootstepDist > 0.55) {
            fpvState.lastFootstepDist = fpvState.walkBobDist;
            soundFX.playFootstep();
          }
        }
      }
    }

    function tick() {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();
      const nowMs = performance.now();
      const cur = latestRef.current;

      // Reset orbit offsets when switching camera presets
      if (cur.cameraAngle !== orbitControl.lastCameraAngle) {
        orbitControl.lastCameraAngle = cur.cameraAngle;
        orbitControl.yawOffset = 0;
        orbitControl.pitchOffset = 0;
        orbitControl.zoomScale = 1.0;
        if (cur.cameraAngle === 'fpv' && cur.subPhase === 'board_play') {
          // Stand up from the chair so player can pan around the room & inspect the Toy Chest while the game keeps playing!
          fpvState.pos.set(0.32, 1.66, 1.72);
          fpvState.yaw = -0.25;
          fpvState.pitch = -0.32;
        }
      }

      // Trigger Cannon.js physics impulse when requested
      if (cur.physicsBumpTrigger !== lastPhysicsBumpCount) {
        lastPhysicsBumpCount = cur.physicsBumpTrigger;
        mouseTrapHandles.triggerPhysicsBump(1.1);
      }

      // Always update the 3D Step2 Lift & Hide Toy Chest beside the table
      toyChestHandles.updateToyChest(dt, cur.toyChestOpen, cur.activeGame);

      // Sync box cover artwork with activeGame ('sorry' | 'guess_who' | 'mouse_trap' | 'view_master')
      const targetBoxTex =
        cur.activeGame === 'guess_who'
          ? guessWhoBoxLidTexture
          : cur.activeGame === 'mouse_trap'
          ? mouseTrapBoxLidTexture
          : cur.activeGame === 'view_master'
          ? viewMasterBoxLidTexture
          : sorryBoxLidTexture;
      if (boxLidTopMat.map !== targetBoxTex) {
        boxLidTopMat.map = targetBoxTex;
        boxLidTopMat.needsUpdate = true;
      }

      pendantGroup.rotation.z = Math.sin(elapsed * 0.85) * 0.016;
      pendantGroup.rotation.x = Math.cos(elapsed * 0.65) * 0.012;

      // Update pooled particles
      let anyParticleActive = false;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particlePool[i];
        if (p.active) {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            _dummyMatrix.makeScale(0, 0, 0);
          } else {
            anyParticleActive = true;
            p.vel.y -= 3.8 * dt;
            p.pos.addScaledVector(p.vel, dt);
            if (p.pos.y < BOARD_SURFACE_Y) {
              p.pos.y = BOARD_SURFACE_Y;
              p.vel.y *= -0.45;
            }
            const s = 1.0 - p.life / p.maxLife;
            _dummyMatrix.makeTranslation(p.pos.x, p.pos.y, p.pos.z);
            _dummyMatrix.scale(_vec3A.set(s, s, s));
            particleInstanced.setColorAt(i, p.color);
          }
        } else {
          _dummyMatrix.makeScale(0, 0, 0);
        }
        particleInstanced.setMatrixAt(i, _dummyMatrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (anyParticleActive && particleInstanced.instanceColor) {
        particleInstanced.instanceColor.needsUpdate = true;
      }

      // =====================================================================
      // CASE 1: TITLE SCREEN — CARDBOARD BOX + LIVE 3D BOARD BEHIND MENU
      // =====================================================================
      if (cur.appState === 'title') {
        boxGroup.visible = true;
        boxBaseGroup.position.set(-0.56, 0, -0.46);
        boxBaseGroup.scale.setScalar(0.55);
        boxLidMesh.position.set(-0.56, 0.032, -0.46);
        boxLidMesh.rotation.set(0, 0.32, 0);
        boxLidMesh.scale.setScalar(0.55);

        const orbitAngle = elapsed * 0.22;
        _vec3TargetPos.set(
          Math.sin(orbitAngle) * 1.56,
          TABLE_SURFACE_Y + 0.64,
          Math.cos(orbitAngle) * 1.56
        );
        _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.14, 0);
        camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-5 * dt));
        camera.lookAt(_vec3TargetLook);

        if (cur.activeGame === 'sorry') {
          sorryBoardGroup.visible = true;
          sorryBoardGroup.scale.set(1, 1, 1);
          guessWhoGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          discardCardMesh.visible = true;

          for (const pState of cur.gameState.pawns) {
            const mesh = pawnMeshes.get(pState.id);
            if (!mesh) continue;
            mesh.visible = true;

            const attract = attractPawns.find((a) => a.id === pState.id);
            if (attract) {
              attract.progress += dt * 1.9;
              if (attract.progress >= 1) {
                attract.progress = 0;
                attract.track = wrapTrackIndex(attract.track + 1);
              }
              const c0 = getNormalizedBoardCoords('track', attract.color, attract.track);
              const c1 = getNormalizedBoardCoords(
                'track',
                attract.color,
                wrapTrackIndex(attract.track + 1)
              );
              const u = THREE.MathUtils.lerp(c0.u, c1.u, attract.progress);
              const v = THREE.MathUtils.lerp(c0.v, c1.v, attract.progress);
              const hopArc = Math.sin(attract.progress * Math.PI) * 0.055;
              mesh.position.copy(boardUVToWorld(u, v, hopArc));
            } else {
              const coord = getNormalizedBoardCoords(
                'start',
                pState.color,
                pState.pawnIndex,
                pState.pawnIndex
              );
              mesh.position.copy(boardUVToWorld(coord.u, coord.v, 0));
            }
          }
        } else if (cur.activeGame === 'guess_who') {
          sorryBoardGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          guessWhoGroup.visible = true;
          redTrayGroup.position.set(0, 0, 0.31);
          blueTrayGroup.position.set(0, 0, -0.31);

          let sIdx = 0;
          playerStandPivots.forEach((pivot) => {
            const wave = Math.sin(elapsed * 2.2 + sIdx * 0.4);
            pivot.rotation.x = wave < -0.6 ? -Math.PI * 0.46 : -0.16;
            sIdx++;
          });
        } else if (cur.activeGame === 'view_master') {
          sorryBoardGroup.visible = false;
          guessWhoGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          viewMasterHandles.rootGroup.visible = true;
          viewMasterHandles.rootGroup.scale.set(1, 1, 1);
          viewMasterHandles.updateViewMaster3D(
            dt,
            elapsed,
            cur.viewMasterState,
            cur.viewMasterLeverAnimMs,
            cur.viewMasterInsertAnimMs,
            nowMs
          );
        } else {
          // Mouse Trap 3D Living Pop-Up Board preview on Title Screen!
          sorryBoardGroup.visible = false;
          guessWhoGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          mouseTrapHandles.rootGroup.visible = true;
          mouseTrapHandles.rootGroup.scale.set(1, 1, 1);

          const previewState: MouseTrapGameState = {
            ...cur.mouseTrapState,
            builtStages: 5,
          };
          mouseTrapHandles.updateLivingMouseTrapScene({
            elapsed,
            dt,
            state: previewState,
            activeMouseStepAnim: null,
            chainReactionStartMs: null,
            scenePulseStartMs: null,
            nowMs,
            mouseControlMode: false,
            playerControlWorldPos: mouseControlState.localPos,
            playerControlYaw: 0,
            playerIsMoving: false,
          });
        }
      }
      // =====================================================================
      // CASE 2: PLAYING — SUBPHASE 'fpv_room' (WALK UP TO CARDBOARD BOX)
      // =====================================================================
      else if (cur.subPhase === 'fpv_room') {
        boxGroup.visible = true;
        boxBaseGroup.position.set(0, 0, 0);
        boxBaseGroup.scale.setScalar(1);
        boxLidMesh.position.set(0, 0.052, 0);
        boxLidMesh.rotation.set(0, 0, 0);
        boxLidMesh.scale.setScalar(1);

        sorryBoardGroup.visible = false;
        guessWhoGroup.visible = false;
        mouseTrapHandles.rootGroup.visible = false;
        viewMasterHandles.rootGroup.visible = false;
        highlightRings.forEach((r) => (r.visible = false));
        pawnMeshes.forEach((m) => (m.visible = false));

        if (autoWalkToTableRef.current) {
          const targetX = 0;
          const targetZ = 1.45;
          const dx = targetX - fpvState.pos.x;
          const dz = targetZ - fpvState.pos.z;
          const dist = Math.hypot(dx, dz);
          fpvState.yaw = THREE.MathUtils.damp(fpvState.yaw, 0, 6, dt);
          fpvState.pitch = THREE.MathUtils.damp(fpvState.pitch, -0.42, 6, dt);
          if (dist > 0.08) {
            fpvState.pos.x += (dx / dist) * 2.2 * dt;
            fpvState.pos.z += (dz / dist) * 2.2 * dt;
            fpvState.walkBobDist += 2.2 * dt;
          } else {
            autoWalkToTableRef.current = false;
          }
        } else {
          updateFpvStandingRoam(dt);
        }

        const distToTable = Math.hypot(fpvState.pos.x, fpvState.pos.z);
        const isNear = distToTable < 2.35;
        if (isNear !== cur.nearTable) {
          cur.onNearTableChange(isNear);
        }

        const pose = getBaseCameraPose('fpv', elapsed, cur.activeGame);
        camera.position.copy(pose.pos);
        camera.lookAt(pose.look);
      }
      // =====================================================================
      // CASE 3: PLAYING — SUBPHASE 'unfolding' (3D CARDBOARD BOX OPENS & UNFOLDS)
      // =====================================================================
      else if (cur.subPhase === 'unfolding') {
        const startT = unfoldStartRef.current ?? nowMs;
        const progress = Math.min(1, (nowMs - startT) / 2450);

        boxGroup.visible = true;

        const boxOutX = cur.activeGame === 'mouse_trap' ? -0.74 : -0.58;
        const boxOutZ = cur.activeGame === 'mouse_trap' ? -0.68 : -0.52;
        const boxOutScale = cur.activeGame === 'mouse_trap' ? 0.34 : 0.52;

        const lidT = THREE.MathUtils.smoothstep(progress, 0.0, 0.42);
        boxLidMesh.position.set(
          THREE.MathUtils.lerp(0, boxOutX, lidT),
          THREE.MathUtils.lerp(0.052, 0.032, lidT) + Math.sin(lidT * Math.PI) * 0.28,
          THREE.MathUtils.lerp(0, boxOutZ, lidT)
        );
        boxLidMesh.rotation.z = Math.sin(lidT * Math.PI) * 0.35;
        boxLidMesh.rotation.y = lidT * 0.32;
        boxLidMesh.scale.setScalar(THREE.MathUtils.lerp(1.0, boxOutScale, lidT));

        const trayT = THREE.MathUtils.smoothstep(progress, 0.28, 0.65);
        boxBaseGroup.position.set(
          THREE.MathUtils.lerp(0, boxOutX, trayT),
          0,
          THREE.MathUtils.lerp(0, boxOutZ, trayT)
        );
        boxBaseGroup.scale.setScalar(THREE.MathUtils.lerp(1.0, boxOutScale, trayT));

        if (cur.activeGame === 'sorry') {
          sorryBoardGroup.visible = true;
          guessWhoGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;

          const boardT = THREE.MathUtils.smoothstep(progress, 0.16, 0.68);
          sorryBoardGroup.position.y =
            TABLE_SURFACE_Y + Math.sin(boardT * Math.PI) * 0.12;
          sorryBoardGroup.scale.set(
            THREE.MathUtils.lerp(0.42, 1.0, boardT),
            1.0,
            THREE.MathUtils.lerp(0.42, 1.0, boardT)
          );
          foldingFlapLeft.visible = boardT < 0.92;
          foldingFlapLeft.position.set(-BOARD_WORLD_SIZE * 0.25, 0.018, 0);
          foldingFlapLeft.rotation.z = (1 - boardT) * Math.PI * 0.85;

          let idx = 0;
          for (const pState of cur.gameState.pawns) {
            const mesh = pawnMeshes.get(pState.id);
            if (!mesh) continue;
            const delay = 0.44 + idx * 0.028;
            const pawnT = THREE.MathUtils.smoothstep(progress, delay, delay + 0.34);
            mesh.visible = pawnT > 0.01;

            const startCoord = getNormalizedBoardCoords(
              'start',
              pState.color,
              pState.pawnIndex,
              pState.pawnIndex
            );
            const targetWorld = boardUVToWorld(startCoord.u, startCoord.v, 0);
            const originWorld = new THREE.Vector3(0, TABLE_SURFACE_Y + 0.07, 0);

            mesh.position.lerpVectors(originWorld, targetWorld, pawnT);
            mesh.position.y += Math.sin(pawnT * Math.PI) * 0.24;
            idx++;
          }
        } else if (cur.activeGame === 'guess_who') {
          sorryBoardGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          guessWhoGroup.visible = true;

          const traySlideT = THREE.MathUtils.smoothstep(progress, 0.18, 0.66);
          redTrayGroup.position.set(
            0,
            Math.sin(traySlideT * Math.PI) * 0.08,
            THREE.MathUtils.lerp(0, 0.31, traySlideT)
          );
          blueTrayGroup.position.set(
            0,
            Math.sin(traySlideT * Math.PI) * 0.08,
            THREE.MathUtils.lerp(0, -0.31, traySlideT)
          );

          let sIdx = 0;
          playerStandPivots.forEach((pivot) => {
            const standT = THREE.MathUtils.smoothstep(
              progress,
              0.46 + sIdx * 0.016,
              0.68 + sIdx * 0.016
            );
            pivot.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.48, -0.16, standT);
            sIdx++;
          });
          let bIdx = 0;
          aiStandPivots.forEach((pivot) => {
            const standT = THREE.MathUtils.smoothstep(
              progress,
              0.48 + bIdx * 0.016,
              0.7 + bIdx * 0.016
            );
            pivot.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.48, -0.16, standT);
            bIdx++;
          });
        } else if (cur.activeGame === 'view_master') {
          sorryBoardGroup.visible = false;
          guessWhoGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          viewMasterHandles.rootGroup.visible = true;

          const vmT = THREE.MathUtils.smoothstep(progress, 0.16, 0.68);
          viewMasterHandles.rootGroup.position.y =
            TABLE_SURFACE_Y + Math.sin(vmT * Math.PI) * 0.09;
          viewMasterHandles.rootGroup.scale.setScalar(
            THREE.MathUtils.lerp(0.35, 1.0, vmT)
          );
          viewMasterHandles.updateViewMaster3D(
            dt,
            elapsed,
            cur.viewMasterState,
            cur.viewMasterLeverAnimMs,
            cur.viewMasterInsertAnimMs,
            nowMs
          );
        } else {
          // Unfolding 3D MOUSE TRAP Cardboard Box -> Pop-Up Board unfolds & Contraption + Mice pop up!
          sorryBoardGroup.visible = false;
          guessWhoGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          mouseTrapHandles.rootGroup.visible = true;

          const boardT = THREE.MathUtils.smoothstep(progress, 0.16, 0.68);
          mouseTrapHandles.rootGroup.position.y =
            TABLE_SURFACE_Y + Math.sin(boardT * Math.PI) * 0.11;
          mouseTrapHandles.rootGroup.scale.set(
            THREE.MathUtils.lerp(0.42, 1.0, boardT),
            THREE.MathUtils.lerp(0.25, 1.0, boardT),
            THREE.MathUtils.lerp(0.42, 1.0, boardT)
          );

          mouseTrapHandles.updateLivingMouseTrapScene({
            elapsed,
            dt,
            state: cur.mouseTrapState,
            activeMouseStepAnim: null,
            chainReactionStartMs: null,
            scenePulseStartMs: null,
            nowMs,
            mouseControlMode: false,
            playerControlWorldPos: mouseControlState.localPos,
            playerControlYaw: 0,
            playerIsMoving: false,
          });
        }

        _vec3TargetPos.set(0.18, TABLE_SURFACE_Y + 0.72, 1.08);
        _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.04, 0);
        camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-4.8 * dt));
        camera.lookAt(_vec3TargetLook);

        if (progress >= 1) {
          foldingFlapLeft.visible = false;
          sorryBoardGroup.position.y = TABLE_SURFACE_Y;
          mouseTrapHandles.rootGroup.position.y = TABLE_SURFACE_Y;
          mouseTrapHandles.rootGroup.scale.set(1, 1, 1);
          viewMasterHandles.rootGroup.position.y = TABLE_SURFACE_Y;
          viewMasterHandles.rootGroup.scale.set(1, 1, 1);
          soundFX.playHomeChime();
          cur.onUnfoldComplete();
        }
      }
      // =====================================================================
      // CASE 4: PLAYING — SUBPHASE 'board_play' (ALL 4 GAMES CONTINUE LIVE!)
      // =====================================================================
      else {
        boxGroup.visible = cur.activeGame !== 'mouse_trap';
        boxBaseGroup.position.set(-0.58, 0, -0.52);
        boxBaseGroup.scale.setScalar(0.52);
        boxLidMesh.position.set(-0.58, 0.032, -0.52);
        boxLidMesh.rotation.set(0, 0.32, 0);
        boxLidMesh.scale.setScalar(0.52);

        // Allow standing up & roaming the room in ANY game while the game continues playing on the table!
        if (cur.cameraAngle === 'fpv') {
          updateFpvStandingRoam(dt);
        }

        if (cur.activeGame === 'view_master') {
          // =================================================================
          // 4D. 3D VIEW-MASTER STEREOSCOPIC VIEWER & INTERACTIVE REELS
          // =================================================================
          sorryBoardGroup.visible = false;
          guessWhoGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          highlightRings.forEach((r) => (r.visible = false));
          viewMasterHandles.rootGroup.visible = true;

          viewMasterHandles.updateViewMaster3D(
            dt,
            elapsed,
            cur.viewMasterState,
            cur.viewMasterLeverAnimMs,
            cur.viewMasterInsertAnimMs,
            nowMs
          );

          const basePose = getBaseCameraPose(cur.cameraAngle, elapsed, 'view_master');
          _vec3TargetPos.copy(basePose.pos);
          _vec3TargetLook.copy(basePose.look);

          camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-5.2 * dt));
          camera.lookAt(_vec3TargetLook);
        } else if (cur.activeGame === 'guess_who') {
          // =================================================================
          // 4A. 3D GUESS WHO? GAMEPLAY & FOLDING PICTURE STANDS
          // =================================================================
          sorryBoardGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          highlightRings.forEach((r) => (r.visible = false));
          guessWhoGroup.visible = true;
          redTrayGroup.position.set(0, 0, 0.31);
          blueTrayGroup.position.set(0, 0, -0.31);

          const secretTex = charTextures.get(cur.guessWhoState.playerSecret.id);
          if (secretTex && playerMysteryFrontMat.map !== secretTex) {
            playerMysteryFrontMat.map = secretTex;
            playerMysteryFrontMat.needsUpdate = true;
          }

          const aiTex = charTextures.get(cur.guessWhoState.aiSecret.id);
          if (aiTex && aiMysteryFrontMat.map !== aiTex) {
            aiMysteryFrontMat.map = aiTex;
            aiMysteryFrontMat.needsUpdate = true;
          }
          aiMysteryCardMesh.rotation.y = cur.guessWhoState.winner ? Math.PI : 0;

          const curPlayerFoldCount = cur.guessWhoState.playerFoldedIds.length;
          const curAiFoldCount = cur.guessWhoState.aiFoldedIds.length;
          if (curPlayerFoldCount !== lastPlayerFoldCount) {
            const delta = Math.abs(curPlayerFoldCount - lastPlayerFoldCount);
            for (let c = 0; c < Math.min(delta, 6); c++) {
              soundFX.playStandFlipClack(c * 0.055);
            }
            lastPlayerFoldCount = curPlayerFoldCount;
            if (cur.followAction) {
              guessWhoZoomUntil = nowMs + 1250;
              guessWhoZoomTargetZ = 0.28;
            }
          }
          if (curAiFoldCount !== lastAiFoldCount) {
            const delta = Math.abs(curAiFoldCount - lastAiFoldCount);
            for (let c = 0; c < Math.min(delta, 6); c++) {
              soundFX.playStandFlipClack(c * 0.055);
            }
            lastAiFoldCount = curAiFoldCount;
            if (cur.followAction) {
              guessWhoZoomUntil = nowMs + 1250;
              guessWhoZoomTargetZ = -0.26;
            }
          }

          const pFolded = new Set(cur.guessWhoState.playerFoldedIds);
          playerStandPivots.forEach((pivot, charId) => {
            const targetRotX = pFolded.has(charId) ? -Math.PI * 0.47 : -0.16;
            pivot.rotation.x = THREE.MathUtils.damp(
              pivot.rotation.x,
              targetRotX,
              10,
              dt
            );
          });

          const aiFolded = new Set(cur.guessWhoState.aiFoldedIds);
          aiStandPivots.forEach((pivot, charId) => {
            const targetRotX = aiFolded.has(charId) ? -Math.PI * 0.47 : -0.16;
            pivot.rotation.x = THREE.MathUtils.damp(
              pivot.rotation.x,
              targetRotX,
              10,
              dt
            );
          });

          const basePose = getBaseCameraPose(cur.cameraAngle, elapsed, 'guess_who');
          _vec3TargetPos.copy(basePose.pos);
          _vec3TargetLook.copy(basePose.look);

          // Cinematic Camera Path Gently Panning Around the Tabletop During AI Turns!
          if (
            cur.followAction &&
            cur.cameraAngle !== 'fpv' &&
            cur.cameraAngle !== 'toy_chest'
          ) {
            if (cur.guessWhoState.turn === 'ai') {
              const panArc = Math.sin(elapsed * 1.4) * 0.34;
              _vec3TargetPos.set(panArc + 0.22, TABLE_SURFACE_Y + 0.48, 0.32);
              _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.05, -0.28);
              applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
            } else if (nowMs < guessWhoZoomUntil) {
              if (guessWhoZoomTargetZ > 0) {
                _vec3TargetPos.set(-0.04, TABLE_SURFACE_Y + 0.36, 0.68);
                _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.04, 0.28);
              } else {
                _vec3TargetPos.set(0.08, TABLE_SURFACE_Y + 0.44, 0.22);
                _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.04, -0.31);
              }
              applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
            }
          }

          camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-5.0 * dt));
          camera.lookAt(_vec3TargetLook);
        } else if (cur.activeGame === 'mouse_trap') {
          // =================================================================
          // 4B. 3D MOUSE TRAP POP-UP BOARD, FLOATING CHEESE & MOUSE CONTROL!
          // =================================================================
          sorryBoardGroup.visible = false;
          guessWhoGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          pawnMeshes.forEach((m) => (m.visible = false));
          highlightRings.forEach((r) => (r.visible = false));
          mouseTrapHandles.rootGroup.visible = true;

          const isMousePov = cur.cameraAngle === 'mouse_pov';
          let playerIsMoving = false;

          if (isMousePov) {
            const redTrapped = cur.mouseTrapState.mice.red.isTrapped;
            let moveForward = 0;
            let turnDelta = 0;
            if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) moveForward += 1;
            if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) moveForward -= 1;
            if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) turnDelta += 1;
            if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) turnDelta -= 1;

            if (turnDelta !== 0) {
              mouseControlState.yaw += turnDelta * 2.5 * dt;
            }

            if (moveForward !== 0) {
              if (redTrapped) {
                cameraTrauma = 0.18;
              } else {
                playerIsMoving = true;
                const speed = 0.36;
                const nx =
                  mouseControlState.localPos.x +
                  Math.sin(mouseControlState.yaw) * moveForward * speed * dt;
                const nz =
                  mouseControlState.localPos.z +
                  Math.cos(mouseControlState.yaw) * moveForward * speed * dt;
                const half = BOARD_WORLD_SIZE * 0.45;
                mouseControlState.localPos.x = THREE.MathUtils.clamp(nx, -half, half);
                mouseControlState.localPos.z = THREE.MathUtils.clamp(nz, -half, half);

                if (nowMs - mouseControlState.lastCheeseCollectMs > 650) {
                  for (const fc of mouseTrapHandles.floatingCheeses) {
                    const dist = Math.hypot(
                      mouseControlState.localPos.x - fc.baseLocalPos.x,
                      mouseControlState.localPos.z - fc.baseLocalPos.z
                    );
                    if (dist < 0.065) {
                      mouseControlState.lastCheeseCollectMs = nowMs;
                      soundFX.playCheeseCollect();
                      spawnBurstParticles(
                        new THREE.Vector3(
                          fc.baseLocalPos.x,
                          BOARD_SURFACE_Y + 0.05,
                          fc.baseLocalPos.z
                        ),
                        '#facc15',
                        14
                      );
                      cur.onCollectFloatingCheese();
                      break;
                    }
                  }
                }
              }
            }
          } else {
            const redSp =
              MOUSE_TRAP_SPACES[cur.mouseTrapState.mice.red.trackIndex] ??
              MOUSE_TRAP_SPACES[0];
            mouseControlState.localPos.set(
              redSp.u * BOARD_WORLD_SIZE,
              0.016,
              redSp.v * BOARD_WORLD_SIZE
            );
            mouseControlState.yaw = Math.atan2(
              -mouseControlState.localPos.x,
              -mouseControlState.localPos.z
            );
          }

          const sceneOut = mouseTrapHandles.updateLivingMouseTrapScene({
            elapsed,
            dt,
            state: cur.mouseTrapState,
            activeMouseStepAnim: cur.activeMouseStepAnim,
            chainReactionStartMs: cur.chainReactionStartMs,
            scenePulseStartMs: cur.scenePulseStartMs,
            nowMs,
            mouseControlMode: isMousePov,
            playerControlWorldPos: mouseControlState.localPos,
            playerControlYaw: mouseControlState.yaw,
            playerIsMoving,
          });

          if (isMousePov) {
            const yaw = mouseControlState.yaw + orbitControl.yawOffset;
            const mPos = sceneOut.redMouseWorldPos;
            _vec3TargetPos.set(
              mPos.x - Math.sin(yaw) * 0.16,
              mPos.y + 0.088,
              mPos.z - Math.cos(yaw) * 0.16
            );
            _vec3TargetLook.set(
              mPos.x + Math.sin(yaw) * 0.38,
              mPos.y + 0.065,
              mPos.z + Math.cos(yaw) * 0.38
            );
            camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-24 * dt));
            camera.lookAt(_vec3TargetLook);
          } else {
            const basePose = getBaseCameraPose(cur.cameraAngle, elapsed, 'mouse_trap');
            _vec3TargetPos.copy(basePose.pos);
            _vec3TargetLook.copy(basePose.look);

            if (
              cur.followAction &&
              cur.cameraAngle !== 'fpv' &&
              cur.cameraAngle !== 'toy_chest'
            ) {
              if (sceneOut.activeActionWorldPos) {
                const focus = sceneOut.activeActionWorldPos;
                const panTheta = elapsed * 0.75;
                _vec3TargetPos.set(
                  focus.x + Math.sin(panTheta) * 0.46,
                  TABLE_SURFACE_Y + 0.42,
                  focus.z + Math.cos(panTheta) * 0.48
                );
                _vec3TargetLook.set(focus.x, focus.y + 0.04, focus.z);
                applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
              } else if (cur.mouseTrapState.currentTurn !== 'red') {
                const aiColor = cur.mouseTrapState.currentTurn;
                const aiRig = mouseTrapHandles.mouseRigs.get(aiColor);
                if (aiRig) {
                  const aiPos = _vec3A;
                  aiRig.root.getWorldPosition(aiPos);
                  const orbitTheta = elapsed * 0.65;
                  _vec3TargetPos.set(
                    Math.sin(orbitTheta) * 0.78,
                    TABLE_SURFACE_Y + 0.54,
                    Math.cos(orbitTheta) * 0.78
                  );
                  _vec3TargetLook.set(aiPos.x * 0.5, TABLE_SURFACE_Y + 0.05, aiPos.z * 0.5);
                  applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
                }
              }
            }

            camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-5.0 * dt));
            camera.lookAt(_vec3TargetLook);
          }
        } else {
          // =================================================================
          // 4C. CLASSIC SORRY! GAMEPLAY & SELF-MOVING 3D PAWNS
          // =================================================================
          guessWhoGroup.visible = false;
          mouseTrapHandles.rootGroup.visible = false;
          viewMasterHandles.rootGroup.visible = false;
          sorryBoardGroup.visible = true;
          sorryBoardGroup.scale.set(1, 1, 1);
          sorryBoardGroup.rotation.y = 0;

          if (cur.gameState.currentCard) {
            discardCardMesh.visible = true;
            discardFrontMat.map = cardFrontTextures[cur.gameState.currentCard];
            discardFrontMat.needsUpdate = true;

            if (cur.gameState.currentCard !== lastCardShown) {
              lastCardShown = cur.gameState.currentCard;
              cardFlipStartTime = nowMs;
              flippingCardFrontMat.map = cardFrontTextures[cur.gameState.currentCard];
              flippingCardFrontMat.needsUpdate = true;
            }
          } else {
            discardCardMesh.visible = false;
          }

          let isCardFlipping = false;
          if (cardFlipStartTime > 0) {
            const flipT = (nowMs - cardFlipStartTime) / 420;
            if (flipT < 1) {
              isCardFlipping = true;
              flippingCardMesh.visible = true;
              flippingCardMesh.position.lerpVectors(deckPos, discardPos, flipT);
              flippingCardMesh.position.y =
                0.028 + Math.sin(flipT * Math.PI) * 0.14;
              flippingCardMesh.rotation.z = (1 - flipT) * Math.PI;
              flippingCardMesh.rotation.y = -0.18;
            } else {
              flippingCardMesh.visible = false;
              cardFlipStartTime = -1;
            }
          }

          highlightRings.forEach((r) => (r.visible = false));
          if (
            cur.gameState.turnPhase === 'move' &&
            cur.gameState.currentTurn === 'red' &&
            !cur.activeAnimation
          ) {
            const uniquePawnIds = Array.from(
              new Set(cur.gameState.legalMoves.map((m) => m.primaryPawnId))
            );
            uniquePawnIds.slice(0, highlightRings.length).forEach((pid, rIdx) => {
              const pState = cur.gameState.pawns.find((p) => p.id === pid);
              if (!pState) return;
              const ring = highlightRings[rIdx];
              const idxVal =
                pState.zone === 'track'
                  ? pState.trackIndex
                  : pState.zone === 'safety'
                  ? pState.safetyIndex
                  : pState.pawnIndex;
              const coord = getNormalizedBoardCoords(
                pState.zone,
                pState.color,
                idxVal,
                pState.pawnIndex
              );
              const wPos = boardUVToWorld(coord.u, coord.v, 0.003);
              ring.position.copy(wPos);
              const pulse = 1 + Math.sin(elapsed * 6) * 0.14;
              ring.scale.set(pulse, 1, pulse);
              ring.visible = true;
            });
          }

          for (const pState of cur.gameState.pawns) {
            const mesh = pawnMeshes.get(pState.id);
            if (!mesh) continue;
            mesh.visible = true;
            const idxVal =
              pState.zone === 'track'
                ? pState.trackIndex
                : pState.zone === 'safety'
                ? pState.safetyIndex
                : pState.pawnIndex;
            const coord = getNormalizedBoardCoords(
              pState.zone,
              pState.color,
              idxVal,
              pState.pawnIndex
            );
            mesh.position.copy(boardUVToWorld(coord.u, coord.v, 0));
            mesh.scale.set(1, 1, 1);
          }

          let cinematicFocusWorld: THREE.Vector3 | null = null;
          const anim = cur.activeAnimation;

          if (anim) {
            const steps = anim.move.primarySteps;
            const stepDurationMs =
              anim.move.isSorryStrike || anim.move.isSwap ? 520 : 210;
            const totalPrimaryMs = Math.max(1, steps.length) * stepDurationMs;
            const bumpMs = anim.move.bumpedPawns.length > 0 ? 450 : 0;
            const totalDurationMs = totalPrimaryMs + bumpMs;
            const elapsedAnimMs = nowMs - anim.startTime;

            const primaryPawn = cur.gameState.pawns.find(
              (p) => p.id === anim.move.primaryPawnId
            );
            const primaryMesh = pawnMeshes.get(anim.move.primaryPawnId);

            if (primaryPawn && primaryMesh && steps.length > 0) {
              const clampedMs = Math.min(elapsedAnimMs, totalPrimaryMs);
              const exactStepFloat = clampedMs / stepDurationMs;
              const stepIdx = Math.min(steps.length - 1, Math.floor(exactStepFloat));
              const stepFrac = Math.min(1, exactStepFloat - stepIdx);

              if (stepIdx !== lastStepSoundIndex) {
                lastStepSoundIndex = stepIdx;
                if (steps[stepIdx]?.isSlide) {
                  if (!playedSlideSoundForMove) {
                    playedSlideSoundForMove = true;
                    soundFX.playSlideWhoosh();
                  }
                } else {
                  soundFX.playPawnHop(stepIdx);
                }
              }

              const fromWp: StepWaypoint =
                stepIdx === 0
                  ? {
                      zone: primaryPawn.zone,
                      trackIndex: primaryPawn.trackIndex,
                      safetyIndex: primaryPawn.safetyIndex,
                    }
                  : steps[stepIdx - 1];
              const toWp = steps[stepIdx];

              const fromIdxVal =
                fromWp.zone === 'track'
                  ? fromWp.trackIndex
                  : fromWp.zone === 'safety'
                  ? fromWp.safetyIndex
                  : primaryPawn.pawnIndex;
              const toIdxVal =
                toWp.zone === 'track'
                  ? toWp.trackIndex
                  : toWp.zone === 'safety'
                  ? toWp.safetyIndex
                  : primaryPawn.pawnIndex;

              const cFrom = getNormalizedBoardCoords(
                fromWp.zone,
                primaryPawn.color,
                fromIdxVal,
                primaryPawn.pawnIndex
              );
              const cTo = getNormalizedBoardCoords(
                toWp.zone,
                primaryPawn.color,
                toIdxVal,
                primaryPawn.pawnIndex
              );

              const curU = THREE.MathUtils.lerp(cFrom.u, cTo.u, stepFrac);
              const curV = THREE.MathUtils.lerp(cFrom.v, cTo.v, stepFrac);
              const isSlideStep = Boolean(toWp.isSlide);
              const hopHeight = isSlideStep
                ? 0.008
                : anim.move.isSorryStrike
                ? Math.sin(stepFrac * Math.PI) * 0.16
                : Math.sin(stepFrac * Math.PI) * 0.068;

              const worldPos = boardUVToWorld(curU, curV, hopHeight);
              primaryMesh.position.copy(worldPos);
              cinematicFocusWorld = worldPos.clone();

              const stretch = isSlideStep
                ? 1.0
                : 1 + Math.sin(stepFrac * Math.PI) * 0.22;
              primaryMesh.scale.set(
                1 / Math.sqrt(stretch),
                stretch,
                1 / Math.sqrt(stretch)
              );

              if (isSlideStep && Math.random() < 0.45) {
                spawnBurstParticles(worldPos, PLAYER_META[primaryPawn.color].hex, 1);
              }
            }

            if (
              anim.move.secondaryPawnId &&
              anim.move.secondarySteps &&
              anim.move.secondarySteps.length > 0
            ) {
              const secPawn = cur.gameState.pawns.find(
                (p) => p.id === anim.move.secondaryPawnId
              );
              const secMesh = pawnMeshes.get(anim.move.secondaryPawnId);
              if (secPawn && secMesh) {
                const secFrac = Math.min(1, elapsedAnimMs / totalPrimaryMs);
                const lastSecWp =
                  anim.move.secondarySteps[anim.move.secondarySteps.length - 1];
                const cFrom = getNormalizedBoardCoords(
                  secPawn.zone,
                  secPawn.color,
                  secPawn.zone === 'track' ? secPawn.trackIndex : secPawn.safetyIndex,
                  secPawn.pawnIndex
                );
                const cTo = getNormalizedBoardCoords(
                  lastSecWp.zone,
                  secPawn.color,
                  lastSecWp.zone === 'track'
                    ? lastSecWp.trackIndex
                    : lastSecWp.safetyIndex,
                  secPawn.pawnIndex
                );
                const u = THREE.MathUtils.lerp(cFrom.u, cTo.u, secFrac);
                const v = THREE.MathUtils.lerp(cFrom.v, cTo.v, secFrac);
                const arc = Math.sin(secFrac * Math.PI) * 0.09;
                secMesh.position.copy(boardUVToWorld(u, v, arc));
              }
            }

            if (
              anim.move.bumpedPawns.length > 0 &&
              elapsedAnimMs >= totalPrimaryMs * 0.75
            ) {
              if (!playedBumpSoundForMove) {
                playedBumpSoundForMove = true;
                soundFX.playSorryBump();
                cameraTrauma = 0.35;
                if (cinematicFocusWorld) {
                  spawnBurstParticles(
                    cinematicFocusWorld,
                    PLAYER_META[anim.move.bumpedPawns[0].color].hex,
                    18
                  );
                }
              }

              const bumpFrac = Math.min(
                1,
                (elapsedAnimMs - totalPrimaryMs * 0.75) / Math.max(250, bumpMs)
              );
              for (const b of anim.move.bumpedPawns) {
                const victimMesh = pawnMeshes.get(b.pawnId);
                if (!victimMesh) continue;
                const cFrom = getNormalizedBoardCoords(
                  'track',
                  b.color,
                  b.fromTrackIndex,
                  b.pawnIndex
                );
                const cTo = getNormalizedBoardCoords(
                  'start',
                  b.color,
                  b.pawnIndex,
                  b.pawnIndex
                );
                const u = THREE.MathUtils.lerp(cFrom.u, cTo.u, bumpFrac);
                const v = THREE.MathUtils.lerp(cFrom.v, cTo.v, bumpFrac);
                const knockbackArc = Math.sin(bumpFrac * Math.PI) * 0.24;
                victimMesh.position.copy(boardUVToWorld(u, v, knockbackArc));
                victimMesh.rotation.z = bumpFrac * Math.PI * 2;
              }
            }

            if (elapsedAnimMs >= totalDurationMs && lastNotifiedMoveId !== anim.move.id) {
              lastNotifiedMoveId = anim.move.id;
              lastStepSoundIndex = -1;
              playedSlideSoundForMove = false;
              playedBumpSoundForMove = false;
              pawnMeshes.forEach((m) => (m.rotation.z = 0));
              if (anim.move.entersHome) {
                soundFX.playHomeChime();
              }
              cur.onAnimationFinished(anim.move);
            }
          } else {
            lastNotifiedMoveId = null;
            lastStepSoundIndex = -1;
            playedSlideSoundForMove = false;
            playedBumpSoundForMove = false;
          }

          const basePose = getBaseCameraPose(cur.cameraAngle, elapsed, 'sorry');
          _vec3TargetPos.copy(basePose.pos);
          _vec3TargetLook.copy(basePose.look);

          if (
            cur.followAction &&
            cur.cameraAngle !== 'fpv' &&
            cur.cameraAngle !== 'toy_chest'
          ) {
            const isAiTurn = cur.gameState.currentTurn !== 'red';
            const aiQuadrantAngle =
              cur.gameState.currentTurn === 'blue'
                ? Math.PI * 0.72
                : cur.gameState.currentTurn === 'yellow'
                ? Math.PI * 0.35
                : -Math.PI * 0.42;
            const gentlePanOffset = Math.sin(elapsed * 0.9) * 0.28;

            if (cinematicFocusWorld) {
              const panAngle = isAiTurn
                ? aiQuadrantAngle + gentlePanOffset
                : Math.atan2(cinematicFocusWorld.x, cinematicFocusWorld.z + 0.4);
              const camOffsetX = Math.sin(panAngle) * 0.52;
              const camOffsetZ = Math.cos(panAngle) * 0.52;

              _vec3TargetPos.set(
                cinematicFocusWorld.x * 0.65 + camOffsetX,
                TABLE_SURFACE_Y + 0.42,
                cinematicFocusWorld.z * 0.65 + camOffsetZ
              );
              _vec3TargetLook.copy(cinematicFocusWorld);
              applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
            } else if (isAiTurn) {
              const orbitTheta = aiQuadrantAngle + gentlePanOffset;
              _vec3TargetPos.set(
                Math.sin(orbitTheta) * 0.96,
                TABLE_SURFACE_Y + 0.62,
                Math.cos(orbitTheta) * 0.96
              );
              _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.02, 0);
              applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
            } else if (isCardFlipping) {
              _vec3TargetPos.set(0.08, TABLE_SURFACE_Y + 0.56, 0.58);
              _vec3TargetLook.set(0, TABLE_SURFACE_Y + 0.02, 0);
              applyUserOrbitAndZoom(_vec3TargetPos, _vec3TargetLook);
            }
          }

          const dampLambda = cinematicFocusWorld || isCardFlipping ? 6.5 : 3.8;
          camera.position.lerp(_vec3TargetPos, 1 - Math.exp(-dampLambda * dt));

          if (cameraTrauma > 0) {
            const shake = cameraTrauma * cameraTrauma * 0.04;
            camera.position.x += (Math.random() - 0.5) * shake;
            camera.position.y += (Math.random() - 0.5) * shake;
            cameraTrauma = Math.max(0, cameraTrauma - dt * 1.8);
          }

          camera.lookAt(_vec3TargetLook);
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="sorry-3d-canvas"
      className="fixed inset-0 w-full h-full overflow-hidden select-none"
    />
  );
};
