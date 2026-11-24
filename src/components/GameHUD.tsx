import React from 'react';
import { Backpack, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { HOTBAR_SIZE, ITEMS } from '../game/items';
import { HudSnapshot } from '../game/types';
import { ItemIcon } from './ItemIcon';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onResetChamber: () => void;
  onPause: () => void;
  onSelectHotbar: (index: number) => void;
  onDropHotbarSlot: (index: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  muted,
  onToggleMute,
  onOpenInventory,
  onResetChamber,
  onPause,
  onSelectHotbar,
  onDropHotbarSlot,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const activeSlot = hud.slots[hud.activeHotbarIndex];
  const activeDef = activeSlot ? ITEMS[activeSlot.itemId] : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4">
      {/* Top Perimeter Status Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Cluster */}
        <div className="bg-[#0F1623]/92 border border-slate-700/70 rounded-lg px-3.5 py-2.5 shadow-lg">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="font-semibold text-amber-400 tracking-wide">
              {hud.levelName}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-slate-200">
              {formatTime(hud.elapsedSeconds)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-4">
            {/* Health bar + explicit integer readout */}
            <div className="flex items-center gap-2">
              <div className="w-28 h-2.5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-transform duration-150 origin-left ${
                    hpPercent > 40 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ transform: `scaleX(${hpPercent / 100})` }}
                />
              </div>
              <span className="font-mono text-xs font-bold tabular-nums text-slate-100">
                {hud.hp}/{hud.maxHp} PV
              </span>
            </div>

            <span aria-hidden="true" className="text-slate-600">·</span>

            {/* Relics */}
            <div className="flex items-center gap-1.5 text-xs">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden="true">
                <polygon points="8,1 14,8 8,15 2,8" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.2" />
              </svg>
              <span className="font-mono font-bold tabular-nums text-amber-300">
                {hud.relicsCollected}/{hud.relicsTotal}
              </span>
            </div>

            {hud.carriedItemLabel && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs text-amber-300 font-medium tabular-nums">
                  Carregando: {hud.carriedItemLabel} ({hud.carriedMassKg} kg)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenInventory}
            className="h-10 px-3 bg-[#0F1623]/92 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-100 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            title="Abrir Mochila e Oficina (Tab)"
          >
            <Backpack className="w-4 h-4 text-amber-400" />
            <span>Mochila</span>
            <span className="font-mono text-[11px] text-slate-400">[Tab]</span>
          </button>

          <button
            type="button"
            onClick={onResetChamber}
            className="h-10 w-10 bg-[#0F1623]/92 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            title="Reiniciar Câmara (R)"
            aria-label="Reiniciar Câmara"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="h-10 w-10 bg-[#0F1623]/92 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            title={muted ? 'Ativar Som' : 'Silenciar Som'}
            aria-label={muted ? 'Ativar Som' : 'Silenciar Som'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            className="h-10 w-10 bg-[#0F1623]/92 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            title="Pausar (Esc)"
            aria-label="Pausar"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Center Hotbar */}
      <div className="flex flex-col items-center gap-1.5">
        {activeDef && (
          <div className="bg-[#0F1623]/92 border border-slate-700/70 rounded-md px-3 py-1 text-xs text-slate-200 flex items-center gap-2">
            <span className="font-semibold text-amber-300">{activeDef.name}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-slate-300">{activeDef.massKg} kg</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{activeDef.buoyancyLabel}</span>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0F1623]/95 border border-slate-700/80 rounded-xl p-1.5 shadow-xl">
          {Array.from({ length: HOTBAR_SIZE }).map((_, idx) => {
            const slot = hud.slots[idx];
            const isActive = hud.activeHotbarIndex === idx;
            const def = slot ? ITEMS[slot.itemId] : null;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectHotbar(idx)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectHotbar(idx);
                  onDropHotbarSlot(idx);
                }}
                className={`relative w-14 h-14 rounded-lg border flex flex-col items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  isActive
                    ? 'bg-slate-800 border-amber-400 shadow-inner'
                    : 'bg-slate-900/90 border-slate-700/70 hover:border-slate-500'
                }`}
                title={def ? `${def.name} (${def.massKg} kg) · Botão dir. solta` : `Espaço ${idx + 1}`}
              >
                <span className="absolute top-1 left-1.5 font-mono text-[10px] font-bold tabular-nums text-slate-400">
                  {idx + 1}
                </span>

                {slot && (
                  <>
                    <ItemIcon itemId={slot.itemId} className="w-7 h-7" />
                    {slot.quantity > 1 && (
                      <span className="absolute bottom-0.5 right-1.5 font-mono text-[11px] font-bold tabular-nums text-slate-100">
                        {slot.quantity}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
