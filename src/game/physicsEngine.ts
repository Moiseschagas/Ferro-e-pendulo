import { gameAudio } from './audio';
import {
  addItemToSlots,
  calculateInventoryMassKg,
  HOTBAR_SIZE,
  ITEMS,
  removeItemFromSlots,
  TOTAL_INVENTORY_SLOTS,
} from './items';
import { LEVELS } from './levels';
import {
  AnchorRing,
  Automaton,
  BrazilFlag,
  CraftingRecipe,
  Fireball,
  HudSnapshot,
  InventorySlot,
  ItemId,
  LevelDefinition,
  Particle,
  Pendulum,
  PhysicsBody,
  Platform,
  Player,
  Portal,
  PressurePlate,
  Relic,
  Seesaw,
  SpringPad,
  WaterZone,
  WorldPickup,
  WorldSign,
} from './types';

const GRAVITY = 1350;
const PLAYER_MOVE_ACCEL = 2300;
const PLAYER_MAX_SPEED = 315;
const PLAYER_JUMP_VY = -585;
const COYOTE_TIME = 0.11;
const JUMP_BUFFER_TIME = 0.125;
const MAX_PARTICLES = 260;

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  interactPressed: boolean;
  usePressed: boolean;
  useHeld: boolean;
  firePressed: boolean;
  mouseScreenX: number;
  mouseScreenY: number;
  mouseActive: boolean;
}

export class PhysicsWorld {
  public level!: LevelDefinition;
  public platforms: Platform[] = [];
  public seesaws: Seesaw[] = [];
  public waterZones: WaterZone[] = [];
  public pressurePlates: PressurePlate[] = [];
  public pendulums: Pendulum[] = [];
  public anchorRings: AnchorRing[] = [];
  public springPads: SpringPad[] = [];
  public bodies: PhysicsBody[] = [];
  public fireballs: Fireball[] = [];
  public pickups: WorldPickup[] = [];
  public automatons: Automaton[] = [];
  public relics: Relic[] = [];
  public flags: BrazilFlag[] = [];
  public portal!: Portal;
  public signs: WorldSign[] = [];
  public player!: Player;
  public particles: Particle[] = [];

  public slots: (InventorySlot | null)[] = [];
  public activeHotbarIndex = 0;

  public cameraX = 0;
  public cameraY = 0;
  public shakeTime = 0;
  public shakeIntensity = 0;
  public hitstopTimer = 0;
  public elapsedSeconds = 0;
  public time = 0;
  private fireCooldown = 0;

  public contextHint: string | null = null;
  public onLevelComplete?: () => void;
  public onGameOver?: () => void;

  private bodyCounter = 0;

