export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'VICTORY'
  | 'GAME_OVER';

export type ItemId =
  | 'wood_crate'
  | 'iron_weight'
  | 'rubber_sphere'
  | 'grapple_hook'
  | 'seismic_charge'
  | 'spring_pad'
  | 'scrap_iron'
  | 'black_powder'
  | 'spring_coil';

export type ItemCategory = 'deployable' | 'throwable' | 'tool' | 'material';

export interface ItemDefinition {
  id: ItemId;
  name: string;
  shortLabel: string;
  description: string;
  category: ItemCategory;
  massKg: number;
  density: number; // < 1.0 floats in water (1.0), > 1.0 sinks
  restitution: number; // 0..1 bounciness
  friction: number;
  maxStack: number;
  accentColor: string;
  buoyancyLabel: string;
}

export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  resultId: ItemId;
  resultQty: number;
  ingredients: { itemId: ItemId; quantity: number }[];
  label: string;
}

export type SurfaceMaterial = 'stone' | 'wood' | 'ice' | 'brass' | 'cracked';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  surface: SurfaceMaterial;
  friction: number;
  restitution: number;
  moving?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    speed: number;
    t: number;
    dir: 1 | -1;
    vx: number;
    vy: number;
  };
  gateId?: string;
  gateTargetOffset?: { x: number; y: number };
  gateProgress?: number; // 0 = closed, 1 = open
  baseX: number;
  baseY: number;
  broken?: boolean;
  hitFlash?: number;
}

export interface Seesaw {
  id: string;
  pivotX: number;
  pivotY: number;
  halfLength: number;
  thickness: number;
  angle: number;
  angularVel: number;
  maxAngle: number;
  inertia: number;
  springK: number;
  damping: number;
}

export interface WaterZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  density: number; // 1.0 standard water
  wavePhase: number;
}

export interface PressurePlate {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  requiredMassKg: number;
  currentMassKg: number;
  pressed: boolean;
  targetGateId: string;
  depression: number; // 0..1
}

export interface Pendulum {
  id: string;
  pivotX: number;
  pivotY: number;
  length: number;
  angle: number;
  angularVel: number;
  bobRadius: number;
  bobMass: number;
  isHazard: boolean;
  driveAmp: number;
  drivePhase: number;
  driveFreq: number;
}

export interface AnchorRing {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface SpringPad {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  launchVelocity: number;
  compression: number; // 0..1
  placedByPlayer?: boolean;
}

export type DynamicBodyKind =
  | 'wood_crate'
  | 'iron_weight'
  | 'rubber_sphere'
  | 'seismic_charge'
  | 'boulder';

export interface PhysicsBody {
  id: string;
  kind: DynamicBodyKind;
  shape: 'box' | 'circle';
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  mass: number;
  density: number;
  restitution: number;
  friction: number;
  grounded: boolean;
  submergedRatio: number;
  wasInWater: boolean;
  fuseTimer?: number;
  maxFuse?: number;
  pickupItemId?: ItemId;
  hitFlash: number;
  onSeesawId?: string | null;
}

export interface WorldPickup {
  id: string;
  x: number;
  y: number;
  itemId: ItemId;
  quantity: number;
  bobPhase: number;
  collected: boolean;
}

export interface Automaton {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  patrolMinX: number;
  patrolMaxX: number;
  state: 'patrol' | 'windup' | 'charge' | 'stunned';
  stateTimer: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  mass: number;
  hitFlash: number;
  alive: boolean;
  animPhase?: number;
}

export interface Relic {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  bobPhase: number;
}

export interface BrazilFlag {
  id: string;
  x: number;
  baseY: number;
  poleHeight: number;
  bonusHp: number;
  collected: boolean;
  wavePhase: number;
  bonusTimer?: number;
}

export interface WorldSign {
  x: number;
  y: number;
  text: string;
}

export interface Portal {
  x: number;
  y: number;
  w: number;
  h: number;
  unlocked: boolean;
  pulsePhase: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  kind: 'dust' | 'spark' | 'water' | 'stone' | 'wood' | 'ring';
}

export interface Fireball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  trailTimer: number;
}

export interface ScarfNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  mass: number;
  facing: 1 | -1;
  grounded: boolean;
  groundFriction: number;
  groundPlatformId: string | null;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpsRemaining: number;
  maxJumps: number;
  inWater: boolean;
  submergedRatio: number;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  hitFlash: number;
  squashX: number;
  squashY: number;
  walkCycle: number;
  carriedBodyId: string | null;
  grapple: {
    active: boolean;
    anchorId: string | null;
    anchorX: number;
    anchorY: number;
    length: number;
  };
  scarf: ScarfNode[];
}

export interface LevelDefinition {
  index: number;
  id: string;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  startingItems: { itemId: ItemId; quantity: number }[];
  platforms: Omit<Platform, 'baseX' | 'baseY'>[];
  seesaws: Seesaw[];
  waterZones: WaterZone[];
  pressurePlates: PressurePlate[];
  pendulums: Pendulum[];
  anchorRings: AnchorRing[];
  springPads: SpringPad[];
  bodies: Omit<PhysicsBody, 'grounded' | 'submergedRatio' | 'wasInWater' | 'hitFlash'>[];
  pickups: Omit<WorldPickup, 'bobPhase' | 'collected'>[];
  automatons: Omit<Automaton, 'state' | 'stateTimer' | 'hitFlash' | 'alive'>[];
  relics: Omit<Relic, 'collected' | 'bobPhase'>[];
  flags: Omit<BrazilFlag, 'collected' | 'wavePhase' | 'bonusTimer'>[];
  portal: Omit<Portal, 'pulsePhase'>;
  signs: WorldSign[];
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  levelIndex: number;
  levelCount: number;
  levelName: string;
  relicsCollected: number;
  relicsTotal: number;
  elapsedSeconds: number;
  portalUnlocked: boolean;
  carriedItemLabel: string | null;
  carriedMassKg: number;
  contextHint: string | null;
  slots: (InventorySlot | null)[];
  activeHotbarIndex: number;
  totalBackpackMassKg: number;
}
