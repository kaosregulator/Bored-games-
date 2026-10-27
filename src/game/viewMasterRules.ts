export type ViewMasterReelId = 'animals' | 'cars' | 'scenery';

export interface ViewMasterSlide {
  index: number; // 0..6 (7 stereoscopic scenes = 14 windows on the reel)
  code: string;
  title: string;
  subtitle: string;
  locationOrEra: string;
  skyTopHex: string;
  skyBottomHex: string;
  groundHex: string;
  accentHex: string;
  secondaryHex: string;
  subjectType:
    | 'lion'
    | 'dolphin'
    | 'panda'
    | 'eagle'
    | 'tiger'
    | 'penguin'
    | 'frog'
    | 'ferrari_red'
    | 'lambo_yellow'
    | 'viper_blue'
    | 'porsche_silver'
    | 'mclaren_orange'
    | 'corvette_teal'
    | 'concept_neon'
    | 'grand_canyon'
    | 'mt_fuji'
    | 'yosemite'
    | 'aurora_fjord'
    | 'matterhorn'
    | 'coral_reef'
    | 'monument_valley';
}

export interface ViewMasterReelMeta {
  id: ViewMasterReelId;
  serialCode: string;
  title: string;
  shortTitle: string;
  badgeColor: string;
  slides: ViewMasterSlide[];
}

