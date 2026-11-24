import { ITEMS } from './items';
import { InputState, PhysicsWorld } from './physicsEngine';
import { PhysicsBody, Platform } from './types';

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: PhysicsWorld,
  width: number,
  height: number,
  input: InputState
): void {
  ctx.save();

  // Deep twilight sky gradient (60% neutral dark canvas)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#0B1019');
  skyGrad.addColorStop(0.55, '#131B29');
  skyGrad.addColorStop(1, '#1A2333');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle parallax distant arches & giant clockwork gears
  renderParallaxBackdrop(ctx, world, width, height);

  // Apply camera + decaying screen shake
  let shakeX = 0;
  let shakeY = 0;
  if (world.shakeTime > 0) {
    const mag = world.shakeIntensity * (world.shakeTime / 0.35);
    shakeX = (Math.random() - 0.5) * mag * 2;
    shakeY = (Math.random() - 0.5) * mag * 2;
  }

  ctx.translate(-Math.round(world.cameraX + shakeX), -Math.round(world.cameraY + shakeY));

  // World signs (etched stone plaques)
  for (const s of world.signs) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 28, 41, 0.72)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(s.x - 10, s.y - 22, 20, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(s.x - 1, s.y - 2, 2, 10);
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('i', s.x, s.y - 7);
    ctx.restore();
  }

  // Exit Portal
  renderPortal(ctx, world);

  // Brazil Flagpoles
  renderBrazilFlags(ctx, world);

  // Anchor Rings & Grapple Range Hint
  renderAnchorRings(ctx, world);

  // Platforms
  for (const plat of world.platforms) {
    if (!plat.broken) {
      renderPlatform(ctx, plat);
    }
  }

  // Pressure Plates
  for (const plate of world.pressurePlates) {
    const depPx = plate.depression * 6;
    ctx.save();
    // Base housing
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(plate.x - 4, plate.y + 4, plate.w + 8, 8);
    // Active plate top
    ctx.fillStyle = plate.pressed ? '#10B981' : '#D97706';
    ctx.fillRect(plate.x, plate.y + depPx, plate.w, plate.h - depPx * 0.5);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plate.x, plate.y + depPx, plate.w, plate.h - depPx * 0.5);

    // Mass readout cleanly above plate
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = plate.pressed ? '#34D399' : '#FBBF24';
    ctx.fillText(
      `${plate.currentMassKg}/${plate.requiredMassKg} kg`,
      plate.x + plate.w / 2,
      plate.y - 8
    );
    ctx.restore();
  }

  // Seesaws
  for (const s of world.seesaws) {
    ctx.save();
    // Fulcrum pedestal
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(s.pivotX - 18, s.pivotY + 64);
    ctx.lineTo(s.pivotX + 18, s.pivotY + 64);
    ctx.lineTo(s.pivotX + 8, s.pivotY);
    ctx.lineTo(s.pivotX - 8, s.pivotY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotating plank
    ctx.translate(s.pivotX, s.pivotY);
    ctx.rotate(s.angle);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(-s.halfLength, -s.thickness / 2, s.halfLength * 2, s.thickness);
    ctx.strokeStyle = '#D99B38';
    ctx.lineWidth = 2;
    ctx.strokeRect(-s.halfLength, -s.thickness / 2, s.halfLength * 2, s.thickness);

    // Brass pivot wheel
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#D99B38';
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Spring Pads
  for (const sp of world.springPads) {
    const squish = sp.compression * 7;
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(sp.x, sp.y + sp.h - 5, sp.w, 5);
    // Coils
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sp.x + 12, sp.y + sp.h - 5);
    ctx.lineTo(sp.x + sp.w - 12, sp.y + 6 + squish);
    ctx.moveTo(sp.x + sp.w - 12, sp.y + sp.h - 5);
    ctx.lineTo(sp.x + 12, sp.y + 6 + squish);
    ctx.stroke();
    // Top launch pad
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.roundRect(sp.x, sp.y + squish, sp.w, 7, 3);
    ctx.fill();
    ctx.restore();
  }

  // Pickups & Relics
  renderPickupsAndRelics(ctx, world);

  // Dynamic Physics Bodies
  for (const b of world.bodies) {
    renderPhysicsBody(ctx, b, world);
  }

  // Automatons
  renderAutomatons(ctx, world);

  // Pendulums
  renderPendulums(ctx, world);

  // Fireballs
  for (const fb of world.fireballs) {
    ctx.save();
    const grad = ctx.createRadialGradient(fb.x, fb.y, 2, fb.x, fb.y, fb.radius * 2.2);
    grad.addColorStop(0, '#FEF08A');
    grad.addColorStop(0.45, '#F97316');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Aim Trajectory Preview (when holding throwable item in hotbar)
  renderAimTrajectory(ctx, world, width, height, input);

  // Grapple Rope + Player
  renderPlayer(ctx, world);

  // Water Zones (semi-transparent foreground overlay so submerged objects look underwater!)
  for (const wz of world.waterZones) {
    ctx.save();
    const waterGrad = ctx.createLinearGradient(0, wz.y, 0, wz.y + wz.h);
    waterGrad.addColorStop(0, 'rgba(37, 99, 235, 0.34)');
    waterGrad.addColorStop(1, 'rgba(15, 23, 42, 0.72)');
    ctx.fillStyle = waterGrad;

    ctx.beginPath();
    ctx.moveTo(wz.x, wz.y + wz.h);
    const step = 18;
    for (let wx = wz.x; wx <= wz.x + wz.w; wx += step) {
      const waveY = wz.y + Math.sin(wx * 0.03 + wz.wavePhase) * 3.5;
      ctx.lineTo(wx, waveY);
    }
    ctx.lineTo(wz.x + wz.w, wz.y + wz.h);
    ctx.closePath();
    ctx.fill();

    // Surface specular highlight
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let wx = wz.x; wx <= wz.x + wz.w; wx += step) {
      const waveY = wz.y + Math.sin(wx * 0.03 + wz.wavePhase) * 3.5;
      if (wx === wz.x) ctx.moveTo(wx, waveY);
      else ctx.lineTo(wx, waveY);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Pooled Particles
  for (const pt of world.particles) {
    if (!pt.active) continue;
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (pt.kind === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.restore();
  }

  // World-space subtle context prompt above player
  if (world.contextHint) {
    const px = world.player.x + world.player.w / 2;
    const py = world.player.y - 24;
    ctx.save();
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(world.contextHint).width;
    ctx.fillStyle = 'rgba(11, 15, 23, 0.84)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - textW / 2 - 10, py - 18, textW + 20, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.fillText(world.contextHint, px, py - 2);
    ctx.restore();
  }

  ctx.restore();
}

function renderParallaxBackdrop(
  ctx: CanvasRenderingContext2D,
  world: PhysicsWorld,
  width: number,
  height: number
): void {
  ctx.save();
  // Distant slowly turning observatory gears
  const gearCenters = [
    { x: 260, y: 210, r: 120, teeth: 14, speed: 0.12 },
    { x: 460, y: 310, r: 78, teeth: 10, speed: -0.18 },
    { x: 960, y: 185, r: 140, teeth: 16, speed: 0.09 },
    { x: 1480, y: 250, r: 105, teeth: 12, speed: -0.14 },
  ];

  for (const g of gearCenters) {
    const sx = g.x - world.cameraX * 0.25;
    const sy = g.y - world.cameraY * 0.18;
    if (sx < -200 || sx > width + 200) continue;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(world.time * g.speed);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.fillStyle = 'rgba(30, 41, 59, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let t = 0; t < g.teeth; t++) {
      const a = (t / g.teeth) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.07)';
      ctx.fillRect(-7, -g.r - 12, 14, 14);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, g.r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Vaulted stone pillars in background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
  const spacing = 320;
  const offset = -(world.cameraX * 0.4) % spacing;
  for (let px = offset - spacing; px < width + spacing; px += spacing) {
    ctx.fillRect(px, 0, 46, height);
    ctx.beginPath();
    ctx.arc(px + 23 + spacing / 2, 110, spacing / 2 - 23, Math.PI, 0, false);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 14;
    ctx.stroke();
  }
  ctx.restore();
}

function renderPlatform(ctx: CanvasRenderingContext2D, plat: Platform): void {
  ctx.save();
  if (plat.surface === 'stone') {
    ctx.fillStyle = '#252F3F';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    // Top trim highlight
    ctx.fillStyle = '#38465C';
    ctx.fillRect(plat.x, plat.y, plat.w, Math.min(8, plat.h));
    // Subtle masonry lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 1;
    for (let bx = plat.x + 48; bx < plat.x + plat.w; bx += 48) {
      ctx.beginPath();
      ctx.moveTo(bx, plat.y);
      ctx.lineTo(bx, plat.y + Math.min(plat.h, 52));
      ctx.stroke();
    }
  } else if (plat.surface === 'wood') {
    ctx.fillStyle = '#7C4D2B';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.fillStyle = '#A1683A';
    ctx.fillRect(plat.x, plat.y, plat.w, 5);
    ctx.strokeStyle = '#4A2C16';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
  } else if (plat.surface === 'ice') {
    const iceGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + 40);
    iceGrad.addColorStop(0, '#BAE6FD');
    iceGrad.addColorStop(0.25, '#38BDF8');
    iceGrad.addColorStop(1, '#1E3A5F');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    // Specular ice streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let ix = plat.x + 20; ix < plat.x + plat.w - 20; ix += 55) {
      ctx.beginPath();
      ctx.moveTo(ix, plat.y + 4);
      ctx.lineTo(ix + 22, plat.y + 4);
      ctx.stroke();
    }
  } else if (plat.surface === 'brass') {
    ctx.fillStyle = '#926724';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.fillStyle = '#D99B38';
    ctx.fillRect(plat.x, plat.y, plat.w, Math.min(5, plat.h));
    ctx.strokeStyle = '#452E0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    // Rivets
    ctx.fillStyle = '#FCD34D';
    if (plat.w >= 28 && plat.h >= 24) {
      ctx.fillRect(plat.x + 5, plat.y + 5, 3, 3);
      ctx.fillRect(plat.x + plat.w - 8, plat.y + 5, 3, 3);
    }
  } else if (plat.surface === 'cracked') {
    ctx.fillStyle = '#3B3438';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plat.x + 4, plat.y + 12);
    ctx.lineTo(plat.x + plat.w * 0.55, plat.y + plat.h * 0.36);
    ctx.lineTo(plat.x + plat.w * 0.3, plat.y + plat.h * 0.65);
    ctx.lineTo(plat.x + plat.w - 4, plat.y + plat.h - 14);
    ctx.stroke();
    ctx.strokeStyle = '#1E293B';
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
  }
  ctx.restore();
}