  constructor(levelIndex = 0) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        life: 0,
        maxLife: 1,
        color: '#fff',
        gravity: 300,
        kind: 'dust',
      });
    }
    this.loadLevel(levelIndex);
  }

  public loadLevel(levelIndex: number): void {
    const def = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, levelIndex))];
    this.level = def;
    this.elapsedSeconds = 0;
    this.hitstopTimer = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.contextHint = null;

    this.platforms = def.platforms.map((p) => ({
      ...p,
      baseX: p.x,
      baseY: p.y,
      moving: p.moving ? { ...p.moving } : undefined,
      gateProgress: p.gateProgress ?? 0,
      broken: false,
      hitFlash: 0,
    }));
    this.seesaws = def.seesaws.map((s) => ({ ...s }));
    this.waterZones = def.waterZones.map((w) => ({ ...w }));
    this.pressurePlates = def.pressurePlates.map((p) => ({ ...p }));
    this.pendulums = def.pendulums.map((p) => ({ ...p }));
    this.anchorRings = def.anchorRings.map((r) => ({ ...r }));
    this.springPads = def.springPads.map((s) => ({ ...s }));
    this.bodies = def.bodies.map((b) => ({
      ...b,
      grounded: false,
      submergedRatio: 0,
      wasInWater: false,
      hitFlash: 0,
      onSeesawId: null,
    }));
    this.pickups = def.pickups.map((p) => ({
      ...p,
      bobPhase: Math.random() * Math.PI * 2,
      collected: false,
    }));
    this.automatons = def.automatons.map((a) => ({
      ...a,
      state: 'patrol',
      stateTimer: 0,
      hitFlash: 0,
      alive: true,
      animPhase: Math.random() * Math.PI * 2,
    }));
    this.relics = def.relics.map((r) => ({
      ...r,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    }));
    this.flags = def.flags.map((f) => ({
      ...f,
      collected: false,
      wavePhase: Math.random() * Math.PI * 2,
      bonusTimer: 0,
    }));
    this.portal = { ...def.portal, pulsePhase: 0 };
    this.signs = def.signs.map((s) => ({ ...s }));

    // Reset inventory for the chamber
    this.slots = new Array(TOTAL_INVENTORY_SLOTS).fill(null);
    for (const startItem of def.startingItems) {
      addItemToSlots(this.slots, startItem.itemId, startItem.quantity);
    }
    this.activeHotbarIndex = 0;

    // Reset particles & fireballs
    this.fireballs = [];
    this.fireCooldown = 0;
    for (const pt of this.particles) pt.active = false;

    // Spawn player
    const scarfNodes = [];
    for (let i = 0; i < 6; i++) {
      scarfNodes.push({
        x: def.spawn.x - i * 5,
        y: def.spawn.y + 10,
        oldX: def.spawn.x - i * 5,
        oldY: def.spawn.y + 10,
      });
    }

    this.player = {
      x: def.spawn.x,
      y: def.spawn.y,
      w: 28,
      h: 44,
      vx: 0,
      vy: 0,
      mass: 70,
      facing: 1,
      grounded: false,
      groundFriction: 0.85,
      groundPlatformId: null,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsRemaining: 2,
      maxJumps: 2,
      inWater: false,
      submergedRatio: 0,
      hp: 100,
      maxHp: 100,
      invulnTimer: 0,
      hitFlash: 0,
      squashX: 1,
      squashY: 1,
      walkCycle: 0,
      carriedBodyId: null,
      grapple: {
        active: false,
        anchorId: null,
        anchorX: 0,
        anchorY: 0,
        length: 140,
      },
      scarf: scarfNodes,
    };

    this.cameraX = Math.max(0, def.spawn.x - 400);
    this.cameraY = Math.max(0, def.spawn.y - 350);
  }

  public getHudSnapshot(): HudSnapshot {
    const relicsCollected = this.relics.filter((r) => r.collected).length;
    let carriedItemLabel: string | null = null;
    let carriedMassKg = 0;

    if (this.player.carriedBodyId) {
      const b = this.bodies.find((x) => x.id === this.player.carriedBodyId);
      if (b) {
        carriedMassKg = b.mass;
        carriedItemLabel = b.pickupItemId ? ITEMS[b.pickupItemId].name : 'Bloco Pesado';
      }
    }

    return {
      hp: Math.max(0, Math.round(this.player.hp)),
      maxHp: this.player.maxHp,
      levelIndex: this.level.index,
      levelCount: LEVELS.length,
      levelName: this.level.name,
      relicsCollected,
      relicsTotal: this.relics.length,
      elapsedSeconds: this.elapsedSeconds,
      portalUnlocked: this.portal.unlocked,
      carriedItemLabel,
      carriedMassKg,
      contextHint: this.contextHint,
      slots: this.slots.map((s) => (s ? { ...s } : null)),
      activeHotbarIndex: this.activeHotbarIndex,
      totalBackpackMassKg: calculateInventoryMassKg(this.slots),
    };
  }

  public selectHotbar(index: number): void {
    if (index >= 0 && index < HOTBAR_SIZE) {
      this.activeHotbarIndex = index;
      // Release grapple if switching off grapple hook
      const active = this.slots[index];
      if (!active || active.itemId !== 'grapple_hook') {
        this.player.grapple.active = false;
      }
    }
  }

  public swapSlots(indexA: number, indexB: number): void {
    if (
      indexA < 0 ||
      indexA >= this.slots.length ||
      indexB < 0 ||
      indexB >= this.slots.length ||
      indexA === indexB
    ) {
      return;
    }
    const temp = this.slots[indexA];
    this.slots[indexA] = this.slots[indexB];
    this.slots[indexB] = temp;
  }

  public craftRecipe(recipe: CraftingRecipe): boolean {
    for (const ing of recipe.ingredients) {
      let count = 0;
      for (const s of this.slots) {
        if (s && s.itemId === ing.itemId) count += s.quantity;
      }
      if (count < ing.quantity) return false;
    }
    for (const ing of recipe.ingredients) {
      removeItemFromSlots(this.slots, ing.itemId, ing.quantity);
    }
    addItemToSlots(this.slots, recipe.resultId, recipe.resultQty);
    gameAudio.playPickup(true);
    return true;
  }

  public dropSlotToWorld(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const itemId = slot.itemId;

    if (itemId === 'spring_pad') {
      const placeX = this.player.x + this.player.w / 2 + this.player.facing * 42 - 28;
      const placeY = this.player.y + this.player.h - 18;
      this.springPads.push({
        id: `sp_${++this.bodyCounter}`,
        x: placeX,
        y: placeY,
        w: 56,
        h: 18,
        launchVelocity: -880,
        compression: 0.4,
        placedByPlayer: true,
      });
      gameAudio.playPlateToggle(true);
    } else if (
      itemId === 'scrap_iron' ||
      itemId === 'black_powder' ||
      itemId === 'spring_coil' ||
      itemId === 'grapple_hook'
    ) {
      if (itemId === 'grapple_hook') {
        this.player.grapple.active = false;
      }
      // Spawn pickup outside immediate auto-collect radius so player sees it drop
      this.pickups.push({
        id: `drop_p_${++this.bodyCounter}`,
        x: this.player.x + this.player.w / 2 + this.player.facing * 64,
        y: this.player.y + this.player.h / 2,
        itemId,
        quantity: 1,
        bobPhase: 0,
        collected: false,
      });
      gameAudio.playImpact('wood', 0.25);
    } else {
      this.spawnItemEntity(itemId, this.player.facing * 145, -145);
      gameAudio.playImpact(itemId === 'iron_weight' ? 'iron' : 'wood', 0.3);
    }

    slot.quantity -= 1;
    if (slot.quantity <= 0) this.slots[slotIndex] = null;
  }

  public getAimVector(viewWidth: number, viewHeight: number, input: InputState): {
    dx: number;
    dy: number;
    power: number;
  } {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h * 0.4;

    if (input.mouseActive && viewWidth > 0 && viewHeight > 0) {
      const worldX = input.mouseScreenX + this.cameraX;
      const worldY = input.mouseScreenY + this.cameraY;
      const rawDx = worldX - px;
      const rawDy = worldY - py;
      const dist = Math.hypot(rawDx, rawDy) || 1;
      const power = Math.min(1, Math.max(0.35, dist / 240));
      return { dx: rawDx / dist, dy: rawDy / dist, power };
    }

    return {
      dx: this.player.facing * 0.85,
      dy: -0.52,
      power: 0.72,
    };
  }

  public update(rawDt: number, input: InputState, viewWidth: number, viewHeight: number): void {
    const dt = Math.min(rawDt, 0.05);
    this.time += dt;

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.updateParticles(dt * 0.25);
      return;
    }

    this.elapsedSeconds += dt;

    // Input timers
    if (input.jumpPressed) {
      this.player.jumpBufferTimer = JUMP_BUFFER_TIME;
    } else {
      this.player.jumpBufferTimer = Math.max(0, this.player.jumpBufferTimer - dt);
    }

    if (this.player.invulnTimer > 0) {
      this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);
    }
    if (this.player.hitFlash > 0) {
      this.player.hitFlash = Math.max(0, this.player.hitFlash - dt * 5);
    }

    // Update moving platforms & gates
    this.updatePlatformsAndGates(dt);

    // Update water wave animation
    for (const wz of this.waterZones) {
      wz.wavePhase += dt * 2.4;
    }

    // Update pendulums
    this.updatePendulums(dt);

    // Handle interactions (E), active item use (Q) & fireball cast (Right Click)
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.handleInteractionsAndItems(input, viewWidth, viewHeight);
    if (input.firePressed && this.fireCooldown <= 0) {
      this.castFireball(viewWidth, viewHeight, input);
    }

    // Sub-step physics for crisp stability
    const subSteps = 2;
    const subDt = dt / subSteps;
    for (let step = 0; step < subSteps; step++) {
      this.stepPlayerPhysics(subDt, input);
      this.stepBodiesPhysics(subDt);
      this.stepSeesaws(subDt);
      this.resolveBodyPairCollisions();
      this.resolvePlayerBodyInteractions();
    }

    // Update seismic fuses, fireballs, springs, pressure plates, automatons, pickups, relics, portal
    this.updateFireballs(dt);
    this.updateSpringPads(dt);
    this.updatePressurePlates(dt);
    this.updateSeismicCharges(dt);
    this.updateAutomatons(dt);
    this.updatePickupsAndRelics(dt);
    this.updateScarf(dt);
    this.updateParticles(dt);
    this.updateContextHint();

    // Update camera smoothly
    this.updateCamera(dt, viewWidth, viewHeight);

    // Check fall out of bounds
    if (this.player.y > this.level.height + 110) {
      this.damagePlayer(30, 0, -350);
      if (this.player.hp > 0) {
        // Respawn safely at chamber spawn
        this.player.x = this.level.spawn.x;
        this.player.y = this.level.spawn.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grapple.active = false;
      }
    }

    // Check portal victory
    const pCx = this.player.x + this.player.w / 2;
    const pCy = this.player.y + this.player.h / 2;
    if (
      this.portal.unlocked &&
      pCx > this.portal.x &&
      pCx < this.portal.x + this.portal.w &&
      pCy > this.portal.y &&
      pCy < this.portal.y + this.portal.h
    ) {
      gameAudio.playLevelClear();
      this.onLevelComplete?.();
    }
  }

  private updatePlatformsAndGates(dt: number): void {
    for (const plat of this.platforms) {
      if (plat.hitFlash && plat.hitFlash > 0) {
        plat.hitFlash = Math.max(0, plat.hitFlash - dt * 5);
      }
      if (plat.moving) {
        const m = plat.moving;
        const prevX = plat.x;
        const prevY = plat.y;
        m.t += m.speed * m.dir * dt;
        if (m.t >= 1) {
          m.t = 1;
          m.dir = -1;
        } else if (m.t <= 0) {
          m.t = 0;
          m.dir = 1;
        }
        // Smooth ease in-out
        const smooth = m.t * m.t * (3 - 2 * m.t);
        plat.x = m.startX + (m.endX - m.startX) * smooth;
        plat.y = m.startY + (m.endY - m.startY) * smooth;
        m.vx = (plat.x - prevX) / Math.max(dt, 0.0001);
        m.vy = (plat.y - prevY) / Math.max(dt, 0.0001);
      }
      if (plat.gateId && plat.gateTargetOffset) {
        const linkedPlate = this.pressurePlates.find((pp) => pp.targetGateId === plat.gateId);
        const target = linkedPlate && linkedPlate.pressed ? 1 : 0;
        const cur = plat.gateProgress ?? 0;
        const next = cur + (target - cur) * Math.min(1, dt * 5.5);
        plat.gateProgress = next;
        plat.x = plat.baseX + plat.gateTargetOffset.x * next;
        plat.y = plat.baseY + plat.gateTargetOffset.y * next;
      }
    }
  }

  private updatePendulums(dt: number): void {
    for (const pend of this.pendulums) {
      const prevAngle = pend.angle;
      const targetAngle =
        pend.driveAmp * Math.sin(this.time * pend.driveFreq + pend.drivePhase);
      pend.angle = targetAngle;
      pend.angularVel = (pend.angle - prevAngle) / Math.max(dt, 0.0001);

      const bobX = pend.pivotX + Math.sin(pend.angle) * pend.length;
      const bobY = pend.pivotY + Math.cos(pend.angle) * pend.length;
      const bobVx = Math.cos(pend.angle) * pend.length * pend.angularVel;
      const bobVy = -Math.sin(pend.angle) * pend.length * pend.angularVel;

      // Collide bob with player
      const pCx = this.player.x + this.player.w / 2;
      const pCy = this.player.y + this.player.h / 2;
      const dx = pCx - bobX;
      const dy = pCy - bobY;
      const dist = Math.hypot(dx, dy);
      const minDist = pend.bobRadius + 16;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        this.player.x += nx * (minDist - dist);
        this.player.y += ny * (minDist - dist);
        const knockVx = bobVx * 0.85 + nx * 360;
        const knockVy = Math.min(-240, bobVy * 0.5 + ny * 260);

        if (pend.isHazard && Math.abs(pend.angularVel) > 0.35) {
          this.damagePlayer(25, knockVx, knockVy);
        } else {
          this.player.vx = knockVx;
          this.player.vy = knockVy;
        }
      }

      // Collide bob with dynamic bodies
      for (const b of this.bodies) {
        if (b.id === this.player.carriedBodyId) continue;
        const bCx = b.x + b.w / 2;
        const bCy = b.y + b.h / 2;
        const bdx = bCx - bobX;
        const bdy = bCy - bobY;
        const bDist = Math.hypot(bdx, bdy);
        const bMin = pend.bobRadius + Math.max(b.w, b.h) * 0.48;
        if (bDist < bMin && bDist > 0.001) {
          const nx = bdx / bDist;
          const ny = bdy / bDist;
          b.x += nx * (bMin - bDist);
          b.y += ny * (bMin - bDist);
          b.vx = bobVx * 0.9 + nx * 240;
          b.vy = bobVy * 0.7 + ny * 200;
          b.hitFlash = 1;
          gameAudio.playImpact('iron', 0.8);
          this.spawnBurst(bobX + nx * pend.bobRadius, bobY + ny * pend.bobRadius, 8, '#F59E0B', 'spark');
        }
      }
    }
  }

  private handleInteractionsAndItems(
    input: InputState,
    viewWidth: number,
    viewHeight: number
  ): void {
    const pCx = this.player.x + this.player.w / 2;
    const pCy = this.player.y + this.player.h / 2;

    // 1. E (interact): pick up/drop carried body or store world object into inventory
    if (input.interactPressed) {
      if (this.player.carriedBodyId) {
        // Release carried body gently forward
        const body = this.bodies.find((b) => b.id === this.player.carriedBodyId);
        if (body) {
          body.vx = this.player.vx + this.player.facing * 140;
          body.vy = this.player.vy - 90;
          gameAudio.playImpact(body.kind === 'iron_weight' ? 'iron' : 'wood', 0.25);
        }
        this.player.carriedBodyId = null;
      } else {
        // Find nearest dynamic body within reach
        let nearest: PhysicsBody | null = null;
        let nearestDist = 78;
        for (const b of this.bodies) {
          const bx = b.x + b.w / 2;
          const by = b.y + b.h / 2;
          const d = Math.hypot(bx - pCx, by - pCy);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = b;
          }
        }

        if (nearest) {
          // If it fits in inventory (has pickupItemId and isn't an armed bomb), either store or carry
          if (nearest.pickupItemId && nearest.kind !== 'seismic_charge') {
            const added = addItemToSlots(this.slots, nearest.pickupItemId, 1);
            if (added) {
              this.bodies = this.bodies.filter((b) => b.id !== nearest!.id);
              gameAudio.playPickup(false);
              this.spawnBurst(nearest.x + nearest.w / 2, nearest.y + nearest.h / 2, 7, '#F59E0B', 'spark');
            } else {
              // Backpack full -> carry in hands!
              this.player.carriedBodyId = nearest.id;
            }
          } else {
            this.player.carriedBodyId = nearest.id;
          }
        } else {
          // Check nearby player-placed spring pad to reclaim
          const padIdx = this.springPads.findIndex(
            (sp) =>
              sp.placedByPlayer &&
              Math.hypot(sp.x + sp.w / 2 - pCx, sp.y + sp.h / 2 - pCy) < 76
          );
          if (padIdx >= 0) {
            const pad = this.springPads[padIdx];
            if (addItemToSlots(this.slots, 'spring_pad', 1)) {
              this.springPads.splice(padIdx, 1);
              gameAudio.playPickup(false);
            }
          }
        }
      }
    }

    // 2. Active Hotbar Item Use (Q or Left Click)
    const activeSlot = this.slots[this.activeHotbarIndex];

    if (activeSlot && activeSlot.itemId === 'grapple_hook') {
      if (input.usePressed) {
        if (this.player.grapple.active) {
          this.player.grapple.active = false;
        } else {
          // Find best anchor ring within 440 px
          const worldMouseX = input.mouseActive
            ? input.mouseScreenX + this.cameraX
            : pCx + this.player.facing * 160;
          const worldMouseY = input.mouseActive ? input.mouseScreenY + this.cameraY : pCy - 180;

          let bestRing: AnchorRing | null = null;
          let bestScore = Infinity;
          for (const ring of this.anchorRings) {
            const distPlayer = Math.hypot(ring.x - pCx, ring.y - pCy);
            if (distPlayer <= 440) {
              const distCursor = Math.hypot(ring.x - worldMouseX, ring.y - worldMouseY);
              const score = distCursor * 0.7 + distPlayer * 0.3;
              if (score < bestScore) {
                bestScore = score;
                bestRing = ring;
              }
            }
          }

          if (bestRing) {
            const dist = Math.hypot(bestRing.x - pCx, bestRing.y - pCy);
            this.player.grapple = {
              active: true,
              anchorId: bestRing.id,
              anchorX: bestRing.x,
              anchorY: bestRing.y,
              length: Math.max(85, Math.min(340, dist)),
            };
            gameAudio.playGrapple();
            this.spawnBurst(bestRing.x, bestRing.y, 8, '#F59E0B', 'spark');
          }
        }
      } else if (!input.useHeld && this.player.grapple.active && input.mouseActive) {
        // Allow tap-toggle OR hold-and-release? Wait: tap-toggle is super ergonomic on trackpads & keyboards (Q),
        // AND jumping cleanly releases with tangential momentum! Let's keep tap-toggle + jump-to-release!
      }
      return;
    }

    if (input.usePressed && activeSlot) {
      const def = ITEMS[activeSlot.itemId];
      if (def.category === 'material') return;

      if (activeSlot.itemId === 'spring_pad') {
        // Place spring pad directly beneath or slightly in front of player
        const placeX = this.player.x + this.player.w / 2 + this.player.facing * 36 - 28;
        const placeY = this.player.y + this.player.h - 18;
        this.springPads.push({
          id: `sp_${++this.bodyCounter}`,
          x: placeX,
          y: placeY,
          w: 56,
          h: 18,
          launchVelocity: -880,
          compression: 0.5,
          placedByPlayer: true,
        });
        gameAudio.playPlateToggle(true);
        activeSlot.quantity -= 1;
        if (activeSlot.quantity <= 0) this.slots[this.activeHotbarIndex] = null;
        return;
      }

      // Throw / deploy physics object
      const aim = this.getAimVector(viewWidth, viewHeight, input);
      const speedScale =
        activeSlot.itemId === 'rubber_sphere'
          ? 640
          : activeSlot.itemId === 'seismic_charge'
            ? 560
            : activeSlot.itemId === 'iron_weight'
              ? 380
              : 430;
      const throwVx = this.player.vx * 0.4 + aim.dx * speedScale * aim.power;
      const throwVy = this.player.vy * 0.3 + aim.dy * speedScale * aim.power - 80;

      this.spawnItemEntity(activeSlot.itemId, throwVx, throwVy);
      gameAudio.playJump(def.massKg / 45);
      activeSlot.quantity -= 1;
      if (activeSlot.quantity <= 0) this.slots[this.activeHotbarIndex] = null;
    }
  }

  private spawnItemEntity(itemId: ItemId, vx: number, vy: number): void {
    const def = ITEMS[itemId];
    const pCx = this.player.x + this.player.w / 2;
    const pCy = this.player.y + this.player.h * 0.42;
    const spawnX = pCx + this.player.facing * 22;
    const spawnY = pCy - 10;

    if (itemId === 'rubber_sphere') {
      this.bodies.push({
        id: `b_${++this.bodyCounter}`,
        kind: 'rubber_sphere',
        shape: 'circle',
        x: spawnX - 15,
        y: spawnY - 15,
        w: 30,
        h: 30,
        radius: 15,
        vx,
        vy,
        angle: 0,
        angularVel: this.player.facing * 6,
        mass: def.massKg,
        density: def.density,
        restitution: def.restitution,
        friction: def.friction,
        grounded: false,
        submergedRatio: 0,
        wasInWater: false,
        pickupItemId: 'rubber_sphere',
        hitFlash: 0,
      });
    } else if (itemId === 'seismic_charge') {
      this.bodies.push({
        id: `b_${++this.bodyCounter}`,
        kind: 'seismic_charge',
        shape: 'circle',
        x: spawnX - 14,
        y: spawnY - 14,
        w: 28,
        h: 28,
        radius: 14,
        vx,
        vy,
        angle: 0,
        angularVel: this.player.facing * 5,
        mass: def.massKg,
        density: def.density,
        restitution: def.restitution,
        friction: def.friction,
        grounded: false,
        submergedRatio: 0,
        wasInWater: false,
        fuseTimer: 2.0,
        maxFuse: 2.0,
        hitFlash: 0,
      });
    } else if (itemId === 'iron_weight') {
      this.bodies.push({
        id: `b_${++this.bodyCounter}`,
        kind: 'iron_weight',
        shape: 'box',
        x: spawnX - 19,
        y: spawnY - 19,
        w: 38,
        h: 38,
        radius: 19,
        vx,
        vy,
        angle: 0,
        angularVel: 0,
        mass: def.massKg,
        density: def.density,
        restitution: def.restitution,
        friction: def.friction,
        grounded: false,
        submergedRatio: 0,
        wasInWater: false,
        pickupItemId: 'iron_weight',
        hitFlash: 0,
      });
    } else {
      // wood_crate default
      this.bodies.push({
        id: `b_${++this.bodyCounter}`,
        kind: 'wood_crate',
        shape: 'box',
        x: spawnX - 21,
        y: spawnY - 21,
        w: 42,
        h: 42,
        radius: 21,
        vx,
        vy,
        angle: 0,
        angularVel: 0,
        mass: def.massKg,
        density: def.density,
        restitution: def.restitution,
        friction: def.friction,
        grounded: false,
        submergedRatio: 0,
        wasInWater: false,
        pickupItemId: 'wood_crate',
        hitFlash: 0,
      });
    }
  }

  private stepPlayerPhysics(dt: number, input: InputState): void {
    const p = this.player;
    const carried = p.carriedBodyId
      ? this.bodies.find((b) => b.id === p.carriedBodyId)
      : undefined;
    const massFactor = carried ? p.mass / (p.mass + carried.mass * 0.45) : 1;

    // Squash & stretch recovery
    p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);

    // Water check
    const wasInWater = p.inWater;
    p.inWater = false;
    p.submergedRatio = 0;
    for (const wz of this.waterZones) {
      const overlapX = Math.max(0, Math.min(p.x + p.w, wz.x + wz.w) - Math.max(p.x, wz.x));
      const overlapY = Math.max(0, Math.min(p.y + p.h, wz.y + wz.h) - Math.max(p.y, wz.y));
      if (overlapX > 0 && overlapY > 0) {
        p.inWater = true;
        p.submergedRatio = Math.min(1, overlapY / p.h);
        break;
      }
    }

    if (p.inWater && !wasInWater && Math.abs(p.vy) > 120) {
      gameAudio.playImpact('water', Math.min(1, Math.abs(p.vy) / 500));
      this.spawnBurst(p.x + p.w / 2, p.y + p.h * 0.7, 12, '#60A5FA', 'water');
    }

    // Horizontal acceleration (Keyboard overrides, otherwise follow notebook mouse X)
    let moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let mouseSpeedScale = 1;
    if (moveDir === 0 && input.mouseActive) {
      const pCx = p.x + p.w / 2;
      const mouseWorldX = input.mouseScreenX + this.cameraX;
      const dx = mouseWorldX - pCx;
      if (Math.abs(dx) > 18) {
        moveDir = dx > 0 ? 1 : -1;
        mouseSpeedScale = Math.min(1, (Math.abs(dx) - 18) / 42);
      }
    }

    if (moveDir !== 0) {
      p.facing = moveDir as 1 | -1;
    }

    if (p.grapple.active) {
      // Pendulum swing pumping
      p.vx += moveDir * 480 * dt;
      if (input.up) p.grapple.length = Math.max(80, p.grapple.length - 160 * dt);
      if (input.down) p.grapple.length = Math.min(360, p.grapple.length + 160 * dt);
    } else {
      const accelScale = p.grounded
        ? 0.35 + p.groundFriction * 0.65
        : p.inWater
          ? 0.55
          : 0.68;
      p.vx += moveDir * PLAYER_MOVE_ACCEL * accelScale * massFactor * mouseSpeedScale * dt;

      // Friction / Drag
      if (moveDir === 0) {
        if (p.grounded) {
          const damp = Math.exp(-p.groundFriction * 18 * dt);
          p.vx *= damp;
          if (Math.abs(p.vx) < 4) p.vx = 0;
        } else {
          p.vx *= Math.exp(-(p.inWater ? 3.5 : 0.9) * dt);
        }
      } else {
        const maxSpd = PLAYER_MAX_SPEED * massFactor * mouseSpeedScale * (p.inWater ? 0.66 : 1);
        if (Math.abs(p.vx) > maxSpd) {
          p.vx += (Math.sign(p.vx) * maxSpd - p.vx) * Math.min(1, dt * 10);
        }
      }
    }

    // Gravity & Buoyancy
    if (p.inWater) {
      const buoyancy = GRAVITY * 0.88 * p.submergedRatio;
      p.vy += (GRAVITY - buoyancy) * dt;
      p.vy *= Math.exp(-4.2 * dt);
      if (input.jumpHeld || input.up) {
        p.vy -= 920 * dt;
      }
    } else {
      const extraGrav = !input.jumpHeld && p.vy < -140 && !p.grapple.active ? 2.15 : 1.0;
      p.vy += GRAVITY * extraGrav * dt;
      p.vy = Math.min(p.vy, 980);
    }

    // Coyote time & Double Jump buffer
    if (p.grounded) {
      p.coyoteTimer = COYOTE_TIME;
      p.jumpsRemaining = p.maxJumps;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (p.jumpBufferTimer > 0) {
      if (p.grapple.active) {
        // Release grapple with boost!
        p.grapple.active = false;
        p.vy = Math.min(p.vy - 180, -420);
        p.jumpsRemaining = 1;
        p.jumpBufferTimer = 0;
        p.squashX = 0.82;
        p.squashY = 1.2;
        gameAudio.playJump(1);
      } else if (p.coyoteTimer > 0) {
        p.vy = PLAYER_JUMP_VY * (0.65 + 0.35 * massFactor);
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpsRemaining = Math.max(0, p.maxJumps - 1);
        p.jumpBufferTimer = 0;
        p.squashX = 0.78;
        p.squashY = 1.24;
        gameAudio.playJump(1 / massFactor);
        this.spawnBurst(p.x + p.w / 2, p.y + p.h, 6, '#94A3B8', 'dust');
      } else if (p.jumpsRemaining > 0 && !p.inWater) {
        // Double jump in mid-air!
        p.vy = PLAYER_JUMP_VY * 0.92 * (0.65 + 0.35 * massFactor);
        p.jumpsRemaining -= 1;
        p.jumpBufferTimer = 0;
        p.squashX = 0.75;
        p.squashY = 1.26;
        gameAudio.playJump(0.7 / massFactor);
        this.spawnBurst(p.x + p.w / 2, p.y + p.h, 8, '#FDE68A', 'dust');
      }
    }

    // Carry moving platform velocity
    if (p.grounded && p.groundPlatformId) {
      const plat = this.platforms.find((pl) => pl.id === p.groundPlatformId);
      if (plat?.moving) {
        p.x += plat.moving.vx * dt;
        p.y += plat.moving.vy * dt;
      }
    }

    // Integrate position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Enforce grapple pendulum constraint
    if (p.grapple.active) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h * 0.35;
      const dx = cx - p.grapple.anchorX;
      const dy = cy - p.grapple.anchorY;
      const dist = Math.hypot(dx, dy);
      if (dist > p.grapple.length && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        // Pull back to rope radius
        const corr = dist - p.grapple.length;
        p.x -= nx * corr;
        p.y -= ny * corr;
        // Project out radial outward velocity
        const radialVel = p.vx * nx + p.vy * ny;
        if (radialVel > 0) {
          p.vx -= radialVel * nx;
          p.vy -= radialVel * ny;
        }
        // Subtle air damping
        p.vx *= Math.exp(-0.25 * dt);
      }
    }

    // Resolve player collisions with static/moving platforms
    const prevVy = p.vy;
    const wasGrounded = p.grounded;
    p.grounded = false;
    p.groundPlatformId = null;

    for (const plat of this.platforms) {
      if (plat.broken) continue;
      if (
        p.x < plat.x + plat.w &&
        p.x + p.w > plat.x &&
        p.y < plat.y + plat.h &&
        p.y + p.h > plat.y
      ) {
        const overlapLeft = p.x + p.w - plat.x;
        const overlapRight = plat.x + plat.w - p.x;
        const overlapTop = p.y + p.h - plat.y;
        const overlapBottom = plat.y + plat.h - p.y;
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && p.vy >= -20) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          p.groundFriction = plat.friction;
          p.groundPlatformId = plat.id;
        } else if (minOverlap === overlapBottom && p.vy < 0) {
          p.y = plat.y + plat.h;
          p.vy = 0;
        } else if (minOverlap === overlapLeft) {
          p.x = plat.x - p.w;
          if (p.vx > 0) p.vx = 0;
        } else if (minOverlap === overlapRight) {
          p.x = plat.x + plat.w;
          if (p.vx < 0) p.vx = 0;
        }
      }
    }

    // Resolve player vs seesaws
    for (const s of this.seesaws) {
      const pCx = p.x + p.w / 2;
      const pBottom = p.y + p.h;
      const dx = pCx - s.pivotX;
      const dy = pBottom - s.pivotY;
      const cos = Math.cos(-s.angle);
      const sin = Math.sin(-s.angle);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      if (Math.abs(localX) <= s.halfLength + 10 && localY > -s.thickness / 2 - 4 && localY < 26 && p.vy >= -40) {
        const surfaceY = s.pivotY + Math.tan(s.angle) * (pCx - s.pivotX) - s.thickness / 2;
        if (pBottom >= surfaceY - 4 && pBottom <= surfaceY + 26) {
          p.y = surfaceY - p.h;
          // Apply player weight torque to seesaw
          const torque = localX * (p.mass * GRAVITY * 0.0085);
          s.angularVel += (torque / s.inertia) * dt;
          // Plank upward/downward velocity at contact point
          const plankVy = s.angularVel * localX;
          p.vy = Math.min(0, plankVy);
          p.grounded = true;
          p.groundFriction = 0.78;
        }
      }
    }

    // Landing feedback
    if (p.grounded && !wasGrounded && prevVy > 220) {
      const impactNorm = Math.min(1, prevVy / 750);
      p.squashX = 1 + 0.25 * impactNorm;
      p.squashY = 1 - 0.22 * impactNorm;
      gameAudio.playImpact('stone', impactNorm * 0.65);
      this.spawnBurst(p.x + p.w / 2, p.y + p.h, 7, '#CBD5E1', 'dust');
    }

    if (p.grounded && Math.abs(p.vx) > 25) {
      p.walkCycle += dt * (Math.abs(p.vx) * 0.045);
    }

    // Update carried body position smoothly
    if (carried) {
      carried.x = p.x + p.w / 2 + p.facing * 20 - carried.w / 2;
      carried.y = p.y + p.h * 0.35 - carried.h / 2;
      carried.vx = p.vx;
      carried.vy = p.vy;
      carried.angle = 0;
      carried.angularVel = 0;
    }
  }

  private stepBodiesPhysics(dt: number): void {
    for (const b of this.bodies) {
      if (b.id === this.player.carriedBodyId) continue;

      if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt * 5);

      // Water buoyancy & drag
      b.submergedRatio = 0;
      for (const wz of this.waterZones) {
        const ox = Math.max(0, Math.min(b.x + b.w, wz.x + wz.w) - Math.max(b.x, wz.x));
        const oy = Math.max(0, Math.min(b.y + b.h, wz.y + wz.h) - Math.max(b.y, wz.y));
        if (ox > 0 && oy > 0) {
          b.submergedRatio = Math.min(1, (ox * oy) / (b.w * b.h));
          const waterDensity = wz.density;
          // Archimedes buoyancy force F_b = mass * g * (waterDensity / bodyDensity) * submergedRatio
          const buoyantAccel = GRAVITY * (waterDensity / b.density) * b.submergedRatio;
          b.vy -= buoyantAccel * dt;
          b.vx *= Math.exp(-3.6 * b.submergedRatio * dt);
          b.vy *= Math.exp(-4.4 * b.submergedRatio * dt);
          b.angularVel *= Math.exp(-4.0 * dt);

          if (!b.wasInWater && Math.abs(b.vy) > 90) {
            gameAudio.playImpact('water', Math.min(1, (Math.abs(b.vy) * b.mass) / 14000));
            this.spawnBurst(b.x + b.w / 2, wz.y + 4, 10, '#60A5FA', 'water');
          }
          b.wasInWater = true;
          break;
        }
      }
      if (b.submergedRatio === 0) {
        b.wasInWater = false;
      }

      // Gravity
      b.vy += GRAVITY * dt;
      b.vy = Math.min(b.vy, 980);

      // Integrate
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.angularVel * dt;

      if (b.shape === 'box') {
        b.angularVel *= Math.exp(-6 * dt);
        b.angle *= Math.exp(-6 * dt);
      } else {
        b.angularVel = b.vx / Math.max(b.radius, 1);
      }

      b.grounded = false;
      b.onSeesawId = null;

      // Collide against platforms
      for (const plat of this.platforms) {
        if (plat.broken) continue;
        if (
          b.x < plat.x + plat.w &&
          b.x + b.w > plat.x &&
          b.y < plat.y + plat.h &&
          b.y + b.h > plat.y
        ) {
          const ol = b.x + b.w - plat.x;
          const or = plat.x + plat.w - b.x;
          const ot = b.y + b.h - plat.y;
          const ob = plat.y + plat.h - b.y;
          const minO = Math.min(ol, or, ot, ob);
          const rest = Math.max(b.restitution, plat.restitution * (b.kind === 'rubber_sphere' ? 1 : 0.25));

          if (minO === ot && b.vy >= -10) {
            const impactSpd = Math.abs(b.vy);
            b.y = plat.y - b.h;
            if (impactSpd > 110 && rest > 0.25) {
              b.vy = -b.vy * rest;
              this.emitMaterialImpact(b, impactSpd);
            } else {
              if (impactSpd > 170) this.emitMaterialImpact(b, impactSpd);
              b.vy = 0;
              b.grounded = true;
            }
            const mu = Math.min(b.friction, plat.friction);
            b.vx *= Math.exp(-mu * 12 * dt);
            if (Math.abs(b.vx) < 4) b.vx = 0;

            if (plat.moving) {
              b.x += plat.moving.vx * dt;
            }
          } else if (minO === ob && b.vy < 0) {
            b.y = plat.y + plat.h;
            b.vy = Math.abs(b.vy) * rest;
          } else if (minO === ol) {
            const impactSpd = Math.abs(b.vx);
            b.x = plat.x - b.w;
            b.vx = -Math.abs(b.vx) * rest;
            if (impactSpd > 140) this.emitMaterialImpact(b, impactSpd);
          } else if (minO === or) {
            const impactSpd = Math.abs(b.vx);
            b.x = plat.x + plat.w;
            b.vx = Math.abs(b.vx) * rest;
            if (impactSpd > 140) this.emitMaterialImpact(b, impactSpd);
          }
        }
      }

      // Collide against seesaws
      for (const s of this.seesaws) {
        const bCx = b.x + b.w / 2;
        const bBottom = b.y + b.h;
        const dx = bCx - s.pivotX;
        const dy = bBottom - s.pivotY;
        const cos = Math.cos(-s.angle);
        const sin = Math.sin(-s.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        if (Math.abs(localX) <= s.halfLength + 6 && localY > -s.thickness / 2 - 4 && localY < 26 && b.vy >= -40) {
          const surfaceY = s.pivotY + Math.tan(s.angle) * (bCx - s.pivotX) - s.thickness / 2;
          if (bBottom >= surfaceY - 4 && bBottom <= surfaceY + 26) {
            const impactVy = Math.max(0, b.vy);
            b.y = surfaceY - b.h;
            b.grounded = true;
            b.onSeesawId = s.id;

            // Impulse torque if falling fast onto seesaw + continuous static torque
            const impulseTorque = localX * (b.mass * impactVy * 0.014);
            const staticTorque = localX * (b.mass * GRAVITY * 0.011);
            s.angularVel += (impulseTorque + staticTorque * dt) / s.inertia;

            const plankVy = s.angularVel * localX;
            b.vy = Math.min(0, plankVy);
            // Slide along tilted plank
            b.vx += Math.sin(s.angle) * GRAVITY * 0.55 * dt;
            b.vx *= Math.exp(-b.friction * 5 * dt);

            if (impactVy > 190) {
              this.emitMaterialImpact(b, impactVy);
            }
          }
        }
      }
    }
  }

  private stepSeesaws(dt: number): void {
    for (const s of this.seesaws) {
      const prevAngVel = s.angularVel;
      // Restoring spring + angular damping
      const springTorque = -s.springK * s.angle;
      const dampTorque = -s.damping * s.angularVel;
      s.angularVel += (springTorque + dampTorque) * dt;
      s.angle += s.angularVel * dt;

      if (s.angle > s.maxAngle) {
        s.angle = s.maxAngle;
        if (s.angularVel > 0) s.angularVel = -s.angularVel * 0.25;
      } else if (s.angle < -s.maxAngle) {
        s.angle = -s.maxAngle;
        if (s.angularVel < 0) s.angularVel = -s.angularVel * 0.25;
      }

      // Catapult effect: if plank swung up fast, launch lighter bodies on rising side!
      const deltaVel = s.angularVel - prevAngVel;
      if (Math.abs(s.angularVel) > 0.65 || Math.abs(deltaVel) > 0.5) {
        for (const b of this.bodies) {
          if (b.onSeesawId === s.id) {
            const localX = b.x + b.w / 2 - s.pivotX;
            const endVy = s.angularVel * localX * 1.45;
            if (endVy < -140) {
              b.vy = Math.min(b.vy, endVy);
            }
          }
        }
      }
    }
  }

  private resolveBodyPairCollisions(): void {
    const n = this.bodies.length;
    for (let i = 0; i < n; i++) {
      const a = this.bodies[i];
      if (a.id === this.player.carriedBodyId) continue;

      for (let j = i + 1; j < n; j++) {
        const b = this.bodies[j];
        if (b.id === this.player.carriedBodyId) continue;

        if (
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y
        ) {
          const ol = a.x + a.w - b.x;
          const or = b.x + b.w - a.x;
          const ot = a.y + a.h - b.y;
          const ob = b.y + b.h - a.y;
          const minO = Math.min(ol, or, ot, ob);

          let nx = 0;
          let ny = 0;
          if (minO === ot) ny = -1;
          else if (minO === ob) ny = 1;
          else if (minO === ol) nx = -1;
          else nx = 1;

          const invMa = 1 / a.mass;
          const invMb = 1 / b.mass;
          const invSum = invMa + invMb;

          // Positional correction
          const sep = minO / invSum;
          a.x += nx * sep * invMa;
          a.y += ny * sep * invMa;
          b.x -= nx * sep * invMb;
          b.y -= ny * sep * invMb;

          // Impulse resolution
          const rvx = a.vx - b.vx;
          const rvy = a.vy - b.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal < 0) {
            const e = Math.min(a.restitution, b.restitution);
            const jImp = (-(1 + e) * velAlongNormal) / invSum;
            a.vx += jImp * nx * invMa;
            a.vy += jImp * ny * invMa;
            b.vx -= jImp * nx * invMb;
            b.vy -= jImp * ny * invMb;

            if (ny === -1) a.grounded = true;
            if (ny === 1) b.grounded = true;

            if (Math.abs(velAlongNormal) > 150) {
              this.emitMaterialImpact(a.mass > b.mass ? a : b, Math.abs(velAlongNormal));
            }
          }
        }
      }
    }
  }

  private resolvePlayerBodyInteractions(): void {
    const p = this.player;
    for (const b of this.bodies) {
      if (b.id === p.carriedBodyId) continue;

      if (
        p.x < b.x + b.w &&
        p.x + p.w > b.x &&
        p.y < b.y + b.h &&
        p.y + p.h > b.y
      ) {
        const ol = p.x + p.w - b.x;
        const or = b.x + b.w - p.x;
        const ot = p.y + p.h - b.y;
        const ob = b.y + b.h - p.y;
        const minO = Math.min(ol, or, ot, ob);

        if (minO === ot && p.vy >= -25) {
          // Player standing cleanly on top of crate/weight!
          p.y = b.y - p.h;
          p.vy = b.vy;
          p.grounded = true;
          p.groundFriction = b.friction;
          p.x += b.vx * 0.008; // ride floating/moving crates
        } else if (minO === ob && p.vy < 0) {
          p.y = b.y + b.h;
          p.vy = 0;
        } else if (minO === ol || minO === or) {
          const dir = minO === ol ? 1 : -1;
          const pushStrength = p.mass / (p.mass + b.mass);
          b.vx += dir * 185 * pushStrength;
          if (minO === ol) {
            p.x = b.x - p.w;
          } else {
            p.x = b.x + b.w;
          }
          p.vx *= 0.65;
        }
      }
    }
  }

  private updateSpringPads(dt: number): void {
    const p = this.player;
    for (const sp of this.springPads) {
      if (sp.compression > 0) {
        sp.compression = Math.max(0, sp.compression - dt * 4.5);
      }

      // Launch player
      if (
        p.x + p.w > sp.x &&
        p.x < sp.x + sp.w &&
        p.y + p.h >= sp.y - 4 &&
        p.y + p.h <= sp.y + sp.h + 10 &&
        p.vy >= -40
      ) {
        p.vy = sp.launchVelocity;
        p.grounded = false;
        p.squashX = 0.72;
        p.squashY = 1.32;
        sp.compression = 1;
        gameAudio.playSpring();
        this.spawnBurst(sp.x + sp.w / 2, sp.y, 10, '#10B981', 'spark');
      }

      // Launch dynamic bodies proportionally to mass!
      for (const b of this.bodies) {
        if (b.id === p.carriedBodyId) continue;
        if (
          b.x + b.w > sp.x &&
          b.x < sp.x + sp.w &&
          b.y + b.h >= sp.y - 4 &&
          b.y + b.h <= sp.y + sp.h + 10 &&
          b.vy >= -30
        ) {
          const massRatio = Math.sqrt(35 / Math.max(10, b.mass));
          b.vy = sp.launchVelocity * Math.min(1.15, Math.max(0.55, massRatio));
          sp.compression = 1;
          gameAudio.playSpring();
          this.spawnBurst(sp.x + sp.w / 2, sp.y, 8, '#10B981', 'spark');
        }
      }
    }
  }

  private updatePressurePlates(dt: number): void {
    const p = this.player;
    for (const plate of this.pressurePlates) {
      let mass = 0;

      // Check player standing on plate
      if (
        p.x + p.w > plate.x + 2 &&
        p.x < plate.x + plate.w - 2 &&
        Math.abs(p.y + p.h - plate.y) < 16
      ) {
        mass += p.mass;
      }

      // Check bodies resting on plate (and stacked bodies above them!)
      for (const b of this.bodies) {
        if (b.id === p.carriedBodyId) continue;
        if (
          b.x + b.w > plate.x + 2 &&
          b.x < plate.x + plate.w - 2 &&
          b.y + b.h >= plate.y - 54 &&
          b.y + b.h <= plate.y + plate.h + 12
        ) {
          mass += b.mass;
        }
      }

      plate.currentMassKg = Math.round(mass);
      const wasPressed = plate.pressed;
      plate.pressed = mass >= plate.requiredMassKg;
      if (plate.pressed !== wasPressed) {
        gameAudio.playPlateToggle(plate.pressed);
        this.spawnBurst(
          plate.x + plate.w / 2,
          plate.y,
          8,
          plate.pressed ? '#10B981' : '#F59E0B',
          'spark'
        );
      }

      const targetDep = plate.pressed ? 1 : Math.min(0.45, mass / plate.requiredMassKg);
      plate.depression += (targetDep - plate.depression) * Math.min(1, dt * 10);
    }
  }

  private updateSeismicCharges(dt: number): void {
    const toDetonate: PhysicsBody[] = [];
    for (const b of this.bodies) {
      if (b.kind === 'seismic_charge' && b.fuseTimer !== undefined) {
        b.fuseTimer -= dt;
        if (b.fuseTimer <= 0) {
          toDetonate.push(b);
        }
      }
    }

    for (const bomb of toDetonate) {
      this.detonateCharge(bomb);
    }
  }

  private detonateCharge(bomb: PhysicsBody): void {
    const cx = bomb.x + bomb.w / 2;
    const cy = bomb.y + bomb.h / 2;
    const blastRadius = 190;

    this.bodies = this.bodies.filter((b) => b.id !== bomb.id);
    if (this.player.carriedBodyId === bomb.id) {
      this.player.carriedBodyId = null;
    }

    gameAudio.playExplosion();
    this.hitstopTimer = 0.055;
    this.triggerShake(13, 0.35);

    // Shockwave & debris
    this.spawnBurst(cx, cy, 1, '#F59E0B', 'ring');
    this.spawnBurst(cx, cy, 26, '#F97316', 'spark');
    this.spawnBurst(cx, cy, 14, '#94A3B8', 'stone');

    // Shatter cracked stone walls in blast radius
    for (const plat of this.platforms) {
      if (plat.surface === 'cracked' && !plat.broken) {
        const nearestX = Math.max(plat.x, Math.min(cx, plat.x + plat.w));
        const nearestY = Math.max(plat.y, Math.min(cy, plat.y + plat.h));
        if (Math.hypot(nearestX - cx, nearestY - cy) <= blastRadius) {
          plat.broken = true;
          this.spawnBurst(
            plat.x + plat.w / 2,
            plat.y + plat.h / 2,
            24,
            '#64748B',
            'stone'
          );
        }
      }
    }

    // Blast impulse on dynamic bodies
    for (const b of this.bodies) {
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      const dx = bx - cx;
      const dy = by - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < blastRadius && dist > 0.01) {
        const falloff = 1 - dist / blastRadius;
        const mag = (720 * falloff) / Math.sqrt(b.mass / 20);
        b.vx += (dx / dist) * mag;
        b.vy += (dy / dist) * mag - 240 * falloff;
        b.hitFlash = 1;
      }
    }

    // Blast automatons
    for (const a of this.automatons) {
      if (!a.alive) continue;
      const ax = a.x + a.w / 2;
      const ay = a.y + a.h / 2;
      const dx = ax - cx;
      const dy = ay - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < blastRadius) {
        a.hp -= 2;
        a.hitFlash = 1;
        a.vx += ((dx / (dist || 1)) * 420);
        a.vy -= 260;
        if (a.hp <= 0) {
          this.defeatAutomaton(a);
        }
      }
    }

    // Mild blast push on player
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    const pdx = px - cx;
    const pdy = py - cy;
    const pDist = Math.hypot(pdx, pdy);
    if (pDist < blastRadius * 0.85 && pDist > 0.01) {
      const falloff = 1 - pDist / (blastRadius * 0.85);
      this.player.vx += (pdx / pDist) * 340 * falloff;
      this.player.vy += (pdy / pDist) * 280 * falloff - 160 * falloff;
      if (pDist < 70) {
        this.damagePlayer(15, (pdx / pDist) * 220, -220);
      }
    }
  }

  private updateAutomatons(dt: number): void {
    const p = this.player;
    const pCx = p.x + p.w / 2;
    const pCy = p.y + p.h / 2;

    for (const a of this.automatons) {
      if (!a.alive) continue;
      if (a.hitFlash > 0) a.hitFlash = Math.max(0, a.hitFlash - dt * 5);
      a.animPhase = (a.animPhase ?? 0) + dt * (a.state === 'charge' ? 24 : 11);

      const aCx = a.x + a.w / 2;
      const aCy = a.y + a.h / 2;
      const dx = pCx - aCx;
      const dy = pCy - aCy;
      const dist = Math.hypot(dx, dy);

      if (a.state === 'patrol') {
        a.x += a.facing * 82 * dt;
        if (a.x <= a.patrolMinX) {
          a.x = a.patrolMinX;
          a.facing = 1;
        } else if (a.x + a.w >= a.patrolMaxX) {
          a.x = a.patrolMaxX - a.w;
          a.facing = -1;
        }

        // Telegraph windup when player enters line of sight
        if (Math.abs(dx) < 250 && Math.abs(dy) < 65) {
          a.facing = dx >= 0 ? 1 : -1;
          a.state = 'windup';
          a.stateTimer = 0.58;
        }
      } else if (a.state === 'windup') {
        a.stateTimer -= dt;
        if (a.stateTimer <= 0) {
          a.state = 'charge';
          a.stateTimer = 0.65;
          a.vx = a.facing * 290;
        }
      } else if (a.state === 'charge') {
        a.stateTimer -= dt;
        a.x += a.vx * dt;
        if (a.x <= a.patrolMinX || a.x + a.w >= a.patrolMaxX || a.stateTimer <= 0) {
          a.x = Math.max(a.patrolMinX, Math.min(a.patrolMaxX - a.w, a.x));
          a.state = 'stunned';
          a.stateTimer = 0.55;
        }
      } else if (a.state === 'stunned') {
        a.stateTimer -= dt;
        if (a.stateTimer <= 0) {
          a.state = 'patrol';
        }
      }

      // Dynamic bodies hitting ant monster (heavy weight or fast sphere)
      for (const b of this.bodies) {
        if (b.id === p.carriedBodyId) continue;
        if (
          b.x < a.x + a.w &&
          b.x + b.w > a.x &&
          b.y < a.y + a.h &&
          b.y + b.h > a.y
        ) {
          const speed = Math.hypot(b.vx, b.vy);
          const momentum = b.mass * speed;
          if (momentum > 4200 || (b.kind === 'iron_weight' && b.vy > 140)) {
            a.hp -= b.kind === 'iron_weight' ? 2 : 1;
            a.hitFlash = 1;
            a.state = 'stunned';
            a.stateTimer = 0.9;
            b.vx *= -0.45;
            b.vy = -180;
            this.hitstopTimer = 0.04;
            this.triggerShake(6, 0.2);
            gameAudio.playImpact('iron', 0.9);
            this.spawnBurst(aCx, aCy, 12, '#F59E0B', 'spark');
            if (a.hp <= 0) {
              this.defeatAutomaton(a);
            }
          }
        }
      }

      if (!a.alive) continue;

      // Player vs Ant Monster
      if (
        p.x < a.x + a.w &&
        p.x + p.w > a.x &&
        p.y < a.y + a.h &&
        p.y + p.h > a.y
      ) {
        // Stomp from above kills the ant immediately, bounces player & refreshes double jump!
        if (p.vy > 0 && p.y + p.h - a.y < 24) {
          p.y = a.y - p.h;
          p.vy = -460;
          p.jumpsRemaining = 1;
          p.squashX = 1.24;
          p.squashY = 0.76;
          a.hp = 0;
          a.hitFlash = 1;
          this.hitstopTimer = 0.04;
          this.triggerShake(5, 0.16);
          gameAudio.playStomp();
          this.spawnBurst(aCx, a.y + 8, 14, '#EF4444', 'spark');
          this.defeatAutomaton(a);
        } else if (dist < 48) {
          const pushDir = pCx < aCx ? -1 : 1;
          this.damagePlayer(20, pushDir * 290, -260);
        }
      }
    }
  }

  private defeatAutomaton(a: Automaton): void {
    a.alive = false;
    this.spawnBurst(a.x + a.w / 2, a.y + a.h / 2, 20, '#F59E0B', 'spark');
    this.pickups.push({
      id: `auto_drop_${++this.bodyCounter}`,
      x: a.x + a.w / 2,
      y: a.y + a.h / 2,
      itemId: 'scrap_iron',
      quantity: 1,
      bobPhase: 0,
      collected: false,
    });
  }

  private updatePickupsAndRelics(dt: number): void {
    const pCx = this.player.x + this.player.w / 2;
    const pCy = this.player.y + this.player.h / 2;

    for (const pk of this.pickups) {
      if (pk.collected) continue;
      pk.bobPhase += dt * 3;
      if (Math.hypot(pk.x - pCx, pk.y - pCy) < 38) {
        if (addItemToSlots(this.slots, pk.itemId, pk.quantity)) {
          pk.collected = true;
          gameAudio.playPickup(false);
          this.spawnBurst(pk.x, pk.y, 10, ITEMS[pk.itemId].accentColor, 'spark');
        }
      }
    }

    for (const rel of this.relics) {
      if (rel.collected) continue;
      rel.bobPhase += dt * 2.6;
      if (Math.hypot(rel.x - pCx, rel.y - pCy) < 36) {
        rel.collected = true;
        gameAudio.playPickup(true);
        this.spawnBurst(rel.x, rel.y, 16, '#FBBF24', 'spark');
      }
    }

    for (const flag of this.flags) {
      flag.wavePhase += dt * 4.5;
      if (flag.bonusTimer && flag.bonusTimer > 0) {
        flag.bonusTimer = Math.max(0, flag.bonusTimer - dt);
      }
      if (flag.collected) continue;

      // Flag rectangle sits near the top of the pole so player must jump/double-jump to grab it
      const flagLeft = flag.x - 10;
      const flagRight = flag.x + 74;
      const flagTop = flag.baseY - flag.poleHeight + 8;
      const flagBottom = flagTop + 56;
      const p = this.player;

      if (
        p.x + p.w > flagLeft &&
        p.x < flagRight &&
        p.y + p.h > flagTop &&
        p.y < flagBottom
      ) {
        flag.collected = true;
        flag.bonusTimer = 2.4;
        p.hp += flag.bonusHp;
        if (p.hp > p.maxHp) {
          p.maxHp = p.hp;
        }
        gameAudio.playPickup(true);
        this.spawnBurst(flag.x + 34, flagTop + 24, 16, '#009C3B', 'spark');
        this.spawnBurst(flag.x + 34, flagTop + 24, 14, '#FFDF00', 'spark');
        this.spawnBurst(flag.x + 34, flagTop + 24, 1, '#009C3B', 'ring');
      }
    }

    this.portal.pulsePhase += dt * 3;
  }

  private updateContextHint(): void {
    const pCx = this.player.x + this.player.w / 2;
    const pCy = this.player.y + this.player.h / 2;

    if (this.player.carriedBodyId) {
      this.contextHint = '[E] Soltar objeto';
      return;
    }

    for (const b of this.bodies) {
      if (Math.hypot(b.x + b.w / 2 - pCx, b.y + b.h / 2 - pCy) < 76) {
        const label = b.pickupItemId ? ITEMS[b.pickupItemId].shortLabel : 'Objeto';
        this.contextHint = `[E] Guardar ${label} (${b.mass} kg)`;
        return;
      }
    }

    const active = this.slots[this.activeHotbarIndex];
    if (active?.itemId === 'grapple_hook') {
      const hasRing = this.anchorRings.some((r) => Math.hypot(r.x - pCx, r.y - pCy) <= 440);
      if (hasRing) {
        this.contextHint = this.player.grapple.active
          ? '[Clique Esq. / Espaço] Soltar Gancho'
          : '[Q] Enganchar no Anel';
        return;
      }
    }

    // Nearby sign
    for (const s of this.signs) {
      if (Math.hypot(s.x - pCx, s.y - pCy) < 135) {
        this.contextHint = s.text;
        return;
      }
    }

    this.contextHint = null;
  }

  private updateScarf(dt: number): void {
    const p = this.player;
    const anchorX = p.x + p.w / 2 - p.facing * 5;
    const anchorY = p.y + 13;

    p.scarf[0].x = anchorX;
    p.scarf[0].y = anchorY;

    for (let i = 1; i < p.scarf.length; i++) {
      const n = p.scarf[i];
      const vx = (n.x - n.oldX) * 0.88 - p.facing * 0.4;
      const vy = (n.y - n.oldY) * 0.88 + 18 * dt;
      n.oldX = n.x;
      n.oldY = n.y;
      n.x += vx;
      n.y += vy;
    }

    // Distance constraints
    const segLen = 5.5;
    for (let iter = 0; iter < 4; iter++) {
      p.scarf[0].x = anchorX;
      p.scarf[0].y = anchorY;
      for (let i = 1; i < p.scarf.length; i++) {
        const prev = p.scarf[i - 1];
        const curr = p.scarf[i];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - segLen) / d;
        curr.x -= dx * diff;
        curr.y -= dy * diff;
      }
    }
  }

  private updateCamera(dt: number, viewWidth: number, viewHeight: number): void {
    if (viewWidth <= 0 || viewHeight <= 0) return;
    const targetX =
      this.player.x +
      this.player.w / 2 +
      this.player.vx * 0.18 -
      viewWidth / 2;
    const targetY =
      this.player.y +
      this.player.h / 2 +
      this.player.vy * 0.08 -
      viewHeight * 0.54;

    const maxCamX = Math.max(0, this.level.width - viewWidth);
    const maxCamY = Math.max(0, this.level.height - viewHeight);

    const clampedX = Math.max(0, Math.min(maxCamX, targetX));
    const clampedY = Math.max(0, Math.min(maxCamY, targetY));

    const smooth = 1 - Math.exp(-7.5 * dt);
    this.cameraX += (clampedX - this.cameraX) * smooth;
    this.cameraY += (clampedY - this.cameraY) * smooth;
  }

  private damagePlayer(amount: number, knockVx: number, knockVy: number): void {
    const p = this.player;
    if (p.invulnTimer > 0) return;
    p.hp = Math.max(0, p.hp - amount);
    p.invulnTimer = 1.05;
    p.hitFlash = 1;
    p.vx = knockVx;
    p.vy = knockVy;
    p.grapple.active = false;
    this.hitstopTimer = 0.05;
    this.triggerShake(9, 0.25);
    gameAudio.playDamage();
    this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, 12, '#EF4444', 'spark');

    if (p.hp <= 0) {
      this.onGameOver?.();
    }
  }

  private emitMaterialImpact(b: PhysicsBody, speed: number): void {
    const intensity = Math.min(1, (speed * Math.sqrt(b.mass)) / 2400);
    const mat =
      b.kind === 'iron_weight' || b.kind === 'boulder'
        ? 'iron'
        : b.kind === 'rubber_sphere'
          ? 'rubber'
          : 'wood';
    gameAudio.playImpact(mat, intensity);
    if (intensity > 0.38) {
      this.spawnBurst(
        b.x + b.w / 2,
        b.y + b.h,
        6,
        mat === 'iron' ? '#94A3B8' : mat === 'rubber' ? '#F59E0B' : '#C2854C',
        'dust'
      );
      if (b.mass >= 55 && intensity > 0.6) {
        this.triggerShake(5, 0.14);
      }
    }
  }

  private triggerShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  private spawnBurst(
    x: number,
    y: number,
    count: number,
    color: string,
    kind: Particle['kind']
  ): void {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const pt = this.particles[i];
      if (!pt.active) {
        pt.active = true;
        pt.x = x;
        pt.y = y;
        pt.kind = kind;
        pt.color = color;
        if (kind === 'ring') {
          pt.vx = 0;
          pt.vy = 0;
          pt.size = 14;
          pt.maxLife = 0.36;
          pt.life = 0.36;
          pt.gravity = 0;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const spd =
            kind === 'spark'
              ? 90 + Math.random() * 240
              : kind === 'stone'
                ? 70 + Math.random() * 220
                : 40 + Math.random() * 130;
          pt.vx = Math.cos(angle) * spd;
          pt.vy = Math.sin(angle) * spd - (kind === 'dust' ? 40 : 90);
          pt.size = kind === 'stone' ? 4 + Math.random() * 5 : 2.5 + Math.random() * 3.5;
          pt.maxLife = 0.35 + Math.random() * 0.4;
          pt.life = pt.maxLife;
          pt.gravity = kind === 'dust' ? 80 : 520;
        }
        spawned++;
      }
    }
  }

  private updateParticles(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      if (pt.kind === 'ring') {
        pt.size += 460 * dt;
      } else {
        pt.vy += pt.gravity * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
      }
    }
  }

  private castFireball(viewWidth: number, viewHeight: number, input: InputState): void {
    const p = this.player;
    const px = p.x + p.w / 2;
    const py = p.y + p.h * 0.42;
    let dx = p.facing;
    let dy = -0.08;

    if (input.mouseActive && viewWidth > 0 && viewHeight > 0) {
      const worldX = input.mouseScreenX + this.cameraX;
      const worldY = input.mouseScreenY + this.cameraY;
      const rdx = worldX - px;
      const rdy = worldY - py;
      const dist = Math.hypot(rdx, rdy);
      if (dist > 8) {
        dx = rdx / dist;
        dy = rdy / dist;
        p.facing = dx >= 0 ? 1 : -1;
      }
    }

    const speed = 620;
    this.fireballs.push({
      id: `fb_${++this.bodyCounter}`,
      x: px + dx * 18,
      y: py + dy * 18,
      vx: dx * speed + p.vx * 0.25,
      vy: dy * speed,
      radius: 8,
      life: 1.8,
      maxLife: 1.8,
      trailTimer: 0,
    });
    this.fireCooldown = 0.22;
    gameAudio.playFireball();
    this.spawnBurst(px + dx * 18, py + dy * 18, 6, '#FB923C', 'spark');
  }

  private updateFireballs(dt: number): void {
    const remaining: Fireball[] = [];

    for (const fb of this.fireballs) {
      fb.life -= dt;
      if (fb.life <= 0) continue;

      fb.vy += 220 * dt; // Slight realistic arc
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      fb.trailTimer += dt;
      if (fb.trailTimer >= 0.025) {
        fb.trailTimer = 0;
        this.spawnBurst(fb.x, fb.y, 1, '#F97316', 'spark');
      }

      // Check water extinguish
      let extinguished = false;
      for (const wz of this.waterZones) {
        if (fb.x > wz.x && fb.x < wz.x + wz.w && fb.y > wz.y && fb.y < wz.y + wz.h) {
          this.spawnBurst(fb.x, fb.y, 8, '#93C5FD', 'water');
          extinguished = true;
          break;
        }
      }
      if (extinguished) continue;

      // Check ant monster hits!
      let hitAnt = false;
      for (const a of this.automatons) {
        if (!a.alive) continue;
        const nearestX = Math.max(a.x, Math.min(fb.x, a.x + a.w));
        const nearestY = Math.max(a.y, Math.min(fb.y, a.y + a.h));
        if (Math.hypot(fb.x - nearestX, fb.y - nearestY) <= fb.radius + 4) {
          a.hp = 0;
          a.hitFlash = 1;
          this.hitstopTimer = 0.035;
          this.triggerShake(5, 0.16);
          gameAudio.playFireballHit();
          this.spawnBurst(a.x + a.w / 2, a.y + a.h / 2, 18, '#F97316', 'spark');
          this.spawnBurst(fb.x, fb.y, 1, '#FBBF24', 'ring');
          this.defeatAutomaton(a);
          hitAnt = true;
          break;
        }
      }
      if (hitAnt) continue;

      // Check platform collisions
      let hitWall = false;
      for (const plat of this.platforms) {
        if (plat.broken) continue;
        if (
          fb.x + fb.radius > plat.x &&
          fb.x - fb.radius < plat.x + plat.w &&
          fb.y + fb.radius > plat.y &&
          fb.y - fb.radius < plat.y + plat.h
        ) {
          this.spawnBurst(fb.x, fb.y, 10, '#F59E0B', 'spark');
          hitWall = true;
          break;
        }
      }
      if (hitWall) continue;

      // Nudge dynamic bodies or detonate seismic charges on fireball hit
      let hitBody = false;
      for (const b of this.bodies) {
        if (b.id === this.player.carriedBodyId) continue;
        if (
          fb.x + fb.radius > b.x &&
          fb.x - fb.radius < b.x + b.w &&
          fb.y + fb.radius > b.y &&
          fb.y - fb.radius < b.y + b.h
        ) {
          const impulse = 180 / Math.sqrt(b.mass / 15);
          b.vx += Math.sign(fb.vx) * impulse;
          b.vy -= 80;
          b.hitFlash = 0.8;
          if (b.kind === 'seismic_charge') {
            b.fuseTimer = 0;
          }
          this.spawnBurst(fb.x, fb.y, 10, '#F97316', 'spark');
          hitBody = true;
          break;
        }
      }
      if (hitBody) continue;

      remaining.push(fb);
    }

    this.fireballs = remaining;
  }
}