export const VIEW_MASTER_REELS: Record<ViewMasterReelId, ViewMasterReelMeta> = {
  animals: {
    id: 'animals',
    serialCode: 'REEL B-614 · WILD ANIMALS OF THE WORLD',
    title: 'Wild Animals Safari 3D',
    shortTitle: 'Animals Reel',
    badgeColor: '#16a34a',
    slides: [
      {
        index: 0,
        code: '1A',
        title: 'African Lion King on Sunlit Kopje',
        subtitle: 'Golden mane gleaming over the Serengeti plains in 3D depth',
        locationOrEra: 'Serengeti National Park · Reel B-614',
        skyTopHex: '#1d4ed8',
        skyBottomHex: '#fde047',
        groundHex: '#ca8a04',
        accentHex: '#d97706',
        secondaryHex: '#78350f',
        subjectType: 'lion',
      },
      {
        index: 1,
        code: '2A',
        title: 'Bottlenose Dolphins Leaping in Tandem',
        subtitle: 'Twin dolphins arcing above sparkling Pacific waves',
        locationOrEra: 'Coastal Pacific · Reel B-614',
        skyTopHex: '#0369a1',
        skyBottomHex: '#7dd3fc',
        groundHex: '#0284c7',
        accentHex: '#38bdf8',
        secondaryHex: '#e0f2fe',
        subjectType: 'dolphin',
      },
      {
        index: 2,
        code: '3A',
        title: 'Giant Panda in Emerald Bamboo Grove',
        subtitle: 'Crunching fresh bamboo shoots in misty Sichuan highlands',
        locationOrEra: 'Sichuan Sanctuary · Reel B-614',
        skyTopHex: '#065f46',
        skyBottomHex: '#a7f3d0',
        groundHex: '#15803d',
        accentHex: '#f8fafc',
        secondaryHex: '#090a0f',
        subjectType: 'panda',
      },
      {
        index: 3,
        code: '4A',
        title: 'American Bald Eagle Soaring Over Peaks',
        subtitle: 'Wings spread wide above snow-dusted timberline ridges',
        locationOrEra: 'Rocky Mountains · Reel B-614',
        skyTopHex: '#1e3a8a',
        skyBottomHex: '#bae6fd',
        groundHex: '#334155',
        accentHex: '#facc15',
        secondaryHex: '#451a03',
        subjectType: 'eagle',
      },
      {
        index: 4,
        code: '5A',
        title: 'Royal Bengal Tiger at Jungle Lagoon',
        subtitle: 'Vivid orange and black stripes framed by tropical ferns',
        locationOrEra: 'Ranthambore Reserve · Reel B-614',
        skyTopHex: '#14532d',
        skyBottomHex: '#fde68a',
        groundHex: '#166534',
        accentHex: '#f97316',
        secondaryHex: '#18181b',
        subjectType: 'tiger',
      },
      {
        index: 5,
        code: '6A',
        title: 'Emperor Penguins on Glacial Ice Shelf',
        subtitle: 'Colony gathered beneath shimmering polar sunlight',
        locationOrEra: 'Ross Sea, Antarctica · Reel B-614',
        skyTopHex: '#0f172a',
        skyBottomHex: '#38bdf8',
        groundHex: '#e0f2fe',
        accentHex: '#facc15',
        secondaryHex: '#1e293b',
        subjectType: 'penguin',
      },
      {
        index: 6,
        code: '7A',
        title: 'Red-Eyed Tree Frog on Rainforest Leaf',
        subtitle: 'Neon green amphibian perched on a dewy crimson bromeliad',
        locationOrEra: 'Monteverde Cloud Forest · Reel B-614',
        skyTopHex: '#022c22',
        skyBottomHex: '#10b981',
        groundHex: '#047857',
        accentHex: '#4ade80',
        secondaryHex: '#ef4444',
        subjectType: 'frog',
      },
    ],
  },
  cars: {
    id: 'cars',
    serialCode: 'REEL C-999 · 1999 EXOTIC SUPERCARS & CLASSICS',
    title: '1999 Exotic Supercars 3D',
    shortTitle: 'Cars Reel',
    badgeColor: '#dc2626',
    slides: [
      {
        index: 0,
        code: '1C',
        title: '1999 Ferrari F355 Spider — Rosso Corsa',
        subtitle: 'Top-down V8 Italian roadster hugging the Amalfi cliffside road',
        locationOrEra: '1999 Maranello Series · Reel C-999',
        skyTopHex: '#1e3a8a',
        skyBottomHex: '#fdba74',
        groundHex: '#334155',
        accentHex: '#dc2626',
        secondaryHex: '#facc15',
        subjectType: 'ferrari_red',
      },
      {
        index: 1,
        code: '2C',
        title: '1999 Lamborghini Diablo SV — Giallo Fly',
        subtitle: 'Scissor-door V12 poster legend with rear carbon wing',
        locationOrEra: 'Sant’Agata Bolognese · Reel C-999',
        skyTopHex: '#311042',
        skyBottomHex: '#f97316',
        groundHex: '#1e293b',
        accentHex: '#facc15',
        secondaryHex: '#090a0f',
        subjectType: 'lambo_yellow',
      },
      {
        index: 2,
        code: '3C',
        title: '1999 Dodge Viper GTS Coupe — Blue & White',
        subtitle: '8.0L V10 American muscle icon with twin racing stripes',
        locationOrEra: 'Laguna Seca Corkscrew · Reel C-999',
        skyTopHex: '#0c4a6e',
        skyBottomHex: '#bae6fd',
        groundHex: '#3f3f46',
        accentHex: '#1d4ed8',
        secondaryHex: '#f8fafc',
        subjectType: 'viper_blue',
      },
      {
        index: 3,
        code: '4C',
        title: 'Porsche 911 Turbo (993) — Arctic Silver',
        subtitle: 'Whale-tail twin-turbo flat-six carving an alpine switchback',
        locationOrEra: 'Stelvio Pass · Reel C-999',
        skyTopHex: '#0f172a',
        skyBottomHex: '#93c5fd',
        groundHex: '#475569',
        accentHex: '#e2e8f0',
        secondaryHex: '#dc2626',
        subjectType: 'porsche_silver',
      },
      {
        index: 4,
        code: '5C',
        title: 'McLaren F1 — Papaya Sunset Speed Run',
        subtitle: 'Central driving cockpit and gold-lined V12 engine bay',
        locationOrEra: 'Bonneville Salt Flats · Reel C-999',
        skyTopHex: '#4c1d95',
        skyBottomHex: '#fb923c',
        groundHex: '#cbd5e1',
        accentHex: '#f97316',
        secondaryHex: '#18181b',
        subjectType: 'mclaren_orange',
      },
      {
        index: 5,
        code: '6C',
        title: '1963 Corvette Stingray Split-Window',
        subtitle: 'Chrome bumper classic gleaming under retro neon drive-in lights',
        locationOrEra: 'Route 66 Diner · Reel C-999',
        skyTopHex: '#090d16',
        skyBottomHex: '#ec4899',
        groundHex: '#1e293b',
        accentHex: '#06b6d4',
        secondaryHex: '#f8fafc',
        subjectType: 'corvette_teal',
      },
      {
        index: 6,
        code: '7C',
        title: '1999 Y2K Millennium Concept GT Prototype',
        subtitle: 'Aerodynamic bubble canopy and glowing turbine rims',
        locationOrEra: 'Tokyo Motor Show ’99 · Reel C-999',
        skyTopHex: '#020617',
        skyBottomHex: '#3b82f6',
        groundHex: '#0f172a',
        accentHex: '#a855f7',
        secondaryHex: '#22d3ee',
        subjectType: 'concept_neon',
      },
    ],
  },
  scenery: {
    id: 'scenery',
    serialCode: 'REEL A-301 · SCENIC WONDERS OF THE WORLD',
    title: 'World Scenery & Wonders 3D',
    shortTitle: 'Scenery Reel',
    badgeColor: '#0284c7',
    slides: [
      {
        index: 0,
        code: '1S',
        title: 'Grand Canyon at Crimson Sunset',
        subtitle: 'Mile-deep terraced red rock gorges above the Colorado River',
        locationOrEra: 'Arizona, USA · Reel A-301',
        skyTopHex: '#431407',
        skyBottomHex: '#fb923c',
        groundHex: '#9a3412',
        accentHex: '#ea580c',
        secondaryHex: '#fde047',
        subjectType: 'grand_canyon',
      },
      {
        index: 1,
        code: '2S',
        title: 'Mount Fuji & Cherry Blossom Pagoda',
        subtitle: 'Snow-capped volcanic cone framed by spring sakura petals',
        locationOrEra: 'Chureito Pagoda, Japan · Reel A-301',
        skyTopHex: '#1d4ed8',
        skyBottomHex: '#fbcfe8',
        groundHex: '#334155',
        accentHex: '#f472b6',
        secondaryHex: '#ffffff',
        subjectType: 'mt_fuji',
      },
      {
        index: 2,
        code: '3S',
        title: 'Yosemite Valley Half Dome & Waterfall',
        subtitle: 'Granite monolith rising above pine meadows and misty falls',
        locationOrEra: 'Sierra Nevada, California · Reel A-301',
        skyTopHex: '#0369a1',
        skyBottomHex: '#bae6fd',
        groundHex: '#15803d',
        accentHex: '#94a3b8',
        secondaryHex: '#f8fafc',
        subjectType: 'yosemite',
      },
      {
        index: 3,
        code: '4S',
        title: 'Aurora Borealis Over Norwegian Fjord',
        subtitle: 'Ribbons of emerald and violet light dancing above glassy water',
        locationOrEra: 'Lofoten Islands, Norway · Reel A-301',
        skyTopHex: '#020617',
        skyBottomHex: '#10b981',
        groundHex: '#0f172a',
        accentHex: '#34d399',
        secondaryHex: '#a855f7',
        subjectType: 'aurora_fjord',
      },
      {
        index: 4,
        code: '5S',
        title: 'Swiss Alps Matterhorn & Mirror Lake',
        subtitle: 'Iconic pyramid peak reflected in crystal-clear Riffelsee',
        locationOrEra: 'Zermatt, Switzerland · Reel A-301',
        skyTopHex: '#1e3a8a',
        skyBottomHex: '#93c5fd',
        groundHex: '#0284c7',
        accentHex: '#f8fafc',
        secondaryHex: '#16a34a',
        subjectType: 'matterhorn',
      },
      {
        index: 5,
        code: '6S',
        title: 'Great Barrier Reef Turquoise Lagoon',
        subtitle: 'Sunbeams piercing crystal coral gardens and tropical fish',
        locationOrEra: 'Queensland, Australia · Reel A-301',
        skyTopHex: '#0284c7',
        skyBottomHex: '#67e8f9',
        groundHex: '#0891b2',
        accentHex: '#22d3ee',
        secondaryHex: '#fb7185',
        subjectType: 'coral_reef',
      },
      {
        index: 6,
        code: '7S',
        title: 'Monument Valley Sandstone Mittens',
        subtitle: 'Towering desert buttes glowing under a desert twilight sky',
        locationOrEra: 'Navajo Nation Border · Reel A-301',
        skyTopHex: '#311042',
        skyBottomHex: '#f97316',
        groundHex: '#7c2d12',
        accentHex: '#dc2626',
        secondaryHex: '#facc15',
        subjectType: 'monument_valley',
      },
    ],
  },
};

