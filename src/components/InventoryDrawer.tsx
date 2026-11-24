import React, { useState } from 'react';
import { Hammer, X } from 'lucide-react';
import {
  countItemInSlots,
  CRAFTING_RECIPES,
  HOTBAR_SIZE,
  ITEMS,
} from '../game/items';
import { CraftingRecipe, HudSnapshot } from '../game/types';
import { ItemIcon } from './ItemIcon';

interface InventoryDrawerProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSwapSlots: (indexA: number, indexB: number) => void;
  onDropSlot: (slotIndex: number) => void;
  onCraft: (recipe: CraftingRecipe) => void;
}

export const InventoryDrawer: React.FC<InventoryDrawerProps> = ({
  hud,
  onClose,
  onSwapSlots,
  onDropSlot,
  onCraft,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(hud.activeHotbarIndex);

  const selectedSlot = hud.slots[selectedIdx];
  const selectedDef = selectedSlot ? ITEMS[selectedSlot.itemId] : null;

  const handleSlotClick = (idx: number) => {
    if (selectedIdx === idx) return;
    const currentHasItem = Boolean(hud.slots[selectedIdx]);
    const targetHasItem = Boolean(hud.slots[idx]);

    // If user clicked a populated slot first, allow inspecting or swapping if shift/second click?
    // Cleanest UX: click an item to inspect; click "Mover para Barra" or click another slot while in swap mode!
    // Even simpler: if selected slot has an item and user clicks an EMPTY slot or hotbar slot directly while swapMode is active, swap!
    // Let's provide explicit "Selecionar / Mover" toggle + instant click-to-inspect!
    if (swapSource !== null) {
      onSwapSlots(swapSource, idx);
      setSwapSource(null);
      setSelectedIdx(idx);
      return;
    }

    if (!targetHasItem && currentHasItem) {
      onSwapSlots(selectedIdx, idx);
      setSelectedIdx(idx);
      return;
    }

    setSelectedIdx(idx);
  };

  const [swapSource, setSwapSource] = useState<number | null>(null);

  const handleRightClickSlot = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    if (hud.slots[idx]) {
      onDropSlot(idx);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#070A10]/82 p-4"
      onContextMenu={(e) => {
        e.preventDefault();
        if (hud.slots[selectedIdx]) {
          onDropSlot(selectedIdx);
        }
      }}
    >
      <div className="w-full max-w-3xl bg-[#111827] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-100">
              Mochila &amp; Oficina Portátil
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              Massa armazenada: {hud.totalBackpackMassKg} kg · Clique esq. seleciona/move · Botão direito solta o item no mundo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar [Tab]</span>
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* Left: Slots */}
          <div className="md:col-span-7 flex flex-col gap-5">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Barra Rápida (Teclas 1–5)
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: HOTBAR_SIZE }).map((_, idx) => {
                  const slot = hud.slots[idx];
                  const isSel = selectedIdx === idx;
                  const isSwapSrc = swapSource === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotClick(idx)}
                      onContextMenu={(e) => handleRightClickSlot(e, idx)}
                      title={slot ? `${ITEMS[slot.itemId].name} (Botão dir. para soltar)` : undefined}
                      className={`relative h-16 rounded-lg border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                        isSwapSrc
                          ? 'bg-amber-950/50 border-amber-400'
                          : isSel
                            ? 'bg-slate-800 border-amber-400'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="absolute top-1 left-1.5 font-mono text-[10px] text-slate-400 tabular-nums">
                        {idx + 1}
                      </span>
                      {slot && (
                        <>
                          <ItemIcon itemId={slot.itemId} className="w-7 h-7" />
                          {slot.quantity > 1 && (
                            <span className="absolute bottom-0.5 right-1.5 font-mono text-xs font-bold text-slate-100 tabular-nums">
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

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Compartimento Interno (10 espaços)
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, offset) => {
                  const idx = HOTBAR_SIZE + offset;
                  const slot = hud.slots[idx];
                  const isSel = selectedIdx === idx;
                  const isSwapSrc = swapSource === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotClick(idx)}
                      onContextMenu={(e) => handleRightClickSlot(e, idx)}
                      title={slot ? `${ITEMS[slot.itemId].name} (Botão dir. para soltar)` : undefined}
                      className={`relative h-16 rounded-lg border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                        isSwapSrc
                          ? 'bg-amber-950/50 border-amber-400'
                          : isSel
                            ? 'bg-slate-800 border-amber-400'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {slot && (
                        <>
                          <ItemIcon itemId={slot.itemId} className="w-7 h-7" />
                          {slot.quantity > 1 && (
                            <span className="absolute bottom-0.5 right-1.5 font-mono text-xs font-bold text-slate-100 tabular-nums">
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

            {/* Crafting Section */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2.5">
                <Hammer className="w-3.5 h-3.5" />
                <span>Combinar Materiais</span>
              </div>
              <div className="flex flex-col gap-2">
                {CRAFTING_RECIPES.map((recipe) => {
                  const canCraft = recipe.ingredients.every(
                    (ing) => countItemInSlots(hud.slots, ing.itemId) >= ing.quantity
                  );
                  const resultDef = ITEMS[recipe.resultId];
                  return (
                    <div
                      key={recipe.id}
                      className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemIcon itemId={recipe.resultId} className="w-6 h-6 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">
                            {resultDef.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {recipe.ingredients
                              .map(
                                (ing) =>
                                  `${ing.quantity}× ${ITEMS[ing.itemId].shortLabel} (${countItemInSlots(hud.slots, ing.itemId)})`
                              )
                              .join(' + ')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canCraft}
                        onClick={() => onCraft(recipe)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          canCraft
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Forjar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Physics Inspector */}
          <div className="md:col-span-5 bg-slate-900/75 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            {selectedDef && selectedSlot ? (
              <div>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <ItemIcon itemId={selectedSlot.itemId} className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{selectedDef.name}</h3>
                    <div className="text-xs text-slate-400 tabular-nums">
                      Quantidade: {selectedSlot.quantity} / {selectedDef.maxStack}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-3">
                  {selectedDef.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-md p-2">
                    <div className="text-slate-400">Massa</div>
                    <div className="font-mono font-bold text-slate-100 tabular-nums mt-0.5">
                      {selectedDef.massKg} kg
                    </div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-md p-2">
                    <div className="text-slate-400">Empuxo</div>
                    <div className="font-mono font-bold text-slate-100 tabular-nums mt-0.5">
                      {selectedDef.buoyancyLabel}
                    </div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-md p-2">
                    <div className="text-slate-400">Elasticidade</div>
                    <div className="font-mono font-bold text-slate-100 tabular-nums mt-0.5">
                      {Math.round(selectedDef.restitution * 100)}%
                    </div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-md p-2">
                    <div className="text-slate-400">Atrito</div>
                    <div className="font-mono font-bold text-slate-100 tabular-nums mt-0.5">
                      {selectedDef.friction.toFixed(2)} μ
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSwapSource(swapSource === selectedIdx ? null : selectedIdx)
                    }
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      swapSource === selectedIdx
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                    }`}
                  >
                    {swapSource === selectedIdx
                      ? 'Clique em outro espaço para trocar'
                      : 'Trocar de Espaço'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDropSlot(selectedIdx)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Soltar 1 unidade no mundo (Botão Dir.)
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 px-4">
                Selecione um item na Barra Rápida ou no Compartimento Interno para inspecionar suas propriedades físicas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
