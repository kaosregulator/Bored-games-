import * as THREE from 'three';
import {
  VIEW_MASTER_REELS,
  VIEW_MASTER_REEL_ORDER,
  ViewMasterGameState,
  ViewMasterReelId,
  ViewMasterSlide,
} from './viewMasterRules';

// ============================================================================
// 1. 1990s PRODUCT STUDIO HDR ENVIRONMENT MAP GENERATOR
// ============================================================================

/**
 * Generates a procedural High-Dynamic-Range (FloatType) Equirectangular Studio Environment Map
 * with overhead softboxes, warm tungsten key diffuser, cool rim strip light, and studio floor bounce,
 * prefiltered via PMREMGenerator for soft 1990s tabletop product photography reflections.
 */
export function create1990sStudioHDREnvironment(
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  const width = 256;
  const height = 128;
  const data = new Float32Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1); // 0 = bottom, 1 = top (zenith)
    const theta = (1 - v) * Math.PI;

    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const phi = u * Math.PI * 2;

      // Base dark studio ambient gradient
      let r = 0.06 + v * 0.08;
      let g = 0.05 + v * 0.07;
      let b = 0.07 + v * 0.09;

      // 1. Overhead Warm Studio Softbox Bank (Zenith)
      if (v > 0.78 && Math.abs(Math.sin(phi)) < 0.75) {
        const soft = Math.pow((v - 0.78) / 0.22, 1.4);
        r += 4.8 * soft;
        g += 4.1 * soft;
        b += 3.2 * soft;
      }

      // 2. Front-Right Warm Key Diffuser Panel (1990s Commercial Tungsten Softbox)
      const keyDist = Math.hypot(u - 0.22, v - 0.62);
      if (keyDist < 0.18) {
        const k = Math.pow(1 - keyDist / 0.18, 2);
        r += 5.5 * k;
        g += 4.5 * k;
        b += 3.4 * k;
      }

      // 3. Back-Left Cool Studio Rim Strip Light
      const rimDist = Math.hypot(u - 0.72, v - 0.58);
      if (rimDist < 0.16) {
        const rm = Math.pow(1 - rimDist / 0.16, 2);
        r += 2.6 * rm;
        g += 3.8 * rm;
        b += 5.4 * rm;
      }

      // 4. Warm Walnut Tabletop Bounce from Below (Nadir)
      if (v < 0.28) {
        const bounce = (0.28 - v) / 0.28;
        r += 0.35 * bounce;
        g += 0.22 * bounce;
        b += 0.12 * bounce;
      }

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 1.0;
    }
  }

  const hdrTex = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  hdrTex.mapping = THREE.EquirectangularReflectionMapping;
  hdrTex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(hdrTex).texture;
  hdrTex.dispose();
  pmrem.dispose();

  return envMap;
}

// ============================================================================
// 2. 3D STEP2 LIFT & HIDE TOY CHEST (MATCHING UPLOADED REFERENCE PHOTO 1)
// ============================================================================

export interface Step2ToyChestHandles {
  rootGroup: THREE.Group;
  slidingBlueDoorGroup: THREE.Group;
  hitboxes: THREE.Object3D[];
  storedBoxMeshes: Map<'sorry' | 'guess_who' | 'mouse_trap' | 'view_master', THREE.Mesh>;
  updateToyChest: (dt: number, isOpen: boolean, activeGame: string) => void;
}

function createStep2LogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // White rounded border plate
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  // Iconic Step2 Red Square Badge
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(14, 14, 228, 228, 28);
  ctx.fill();

  ctx.save();
  ctx.translate(128, 122);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STEP', 0, -24);
  ctx.font = '900 88px "Bricolage Grotesque", sans-serif';
  ctx.fillText('2', 26, 42);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createViewMasterBoxLidTexture(
  maxAniso = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#dc2626');
  grad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, 476, 476);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIEW-MASTER', 256, 185);
  ctx.fillStyle = '#fde047';
  ctx.font = '900 54px "Bricolage Grotesque", sans-serif';
  ctx.fillText('3D VIEWER & REELS', 256, 265);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ANIMALS · SUPERCARS · SCENERY', 256, 350);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

const createViewMasterBoxTexture = createViewMasterBoxLidTexture;

/**
 * Builds the 1990s Step2 Lift & Hide Molded Toy Chest with its royal-blue 3-panel
 * sliding door and interior cavity that stores all the 3D game boxes right beside the table.
 */