function renderPortal(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  const pt = world.portal;
  const cx = pt.x + pt.w / 2;
  const cy = pt.y + pt.h / 2;
  const pulse = Math.sin(pt.pulsePhase) * 0.5 + 0.5;

  ctx.save();
  // Outer brass archway
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#D99B38';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(pt.x - 4, pt.y - 4, pt.w + 8, pt.h + 4, [28, 28, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Inner swirling vortex
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, pt.h * 0.55);
  grad.addColorStop(0, '#FEF3C7');
  grad.addColorStop(0.45, `rgba(16, 185, 129, ${0.7 + pulse * 0.25})`);
  grad.addColorStop(1, 'rgba(6, 78, 59, 0.85)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(pt.x + 4, pt.y + 4, pt.w - 8, pt.h - 4, [24, 24, 2, 2]);
  ctx.fill();

  // Orbiting rune spark
  const ox = cx + Math.cos(pt.pulsePhase * 1.4) * 14;
  const oy = cy + Math.sin(pt.pulsePhase * 1.4) * 24;
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderBrazilFlags(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  for (const flag of world.flags) {
    const topY = flag.baseY - flag.poleHeight;
    const flagW = 68;
    const flagH = 44;
    const flagTop = topY + 14;
    const wave = Math.sin(flag.wavePhase) * 3;

    ctx.save();
    // Stone & brass pedestal base
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#D99B38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(flag.x - 14, flag.baseY - 12, 28, 12, 3);
    ctx.fill();
    ctx.stroke();

    // Tall flagpole
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(flag.x, flag.baseY - 12);
    ctx.lineTo(flag.x, topY);
    ctx.stroke();

    // Golden finial sphere at top
    ctx.fillStyle = '#FFDF00';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(flag.x, topY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Waving Brazil Flag cloth
    ctx.save();
    ctx.globalAlpha = flag.collected ? 0.55 : 1;

    // Green field (#009C3B)
    ctx.fillStyle = '#009C3B';
    ctx.beginPath();
    ctx.moveTo(flag.x + 2, flagTop);
    ctx.quadraticCurveTo(
      flag.x + flagW * 0.5,
      flagTop - wave,
      flag.x + flagW,
      flagTop + wave * 0.8
    );
    ctx.lineTo(flag.x + flagW, flagTop + flagH + wave * 0.8);
    ctx.quadraticCurveTo(
      flag.x + flagW * 0.5,
      flagTop + flagH - wave,
      flag.x + 2,
      flagTop + flagH
    );
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#065F46';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Yellow diamond (#FFDF00)
    const fCx = flag.x + flagW * 0.52;
    const fCy = flagTop + flagH * 0.5 + wave * 0.2;
    ctx.fillStyle = '#FFDF00';
    ctx.beginPath();
    ctx.moveTo(fCx, fCy - 14);
    ctx.lineTo(fCx + 22, fCy);
    ctx.lineTo(fCx, fCy + 14);
    ctx.lineTo(fCx - 22, fCy);
    ctx.closePath();
    ctx.fill();

    // Blue globe (#002776)
    ctx.fillStyle = '#002776';
    ctx.beginPath();
    ctx.arc(fCx, fCy, 9, 0, Math.PI * 2);
    ctx.fill();

    // White curved equatorial band
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fCx - 1, fCy + 4, 9.5, -Math.PI * 0.78, -Math.PI * 0.22);
    ctx.stroke();
    ctx.restore();

    // Subtle floating "+50 PV" prompt if uncollected, or celebration banner if collected
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    if (!flag.collected) {
      const bob = Math.sin(flag.wavePhase * 0.8) * 3;
      ctx.fillStyle = '#34D399';
      ctx.fillText('+50 PV', flag.x + flagW * 0.52, topY - 12 + bob);
    } else if (flag.bonusTimer && flag.bonusTimer > 0) {
      const lift = (2.4 - flag.bonusTimer) * 18;
      ctx.globalAlpha = Math.min(1, flag.bonusTimer);
      ctx.fillStyle = '#FFDF00';
      ctx.font = '800 14px "JetBrains Mono", monospace';
      ctx.fillText(`+${flag.bonusHp} PV BÔNUS!`, flag.x + flagW * 0.5, topY - 14 - lift);
    }

    ctx.restore();
  }
}

function renderAnchorRings(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  const active = world.slots[world.activeHotbarIndex];
  const grappleEquipped = active?.itemId === 'grapple_hook';
  const pCx = world.player.x + world.player.w / 2;
  const pCy = world.player.y + world.player.h / 2;

  for (const r of world.anchorRings) {
    const inRange = grappleEquipped && Math.hypot(r.x - pCx, r.y - pCy) <= 440;
    ctx.save();
    // Chain up to ceiling
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r.x, 0);
    ctx.lineTo(r.x, r.y - r.radius);
    ctx.stroke();

    if (inRange) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = inRange ? '#FBBF24' : '#D99B38';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderPendulums(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  for (const pend of world.pendulums) {
    const bobX = pend.pivotX + Math.sin(pend.angle) * pend.length;
    const bobY = pend.pivotY + Math.cos(pend.angle) * pend.length;

    ctx.save();
    // Telegraph swing arc
    if (pend.isHazard) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(
        pend.pivotX,
        pend.pivotY,
        pend.length,
        Math.PI / 2 - pend.driveAmp,
        Math.PI / 2 + pend.driveAmp
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Rod
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pend.pivotX, pend.pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pivot hub
    ctx.fillStyle = '#D99B38';
    ctx.beginPath();
    ctx.arc(pend.pivotX, pend.pivotY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Heavy bob
    ctx.fillStyle = pend.isHazard ? '#7F1D1D' : '#475569';
    ctx.strokeStyle = pend.isHazard ? '#EF4444' : '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bobX, bobY, pend.bobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner core
    ctx.fillStyle = pend.isHazard ? '#F59E0B' : '#94A3B8';
    ctx.beginPath();
    ctx.arc(bobX, bobY, pend.bobRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderPhysicsBody(
  ctx: CanvasRenderingContext2D,
  b: PhysicsBody,
  world: PhysicsWorld
): void {
  ctx.save();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(b.angle);

  if (b.kind === 'wood_crate') {
    ctx.fillStyle = '#A86E3E';
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.strokeStyle = '#5C381B';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    // Cross brace
    ctx.beginPath();
    ctx.moveTo(-b.w / 2 + 4, -b.h / 2 + 4);
    ctx.lineTo(b.w / 2 - 4, b.h / 2 - 4);
    ctx.stroke();
  } else if (b.kind === 'iron_weight') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('65kg', 0, 1);
  } else if (b.kind === 'rubber_sphere') {
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-b.radius + 3, -2, b.radius * 2 - 6, 4);
  } else if (b.kind === 'seismic_charge') {
    const blink = b.fuseTimer !== undefined && Math.sin(b.fuseTimer * 24) > 0;
    ctx.fillStyle = blink ? '#EF4444' : '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Boulder
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  if (b.hitFlash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${b.hitFlash * 0.55})`;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
  }

  ctx.restore();

  // Subtle highlight if carried
  if (world.player.carriedBodyId === b.id) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
    ctx.restore();
  }
}

function renderPickupsAndRelics(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  for (const pk of world.pickups) {
    if (pk.collected) continue;
    const def = ITEMS[pk.itemId];
    const yOff = Math.sin(pk.bobPhase) * 4;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = def.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pk.x - 13, pk.y - 13 + yOff, 26, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = def.accentColor;
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.shortLabel.slice(0, 3).toUpperCase(), pk.x, pk.y + yOff);
    ctx.restore();
  }

  for (const rel of world.relics) {
    if (rel.collected) continue;
    const yOff = Math.sin(rel.bobPhase) * 5;
    ctx.save();
    ctx.translate(rel.x, rel.y + yOff);
    ctx.rotate(world.time * 1.4);

    // Outer amber glow
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Diamond amber gear relic
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function renderAutomatons(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  for (const a of world.automatons) {
    if (!a.alive) continue;
    ctx.save();
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h / 2;
    const phase = a.animPhase ?? 0;

    // Windup telegraph glow & exclamation!
    if (a.state === 'windup') {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.font = '800 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', cx, a.y - 10);
    }

    ctx.translate(cx, cy);
    ctx.scale(a.facing, 1);

    const shellFill =
      a.hitFlash > 0
        ? '#FFFFFF'
        : a.state === 'charge'
          ? '#7F1D1D'
          : '#3F1D1B';
    const shellStroke = a.state === 'charge' ? '#EF4444' : '#D97706';

    // 6 Scuttling Ant Legs (3 front/back alternating pairs)
    ctx.strokeStyle = a.hitFlash > 0 ? '#FFFFFF' : '#B45309';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    const legOffsets = [-8, 0, 7];
    legOffsets.forEach((lx, idx) => {
      const swing = Math.sin(phase + idx * 2.1) * 4.5;
      // Near-side leg
      ctx.beginPath();
      ctx.moveTo(lx, 2);
      ctx.lineTo(lx - 2 + swing * 0.5, 9);
      ctx.lineTo(lx + swing, a.h / 2);
      ctx.stroke();
      // Far-side leg
      ctx.beginPath();
      ctx.moveTo(lx + 2, 1);
      ctx.lineTo(lx + 3 - swing * 0.4, 8);
      ctx.lineTo(lx + 1 - swing, a.h / 2);
      ctx.stroke();
    });

    // Abdomen (rear bulbous segment)
    ctx.fillStyle = shellFill;
    ctx.strokeStyle = shellStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-11, -1, 10, 7.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Abdomen chitin stripes
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(-14, 5);
    ctx.moveTo(-8, -7);
    ctx.lineTo(-9, 5);
    ctx.stroke();

    // Thorax (middle segment)
    ctx.fillStyle = shellFill;
    ctx.strokeStyle = shellStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(1, 0, 6.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head (front segment)
    ctx.beginPath();
    ctx.ellipse(12, -2, 7.5, 6.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Curved Antennae
    const antBob = Math.sin(phase * 0.8) * 1.8;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(14, -7);
    ctx.quadraticCurveTo(18, -14 + antBob, 23, -12 + antBob);
    ctx.moveTo(12, -7);
    ctx.quadraticCurveTo(14, -15 - antBob, 19, -15 - antBob);
    ctx.stroke();

    // Mandibles
    const bite = a.state === 'windup' || a.state === 'charge' ? 2.5 : Math.sin(phase) * 1.2;
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(23, -2 - bite);
    ctx.moveTo(18, 2);
    ctx.lineTo(23, 4 + bite);
    ctx.stroke();

    // Glowing Eye
    ctx.fillStyle = a.state === 'windup' || a.state === 'charge' ? '#EF4444' : '#FBBF24';
    ctx.beginPath();
    ctx.arc(14, -3.5, 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function renderAimTrajectory(
  ctx: CanvasRenderingContext2D,
  world: PhysicsWorld,
  viewWidth: number,
  viewHeight: number,
  input: InputState
): void {
  const active = world.slots[world.activeHotbarIndex];
  if (!active || !input.mouseActive) return;
  const def = ITEMS[active.itemId];
  if (def.category !== 'throwable' && def.id !== 'wood_crate') return;

  const aim = world.getAimVector(viewWidth, viewHeight, input);
  const speedScale =
    active.itemId === 'rubber_sphere'
      ? 640
      : active.itemId === 'seismic_charge'
        ? 560
        : active.itemId === 'iron_weight'
          ? 380
          : 430;
  const vx = world.player.vx * 0.4 + aim.dx * speedScale * aim.power;
  const vy = world.player.vy * 0.3 + aim.dy * speedScale * aim.power - 80;

  const startX = world.player.x + world.player.w / 2 + world.player.facing * 22;
  const startY = world.player.y + world.player.h * 0.42 - 10;

  ctx.save();
  ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
  for (let i = 1; i <= 9; i++) {
    const t = i * 0.065;
    const px = startX + vx * t;
    const py = startY + vy * t + 0.5 * 1350 * t * t;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1.5, 4 - i * 0.25), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderPlayer(ctx: CanvasRenderingContext2D, world: PhysicsWorld): void {
  const p = world.player;

  // Grapple rope
  if (p.grapple.active) {
    ctx.save();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y + p.h * 0.35);
    ctx.lineTo(p.grapple.anchorX, p.grapple.anchorY);
    ctx.stroke();
    ctx.restore();
  }

  // Verlet Scarf
  if (p.scarf.length > 1) {
    ctx.save();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.scarf[0].x, p.scarf[0].y);
    for (let i = 1; i < p.scarf.length; i++) {
      ctx.lineTo(p.scarf[i].x, p.scarf[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Blink when invulnerable
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 16) % 2 === 0) {
    return;
  }

  ctx.save();
  const footX = p.x + p.w / 2;
  const footY = p.y + p.h;
  ctx.translate(footX, footY);
  ctx.scale(p.squashX, p.squashY);

  // Legs animated stride
  const stride = p.grounded && Math.abs(p.vx) > 20 ? Math.sin(p.walkCycle) * 5 : 0;
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-9 + stride, -12, 6, 12);
  ctx.fillRect(3 - stride, -12, 6, 12);

  // Coat / Torso
  ctx.fillStyle = p.hitFlash > 0 ? '#FFFFFF' : '#334155';
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-13, -32, 26, 22, 5);
  ctx.fill();
  ctx.stroke();

  // Head & Brass Goggles
  ctx.fillStyle = p.hitFlash > 0 ? '#FFFFFF' : '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(-10, -44, 20, 15, 5);
  ctx.fill();

  // Goggles strap + glowing lens
  ctx.fillStyle = '#475569';
  ctx.fillRect(-10, -40, 20, 5);
  ctx.fillStyle = '#FBBF24';
  const lensX = p.facing === 1 ? 2 : -8;
  ctx.fillRect(lensX, -40, 7, 5);

  ctx.restore();
}