export const VIEW_MASTER_REEL_ORDER: ViewMasterReelId[] = [
  'animals',
  'cars',
  'scenery',
];

export interface ViewMasterGameState {
  activeReelId: ViewMasterReelId;
  activeReel: ViewMasterReelId;
  reelInserted: boolean;
  currentSlideIndex: number; // 0..6
  slideIndex: number; // 0..6 alias
  wheelRotationDeg: number; // Accumulates +25.714° per advance click so the circular reel physically spins!
  wheelRotationCount: number;
  totalClicks: number;
  lookingThroughEyepiece: boolean;
  eyepieceMode: boolean;
  lastActionLog: string;
}

export function createInitialViewMasterState(
  initialReel: ViewMasterReelId = 'animals'
): ViewMasterGameState {
  return {
    activeReelId: initialReel,
    activeReel: initialReel,
    reelInserted: true,
    currentSlideIndex: 0,
    slideIndex: 0,
    wheelRotationDeg: 0,
    wheelRotationCount: 0,
    totalClicks: 0,
    lookingThroughEyepiece: false,
    eyepieceMode: false,
    lastActionLog:
      'Wild Animals Safari Reel B-614 inserted! Pull the orange advance lever [Space] or click Look Inside 3D Viewer!',
  };
}

export function getCurrentViewMasterSlide(
  state: ViewMasterGameState
): ViewMasterSlide {
  const reel = VIEW_MASTER_REELS[state.activeReelId] ?? VIEW_MASTER_REELS.animals;
  return reel.slides[state.currentSlideIndex] ?? reel.slides[0];
}