export function buildStep2ToyChest3D(
  boxTextures: {
    sorry: THREE.Texture;
    guess_who: THREE.Texture;
    mouse_trap: THREE.Texture;
    view_master?: THREE.Texture;
  },
  isSoftwareGl: boolean
): Step2ToyChestHandles {
  const rootGroup = new THREE.Group();
  // Positioned right beside the table on the left side, angled slightly toward the viewer
  rootGroup.position.set(-1.32, 0, -0.08);
  rootGroup.rotation.y = Math.PI * 0.34;

  const hitboxes: THREE.Object3D[] = [];

  // Roto-molded warm beige/taupe plastic material matching reference image 1
  const beigePlasticMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8c2b4,
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.28,
    clearcoatRoughness: 0.35,
  });

  // Iconic Step2 royal blue sliding door plastic material
  const blueDoorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0058d6,
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });

  const blueRecessMat = new THREE.MeshPhysicalMaterial({
    color: 0x0046ad,
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.5,
  });

  const darkInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x181512,
    roughness: 0.85,
  });

  // 1. Lower Storage Bin Base (width: 0.88m, height: 0.34m, depth: 0.54m)
  const lowerBin = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.32, 0.54),
    beigePlasticMat
  );
  lowerBin.position.set(0, 0.16, 0);
  lowerBin.castShadow = !isSoftwareGl;
  lowerBin.receiveShadow = !isSoftwareGl;
  lowerBin.userData = { type: 'toy_chest_toggle' };
  rootGroup.add(lowerBin);
  hitboxes.push(lowerBin);

  // Horizontal molded seam groove across the front fascia
  const frontFasciaBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.09, 0.56),
    beigePlasticMat
  );
  frontFasciaBar.position.set(0, 0.33, 0);
  frontFasciaBar.castShadow = !isSoftwareGl;
  frontFasciaBar.userData = { type: 'toy_chest_toggle' };
  rootGroup.add(frontFasciaBar);
  hitboxes.push(frontFasciaBar);

  // Red Square "STEP 2" Logo Badge centered on the front lower seam
  const step2Badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.088),
    new THREE.MeshStandardMaterial({
      map: createStep2LogoTexture(),
      roughness: 0.25,
    })
  );
  step2Badge.position.set(0, 0.285, 0.282);
  step2Badge.userData = { type: 'toy_chest_toggle' };
  rootGroup.add(step2Badge);
  hitboxes.push(step2Badge);

  // 2. Dark Hollow Storage Cavity Inside the Toy Chest (where the game boxes sit!)
  const interiorWell = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.34, 0.34),
    darkInteriorMat
  );
  interiorWell.position.set(0, 0.45, -0.07);
  rootGroup.add(interiorWell);

  // 3. Sloped Side Pillars & Back Wall of Upper Toy Chest Hutch
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.44, 0.52),
      beigePlasticMat
    );
    pillar.position.set(side * 0.395, 0.54, -0.01);
    pillar.rotation.x = -0.14;
    pillar.castShadow = !isSoftwareGl;
    pillar.userData = { type: 'toy_chest_toggle' };
    rootGroup.add(pillar);
    hitboxes.push(pillar);
  }

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.46, 0.08),
    beigePlasticMat
  );
  backWall.position.set(0, 0.55, -0.24);
  backWall.castShadow = !isSoftwareGl;
  rootGroup.add(backWall);

  // 4. Recessed Top Display Shelf Rim (matching the top tray of the Step2 chest)
  const topShelfFloor = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.045, 0.48),
    beigePlasticMat
  );
  topShelfFloor.position.set(0, 0.77, -0.03);
  topShelfFloor.castShadow = !isSoftwareGl;
  topShelfFloor.receiveShadow = !isSoftwareGl;
  topShelfFloor.userData = { type: 'toy_chest_toggle' };
  rootGroup.add(topShelfFloor);
  hitboxes.push(topShelfFloor);

  // Raised molded rim around the top shelf (back + left + right)
  const backRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.045, 0.045),
    beigePlasticMat
  );
  backRim.position.set(0, 0.805, -0.25);
  rootGroup.add(backRim);

  for (const side of [-1, 1]) {
    const sideRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.045, 0.48),
      beigePlasticMat
    );
    sideRim.position.set(side * 0.41, 0.805, -0.03);
    rootGroup.add(sideRim);
  }

  // 5. Royal-Blue 3-Panel Sliding Door (`slidingBlueDoorGroup`)
  // When closed (progress = 0): sits across the sloped front opening at (0, 0.55, 0.195), rotation.x = -0.32
  // When slid open (progress = 1): lifts up and slides back under the top shelf at (0, 0.73, -0.04), rotation.x = -Math.PI / 2!
  const slidingBlueDoorGroup = new THREE.Group();
  slidingBlueDoorGroup.position.set(0, 0.55, 0.195);
  slidingBlueDoorGroup.rotation.x = -0.32;
  rootGroup.add(slidingBlueDoorGroup);

  const doorSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.71, 0.36, 0.032),
    blueDoorMat
  );
  doorSlab.castShadow = !isSoftwareGl;
  doorSlab.receiveShadow = !isSoftwareGl;
  doorSlab.userData = { type: 'toy_chest_toggle' };
  slidingBlueDoorGroup.add(doorSlab);
  hitboxes.push(doorSlab);

  // 3 Vertical Recessed Rectangular Panels on the Blue Door (exact match to photo!)
  for (const px of [-0.21, 0, 0.21]) {
    const panelFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.24, 0.012),
      blueRecessMat
    );
    panelFrame.position.set(px, 0.02, 0.014);
    panelFrame.userData = { type: 'toy_chest_toggle' };
    slidingBlueDoorGroup.add(panelFrame);
    hitboxes.push(panelFrame);
  }

  // Molded Oval Handle Pocket at bottom-center of the Blue Door
  const handlePocket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.075, 14).rotateZ(Math.PI / 2),
    blueRecessMat
  );
  handlePocket.position.set(0, -0.135, 0.016);
  handlePocket.userData = { type: 'toy_chest_toggle' };
  slidingBlueDoorGroup.add(handlePocket);
  hitboxes.push(handlePocket);

  // 6. Stored 3D Game Boxes Inside the Step2 Toy Chest!
  // Clicking any stored game box inside the open Toy Chest switches to that game!
  const storedBoxMeshes = new Map<
    'sorry' | 'guess_who' | 'mouse_trap' | 'view_master',
    THREE.Mesh
  >();
  const viewMasterBoxTex = boxTextures.view_master ?? createViewMasterBoxTexture();
  const boxSideCardboard = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
  });

  const gameConfigs: {
    id: 'sorry' | 'guess_who' | 'mouse_trap' | 'view_master';
    tex: THREE.Texture;
    x: number;
  }[] = [
    { id: 'sorry', tex: boxTextures.sorry, x: -0.24 },
    { id: 'guess_who', tex: boxTextures.guess_who, x: -0.08 },
    { id: 'mouse_trap', tex: boxTextures.mouse_trap, x: 0.08 },
    { id: 'view_master', tex: viewMasterBoxTex, x: 0.24 },
  ];

  for (const cfg of gameConfigs) {
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cfg.tex,
      roughness: 0.32,
    });
    const boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.25, 0.22),
      [
        boxSideCardboard,
        boxSideCardboard,
        coverMat,
        boxSideCardboard,
        coverMat,
        coverMat,
      ]
    );
    boxMesh.position.set(cfg.x, 0.44, -0.04);
    boxMesh.rotation.x = -0.25;
    boxMesh.castShadow = !isSoftwareGl;
    boxMesh.userData = { type: 'toy_chest_box', gameId: cfg.id };
    rootGroup.add(boxMesh);
    storedBoxMeshes.set(cfg.id, boxMesh);
    hitboxes.push(boxMesh);
  }

  let slideProgress = 0;

  const updateToyChest = (dt: number, isOpen: boolean, activeGame: string) => {
    const target = isOpen ? 1 : 0;
    slideProgress = THREE.MathUtils.damp(slideProgress, target, 16, Math.max(dt, 0.035));
    if (Math.abs(target - slideProgress) < 0.015) {
      slideProgress = target;
    }

    // Phase 1 (0..0.45): Lift the blue door up & tilt flat under the top shelf
    // Phase 2 (0.25..1.0): Slide the blue door horizontally back into the upper recess pocket!
    const liftT = THREE.MathUtils.smoothstep(slideProgress, 0.0, 0.48);
    const retractT = THREE.MathUtils.smoothstep(slideProgress, 0.22, 1.0);

    slidingBlueDoorGroup.position.set(
      0,
      THREE.MathUtils.lerp(0.55, 0.75, liftT),
      THREE.MathUtils.lerp(0.195, -0.18, retractT)
    );
    slidingBlueDoorGroup.rotation.x = THREE.MathUtils.lerp(
      -0.32,
      -Math.PI * 0.48,
      liftT
    );
    // Tuck deeper into the pocket as it finishes retracting so the top-down view into the bin is wide open
    slidingBlueDoorGroup.scale.set(
      1,
      THREE.MathUtils.lerp(1, 0.28, retractT),
      1
    );

    // Raise and angle the 4 stored 3D game boxes forward when the chest slides open so the player can see & click them!
    storedBoxMeshes.forEach((mesh, gameId) => {
      const isCurrent = gameId === activeGame;
      const targetY = isCurrent
        ? 0.52 + slideProgress * 0.05
        : 0.48 + slideProgress * 0.08;
      const targetZ = THREE.MathUtils.lerp(-0.05, 0.06, slideProgress);
      mesh.position.y = targetY;
      mesh.position.z = targetZ;
      mesh.visible = slideProgress > 0.08;
    });
  };

  return {
    rootGroup,
    slidingBlueDoorGroup,
    hitboxes,
    storedBoxMeshes,
    updateToyChest,
  };
}

// ============================================================================
// 3. 3D RED VIEW-MASTER VIEWER & 14-WINDOW CIRCULAR REELS (PHOTO 2)
// ============================================================================

/**
 * Renders a rich, multi-layered Kodachrome View-Master slide scene (Animals, Supercars, Scenery)
 * with optional binocular stereoscopic horizontal parallax (`eyeOffset: -1 | 0 | 1`).
 */
export function renderViewMasterSlideToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slide: ViewMasterSlide,
  eyeOffset: number = 0
) {
  ctx.save();

  // 1. Sky Gradient Background (Far Layer)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.68);
  skyGrad.addColorStop(0, slide.skyTopHex);
  skyGrad.addColorStop(1, slide.skyBottomHex);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const pxFar = eyeOffset * 4;
  const pxMid = eyeOffset * 11;
  const pxNear = eyeOffset * 20;

  // Sun / Moon / Celestial Disc in Sky
  ctx.fillStyle = 'rgba(254, 240, 138, 0.88)';
  ctx.beginPath();
  ctx.arc(w * 0.74 + pxFar, h * 0.24, Math.min(w, h) * 0.11, 0, Math.PI * 2);
  ctx.fill();

  // 2. Distant Mountains / Horizon Silhouette (Mid-Far Layer)
  ctx.fillStyle = slide.secondaryHex;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.65);
  ctx.lineTo(w * 0.22 + pxFar, h * 0.38);
  ctx.lineTo(w * 0.48 + pxFar, h * 0.54);
  ctx.lineTo(w * 0.76 + pxFar, h * 0.34);
  ctx.lineTo(w, h * 0.58);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 3. Foreground Terrain / Roadway / Lagoon (Mid Layer)
  ctx.fillStyle = slide.groundHex;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  const cx = w * 0.5 + pxNear;
  const cy = h * 0.62;

  // 4. Subject-Specific Stereoscopic Foreground Artwork (Near Layer with strong 3D parallax!)
  if (
    slide.subjectType === 'ferrari_red' ||
    slide.subjectType === 'lambo_yellow' ||
    slide.subjectType === 'viper_blue' ||
    slide.subjectType === 'porsche_silver' ||
    slide.subjectType === 'mclaren_orange' ||
    slide.subjectType === 'corvette_teal' ||
    slide.subjectType === 'concept_neon'
  ) {
    // Perspective Highway Asphalt & Dashed Center Line
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(w * 0.38 + pxMid, h * 0.62);
    ctx.lineTo(w * 0.62 + pxMid, h * 0.62);
    ctx.lineTo(w * 0.98, h);
    ctx.lineTo(w * 0.02, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + pxMid, h * 0.62);
    ctx.lineTo(w * 0.5 + pxNear, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sleek 1990s Exotic Supercar Silhouette & Glossy Bodywork
    const carW = w * 0.58;
    const carH = h * 0.22;
    ctx.save();
    ctx.translate(cx, cy + h * 0.06);

    // Contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, carH * 0.42, carW * 0.52, carH * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear spoiler wing
    ctx.fillStyle = slide.accentHex;
    ctx.fillRect(-carW * 0.46, -carH * 0.52, carW * 0.12, carH * 0.32);
    ctx.fillRect(-carW * 0.5, -carH * 0.58, carW * 0.2, carH * 0.09);

    // Aerodynamic Wedge Body
    ctx.beginPath();
    ctx.moveTo(-carW * 0.48, carH * 0.28);
    ctx.lineTo(-carW * 0.44, -carH * 0.22);
    ctx.lineTo(-carW * 0.16, -carH * 0.26);
    ctx.lineTo(carW * 0.06, -carH * 0.62);
    ctx.lineTo(carW * 0.34, -carH * 0.18);
    ctx.lineTo(carW * 0.5, carH * 0.12);
    ctx.lineTo(carW * 0.46, carH * 0.32);
    ctx.closePath();
    ctx.fillStyle = slide.accentHex;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Racing Stripes (for Viper / Concept)
    if (slide.subjectType === 'viper_blue' || slide.subjectType === 'concept_neon') {
      ctx.fillStyle = slide.secondaryHex;
      ctx.fillRect(-carW * 0.35, -carH * 0.2, carW * 0.72, carH * 0.1);
    }

    // Tinted Cockpit Canopy Glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-carW * 0.12, -carH * 0.22);
    ctx.lineTo(carW * 0.05, -carH * 0.54);
    ctx.lineTo(carW * 0.28, -carH * 0.18);
    ctx.closePath();
    ctx.fill();

    // Headlight beam & Alloy Wheels
    for (const wx of [-carW * 0.28, carW * 0.28]) {
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      ctx.arc(wx, carH * 0.28, carH * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(wx, carH * 0.28, carH * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (
    slide.subjectType === 'lion' ||
    slide.subjectType === 'dolphin' ||
    slide.subjectType === 'panda' ||
    slide.subjectType === 'eagle' ||
    slide.subjectType === 'tiger' ||
    slide.subjectType === 'penguin' ||
    slide.subjectType === 'frog'
  ) {
    // Wildlife Safari / Ocean Foreground Subject
    ctx.save();
    ctx.translate(cx, cy + h * 0.02);

    if (slide.subjectType === 'lion' || slide.subjectType === 'tiger') {
      // Majestic Lion Mane or Tiger Head & Shoulders on Foreground Rock
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -18, w * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = slide.accentHex;
      ctx.beginPath();
      ctx.arc(0, -18, w * 0.13, 0, Math.PI * 2);
      ctx.fill();

      // Ears & Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-w * 0.045, -28, 7, 0, Math.PI * 2);
      ctx.arc(w * 0.045, -28, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      ctx.arc(0, -8, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (slide.subjectType === 'dolphin') {
      // Twin Leaping Dolphins over Ocean Spray
      for (const [dx, dy, rot] of [
        [-w * 0.12, -h * 0.18, -0.35],
        [w * 0.14, -h * 0.1, 0.25],
      ]) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(rot);
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.16, h * 0.055, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (slide.subjectType === 'panda') {
      // Giant Panda with Black Eye Patches & Ears + Bamboo Stalks
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, -h * 0.35);
      ctx.lineTo(-w * 0.24, h * 0.25);
      ctx.moveTo(w * 0.26, -h * 0.35);
      ctx.lineTo(w * 0.26, h * 0.25);
      ctx.stroke();

      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      ctx.arc(-w * 0.09, -h * 0.18, 22, 0, Math.PI * 2);
      ctx.arc(w * 0.09, -h * 0.18, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -h * 0.08, w * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      ctx.ellipse(-w * 0.05, -h * 0.1, 16, 12, -0.3, 0, Math.PI * 2);
      ctx.ellipse(w * 0.05, -h * 0.1, 16, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Soaring Eagle / Penguin / Tree Frog Foreground Emblem
      ctx.fillStyle = slide.accentHex;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.12, w * 0.22, h * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -h * 0.16, w * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else {
    // World Scenery & Wonders (Grand Canyon, Mt. Fuji, Yosemite, Aurora, Matterhorn, Reef, Monument Valley)
    ctx.save();
    ctx.translate(cx, cy);

    // Dramatic Foreground Canyon Butte / Snow Peak / Pagoda Silhouette
    ctx.fillStyle = slide.accentHex;
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, h * 0.18);
    ctx.lineTo(-w * 0.08, -h * 0.32);
    ctx.lineTo(w * 0.08, -h * 0.32);
    ctx.lineTo(w * 0.28, h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Snow Cap or Golden Rim Highlight
    ctx.fillStyle = slide.secondaryHex;
    ctx.beginPath();
    ctx.moveTo(-w * 0.08, -h * 0.32);
    ctx.lineTo(w * 0.08, -h * 0.32);
    ctx.lineTo(w * 0.14, -h * 0.14);
    ctx.lineTo(-w * 0.14, -h * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 5. Classic Kodachrome Film Grain & Slide Frame Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.62);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Slide Code Stamp in Top-Left Corner
  ctx.fillStyle = '#fde047';
  ctx.font = '900 22px "Bricolage Grotesque", sans-serif';
  ctx.fillText(slide.code, 22, 34);

  ctx.restore();
}

/**
 * Generates the authentic white circular 14-window View-Master Cardboard Reel texture
 * matching uploaded reference photo 2 (`shopping_d18beca8.webp`).
 */
function createCircularReelTexture(reelId: ViewMasterReelId): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  const meta = VIEW_MASTER_REELS[reelId];

  // Off-white vintage die-cut cardboard disc
  ctx.fillStyle = '#f8faf5';
  ctx.beginPath();
  ctx.arc(cx, cy, 244, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // 14 Rectangular Dark Film Transparency Windows around the perimeter + perimeter edge notches
  const numWindows = 14;
  for (let i = 0; i < numWindows; i++) {
    const angle = (i / numWindows) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Outer perimeter index notch (metal advance pawl teeth)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -244, 12, 16);

    // Rounded rectangular Kodachrome transparency window
    const slide = meta.slides[i % meta.slides.length];
    ctx.fillStyle = '#180e0c';
    ctx.beginPath();
    ctx.roundRect(-24, -214, 48, 36, 5);
    ctx.fill();

    // Subtle colored film tint inside each window
    ctx.fillStyle = slide.accentHex;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(-20, -210, 40, 28);
    ctx.globalAlpha = 1.0;

    // Radial slide title text pointing inward toward center
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, 0, -162);
    ctx.restore();
  }

  // Center View-Master Reel Title & Upward Insertion Arrow
  ctx.fillStyle = meta.badgeColor;
  ctx.font = '900 18px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(meta.title.toUpperCase(), cx, cy - 58);

  ctx.fillStyle = '#334155';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(meta.serialCode, cx, cy + 68);

  // Upward Insertion Arrow at top of inner ring
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 135);
  ctx.lineTo(cx, cy - 95);
  ctx.moveTo(cx - 10, cy - 122);
  ctx.lineTo(cx, cy - 135);
  ctx.lineTo(cx + 10, cy - 122);
  ctx.stroke();

  // Center Brass/Steel Drive Hub Ring
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export interface ViewMaster3DSceneHandles {
  rootGroup: THREE.Group;
  viewerGroup: THREE.Group;
  orangeLeverPivot: THREE.Group;
  insertedReelMesh: THREE.Mesh;
  tableReelMeshes: Map<ViewMasterReelId, THREE.Mesh>;
  hitboxes: THREE.Object3D[];
  updateViewMaster3D: (
    dt: number,
    elapsed: number,
    state: ViewMasterGameState,
    leverPullAnimTimeMs: number | null,
    reelInsertAnimTimeMs: number | null,
    nowMs: number
  ) => void;
}

/**
 * Builds the 3D Red View-Master Stereoscopic Viewer, Orange Advance Lever,
 * Top Inserted Reel, Backlit Slide Preview Window, and 3 Table Reels (`Animals`, `Cars`, `Scenery`).
 */
export function buildViewMaster3DScene(
  isSoftwareGl: boolean
): ViewMaster3DSceneHandles {
  const rootGroup = new THREE.Group();
  const hitboxes: THREE.Object3D[] = [];

  // Glossy 1990s View-Master Red Plastic Material
  const vmRedPlastic = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    roughness: 0.18,
    metalness: 0.03,
    clearcoat: 0.92,
    clearcoatRoughness: 0.1,
  });

  // Iconic Orange Advance Lever Plastic Material
  const vmOrangePlastic = new THREE.MeshPhysicalMaterial({
    color: 0xf97316,
    roughness: 0.22,
    metalness: 0.02,
    clearcoat: 0.85,
  });

  // Dark Recessed Lens Visor Material
  const darkLensVisorMat = new THREE.MeshPhysicalMaterial({
    color: 0x111318,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.95,
  });

  // =========================================================================
  // 1. SCULPTED RED 3D VIEW-MASTER VIEWER BODY (CENTER-BACK OF TABLE)
  // =========================================================================
  const viewerGroup = new THREE.Group();
  viewerGroup.position.set(0, 0.19, -0.08);
  rootGroup.add(viewerGroup);

  // Main Sculpted Red Visor Housing
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.31, 0.16),
    vmRedPlastic
  );
  mainBody.castShadow = !isSoftwareGl;
  mainBody.receiveShadow = !isSoftwareGl;
  mainBody.userData = { type: 'view_master_body' };
  viewerGroup.add(mainBody);
  hitboxes.push(mainBody);

  // Ergonomic Brow Ridge Lobes on Top-Left & Top-Right (matching photo 2!)
  for (const sx of [-0.13, 0.13]) {
    const lobe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.082, 0.158, 20).rotateX(Math.PI / 2),
      vmRedPlastic
    );
    lobe.position.set(sx, 0.125, 0);
    lobe.scale.set(1.15, 0.65, 1);
    lobe.castShadow = !isSoftwareGl;
    viewerGroup.add(lobe);
  }

  // Dark Recessed Binocular Eye Bar Across the Front (matching photo 2!)
  const visorHood = new THREE.Mesh(
    new THREE.BoxGeometry(0.435, 0.11, 0.065),
    vmRedPlastic
  );
  visorHood.position.set(0, 0.015, 0.068);
  viewerGroup.add(visorHood);

  const darkEyeBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.395, 0.086, 0.045),
    darkLensVisorMat
  );
  darkEyeBar.position.set(0, 0.015, 0.085);
  darkEyeBar.userData = { type: 'view_master_eyepiece' };
  viewerGroup.add(darkEyeBar);
  hitboxes.push(darkEyeBar);

  // Twin Square Binocular Glass Lenses inside the Dark Eye Bar
  const lensGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7f1d1d,
    roughness: 0.05,
    metalness: 0.2,
    clearcoat: 1.0,
    emissive: 0x450a0a,
    emissiveIntensity: 0.35,
  });
  for (const lx of [-0.11, 0.11]) {
    const lens = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.058, 0.015),
      lensGlassMat
    );
    lens.position.set(lx, 0.015, 0.105);
    lens.userData = { type: 'view_master_eyepiece' };
    viewerGroup.add(lens);
    hitboxes.push(lens);
  }

  // Top-Left Square "3D" Emblem Badge & Lower "View-Master" Script Logo Plate
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 128;
  const lCtx = logoCanvas.getContext('2d')!;
  lCtx.fillStyle = '#dc2626';
  lCtx.fillRect(0, 0, 512, 128);
  lCtx.font = '900 74px "Bricolage Grotesque", sans-serif';
  lCtx.textAlign = 'center';
  lCtx.textBaseline = 'middle';
  lCtx.strokeStyle = '#ffffff';
  lCtx.lineWidth = 16;
  lCtx.strokeText('View-Master', 256, 66);
  lCtx.fillStyle = '#dc2626';
  lCtx.fillText('View-Master', 256, 66);
  const vmLogoTex = new THREE.CanvasTexture(logoCanvas);
  vmLogoTex.colorSpace = THREE.SRGBColorSpace;

  const vmLogoPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.055),
    new THREE.MeshStandardMaterial({ map: vmLogoTex, roughness: 0.25 })
  );
  vmLogoPlate.position.set(-0.04, -0.095, 0.082);
  viewerGroup.add(vmLogoPlate);

  // Top-Left "3D" Raised Badge
  const badge3DCanvas = document.createElement('canvas');
  badge3DCanvas.width = 128;
  badge3DCanvas.height = 128;
  const bCtx = badge3DCanvas.getContext('2d')!;
  bCtx.fillStyle = '#b91c1c';
  bCtx.fillRect(0, 0, 128, 128);
  bCtx.strokeStyle = '#ffffff';
  bCtx.lineWidth = 8;
  bCtx.strokeRect(8, 8, 112, 112);
  bCtx.fillStyle = '#ffffff';
  bCtx.font = '900 64px "Bricolage Grotesque", sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('3D', 64, 68);
  const badge3DTex = new THREE.CanvasTexture(badge3DCanvas);
  badge3DTex.colorSpace = THREE.SRGBColorSpace;

  const badge3DMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.052, 0.012),
    new THREE.MeshStandardMaterial({ map: badge3DTex, roughness: 0.25 })
  );
  badge3DMesh.position.set(-0.145, 0.12, 0.081);
  viewerGroup.add(badge3DMesh);

  // =========================================================================
  // 2. ICONIC ORANGE CIRCULAR ADVANCE LEVER (CLICK TO ADVANCE SLIDE!)
  // =========================================================================
  const orangeLeverPivot = new THREE.Group();
  orangeLeverPivot.position.set(-0.205, 0.04, 0.0);
  viewerGroup.add(orangeLeverPivot);

  const leverArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.028, 0.018),
    vmOrangePlastic
  );
  leverArm.position.set(-0.038, 0.055, 0);
  leverArm.rotation.z = 0.65;
  leverArm.castShadow = !isSoftwareGl;
  leverArm.userData = { type: 'view_master_lever' };
  orangeLeverPivot.add(leverArm);
  hitboxes.push(leverArm);

  const leverFingerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.018, 24).rotateX(Math.PI / 2),
    vmOrangePlastic
  );
  leverFingerDisc.position.set(-0.075, 0.095, 0);
  leverFingerDisc.castShadow = !isSoftwareGl;
  leverFingerDisc.userData = { type: 'view_master_lever' };
  orangeLeverPivot.add(leverFingerDisc);
  hitboxes.push(leverFingerDisc);

  // Recessed rim on the orange finger disc
  const leverRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.005, 10, 24),
    vmOrangePlastic
  );
  leverRim.position.set(-0.075, 0.095, 0.008);
  leverRim.userData = { type: 'view_master_lever' };
  orangeLeverPivot.add(leverRim);

  // =========================================================================
  // 3. TOP SLOTTED WHITE CIRCULAR REEL + LIVE BACKLIT 3D SLIDE STAGE
  // =========================================================================
  const reelTextures: Record<ViewMasterReelId, THREE.CanvasTexture> = {
    animals: createCircularReelTexture('animals'),
    cars: createCircularReelTexture('cars'),
    scenery: createCircularReelTexture('scenery'),
  };

  const insertedReelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: reelTextures.animals,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });

  const insertedReelGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.006, 36);
  insertedReelGeo.rotateX(Math.PI / 2);
  const insertedReelMesh = new THREE.Mesh(insertedReelGeo, insertedReelMat);
  insertedReelMesh.position.set(0, 0.145, -0.01);
  insertedReelMesh.castShadow = !isSoftwareGl;
  insertedReelMesh.userData = { type: 'view_master_lever' };
  viewerGroup.add(insertedReelMesh);
  hitboxes.push(insertedReelMesh);

  // Live Backlit Stereoscopic Slide Preview Screen floating above/behind the viewer on the tabletop
  const slideCanvas = document.createElement('canvas');
  slideCanvas.width = 512;
  slideCanvas.height = 384;
  const slideCtx = slideCanvas.getContext('2d')!;
  const liveSlideTexture = new THREE.CanvasTexture(slideCanvas);
  liveSlideTexture.colorSpace = THREE.SRGBColorSpace;

  const backlitStageFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.28, 0.016),
    darkLensVisorMat
  );
  backlitStageFrame.position.set(0, 0.36, -0.14);
  viewerGroup.add(backlitStageFrame);

  const backlitSlideScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.25),
    new THREE.MeshBasicMaterial({ map: liveSlideTexture })
  );
  backlitSlideScreen.position.set(0, 0.36, -0.13);
  backlitSlideScreen.userData = { type: 'view_master_eyepiece' };
  viewerGroup.add(backlitSlideScreen);
  hitboxes.push(backlitSlideScreen);

  // =========================================================================
  // 4. 3 INTERACTIVE CIRCULAR WHITE REELS LAID OUT ON THE WOOD TABLE (PHOTO 2!)
  // =========================================================================
  const tableReelMeshes = new Map<ViewMasterReelId, THREE.Mesh>();
  const reelPositions: Record<ViewMasterReelId, [number, number]> = {
    animals: [-0.34, 0.27],
    cars: [0.0, 0.31],
    scenery: [0.34, 0.27],
  };

  for (const reelId of VIEW_MASTER_REEL_ORDER) {
    const [rx, rz] = reelPositions[reelId];
    const rMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: reelTextures[reelId],
      roughness: 0.32,
    });
    const rMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.006, 36),
      rMat
    );
    rMesh.position.set(rx, 0.012, rz);
    rMesh.castShadow = !isSoftwareGl;
    rMesh.receiveShadow = !isSoftwareGl;
    rMesh.userData = { type: 'view_master_reel', reelId };
    rootGroup.add(rMesh);
    tableReelMeshes.set(reelId, rMesh);
    hitboxes.push(rMesh);
  }

  let lastRenderedKey = '';
  let currentWheelRad = 0;

  const updateViewMaster3D: ViewMaster3DSceneHandles['updateViewMaster3D'] = (
    dt,
    elapsed,
    state,
    leverPullAnimTimeMs,
    reelInsertAnimTimeMs,
    nowMs
  ) => {
    // 1. Update Inserted Reel Texture & Live Backlit Slide Screen when slide or reel changes
    const renderKey = `${state.activeReelId}-${state.currentSlideIndex}`;
    if (renderKey !== lastRenderedKey) {
      lastRenderedKey = renderKey;
      insertedReelMat.map = reelTextures[state.activeReelId];
      insertedReelMat.needsUpdate = true;

      const reelMeta = VIEW_MASTER_REELS[state.activeReelId];
      const slide = reelMeta.slides[state.currentSlideIndex] ?? reelMeta.slides[0];
      renderViewMasterSlideToCanvas(slideCtx, 512, 384, slide, 0);
      liveSlideTexture.needsUpdate = true;
    }

    // 2. Smoothly Rotate the Inserted 14-Window Circular Reel by 25.71° per lever click!
    const targetWheelRad = THREE.MathUtils.degToRad(state.wheelRotationDeg);
    currentWheelRad = THREE.MathUtils.damp(
      currentWheelRad,
      targetWheelRad,
      11,
      dt
    );
    insertedReelMesh.rotation.z = currentWheelRad;

    // 3. Animate the Reel Sliding Into the Top Slot of the Red Viewer!
    if (reelInsertAnimTimeMs !== null) {
      const insT = Math.min(1, (nowMs - reelInsertAnimTimeMs) / 520);
      const ease = THREE.MathUtils.smoothstep(insT, 0, 1);
      insertedReelMesh.position.y = THREE.MathUtils.lerp(0.34, 0.145, ease);
      insertedReelMesh.position.z =
        -0.01 + Math.sin(insT * Math.PI) * 0.06;
    } else {
      insertedReelMesh.position.set(0, 0.145, -0.01);
    }

    // 4. Animate the Orange Advance Lever Down-Stroke & Spring Return ("KA-CHUNK!")
    if (leverPullAnimTimeMs !== null) {
      const levT = (nowMs - leverPullAnimTimeMs) / 340;
      if (levT < 1) {
        const pullCurve = Math.sin(levT * Math.PI);
        orangeLeverPivot.rotation.z = pullCurve * 0.62;
      } else {
        orangeLeverPivot.rotation.z = 0;
      }
    } else {
      // Subtle idle invitation bob on the orange lever
      orangeLeverPivot.rotation.z = Math.sin(elapsed * 2.5) * 0.04;
    }

    // 5. Highlight the active Reel on the table (slightly raised & spinning gently)
    for (const reelId of VIEW_MASTER_REEL_ORDER) {
      const mesh = tableReelMeshes.get(reelId)!;
      const [rx, rz] = reelPositions[reelId];
      const isSelected = state.activeReelId === reelId;
      mesh.position.set(
        rx,
        isSelected ? 0.022 + Math.sin(elapsed * 3) * 0.005 : 0.012,
        rz
      );
      mesh.rotation.y = isSelected ? elapsed * 0.35 : 0;
    }
  };

  return {
    rootGroup,
    viewerGroup,
    orangeLeverPivot,
    insertedReelMesh,
    tableReelMeshes,
    hitboxes,
    updateViewMaster3D,
  };
}