export function insertViewMasterReel(
  state: ViewMasterGameState,
  reelId: ViewMasterReelId
): ViewMasterGameState {
  const meta = VIEW_MASTER_REELS[reelId];
  return {
    ...state,
    activeReelId: reelId,
    activeReel: reelId,
    reelInserted: true,
    currentSlideIndex: 0,
    slideIndex: 0,
    wheelRotationDeg: 0,
    wheelRotationCount: 0,
    lastActionLog: `Slid ${meta.title} (${meta.serialCode}) into the top slot of the Red View-Master!`,
  };
}

export function advanceViewMasterSlide(
  state: ViewMasterGameState,
  direction: 1 | -1 = 1
): ViewMasterGameState {
  if (!state.reelInserted) {
    return {
      ...state,
      reelInserted: true,
      lastActionLog: 'Inserted reel into top slot! Pull the orange lever again to advance.',
    };
  }
  const reel = VIEW_MASTER_REELS[state.activeReelId];
  const count = reel.slides.length;
  const nextIndex = (state.currentSlideIndex + direction + count) % count;
  const stepDeg = 360 / 14; // 25.714 degrees per View-Master lever click (14 windows = 7 stereo pairs)
  const nextSlide = reel.slides[nextIndex];
  const nextClicks = state.totalClicks + 1;

  return {
    ...state,
    currentSlideIndex: nextIndex,
    slideIndex: nextIndex,
    wheelRotationDeg: state.wheelRotationDeg + direction * stepDeg,
    wheelRotationCount: state.wheelRotationCount + direction,
    totalClicks: nextClicks,
    lastActionLog: `KA-CHUNK! Reel rotated to Slide ${nextSlide.code}: "${nextSlide.title}"`,
  };
}

export function toggleViewMasterEyepieceMode(
  state: ViewMasterGameState,
  forceValue?: boolean
): ViewMasterGameState {
  const nextVal =
    typeof forceValue === 'boolean' ? forceValue : !state.lookingThroughEyepiece;
  return {
    ...state,
    lookingThroughEyepiece: nextVal,
    eyepieceMode: nextVal,
    lastActionLog: nextVal
      ? 'Looking through the stereoscopic 3D View-Master lenses! Pull the lever [Space] to rotate the reel.'
      : 'Lowered the 3D View-Master back to the tabletop. Click any circular reel on the table to swap reels!',
  };
}

export const toggleViewMasterEyepiece = toggleViewMasterEyepieceMode;

