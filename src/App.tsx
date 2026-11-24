import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import {
  GameOverModal,
  LevelCompleteModal,
  PauseModal,
} from './components/GameModals';
import { InventoryDrawer } from './components/InventoryDrawer';
import { TitleScreen } from './components/TitleScreen';
import { gameAudio } from './game/audio';
import { LEVELS } from './game/levels';
import { InputState, PhysicsWorld } from './game/physicsEngine';
import { renderWorld } from './game/renderer';
import { CraftingRecipe, GameState, HudSnapshot } from './game/types';

function createEmptyInput(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpHeld: false,
    jumpPressed: false,
    interactPressed: false,
    usePressed: false,
    useHeld: false,
    firePressed: false,
    mouseScreenX: 0,
    mouseScreenY: 0,
    mouseActive: false,
  };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [selectedTitleLevel, setSelectedTitleLevel] = useState<number>(0);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  // Track cumulative run stats across chambers
  const [runStats, setRunStats] = useState<{
    relicsByLevel: Record<number, number>;
    timeByLevel: Record<number, number>;
  }>({ relicsByLevel: {}, timeByLevel: {} });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<PhysicsWorld | null>(null);
  const inputRef = useRef<InputState>(createEmptyInput());
  const gameStateRef = useRef<GameState>('TITLE_MENU');
  const inventoryOpenRef = useRef<boolean>(false);

  if (!worldRef.current) {
    worldRef.current = new PhysicsWorld(0);
  }

  const [hud, setHud] = useState<HudSnapshot>(() =>
    worldRef.current!.getHudSnapshot()
  );

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    inventoryOpenRef.current = inventoryOpen;
  }, [inventoryOpen]);

  const syncHudNow = useCallback(() => {
    if (worldRef.current) {
      setHud(worldRef.current.getHudSnapshot());
    }
  }, []);

  const clearHeldInputs = useCallback(() => {
    const inp = inputRef.current;
    inp.left = false;
    inp.right = false;
    inp.up = false;
    inp.down = false;
    inp.jumpHeld = false;
    inp.jumpPressed = false;
    inp.interactPressed = false;
    inp.usePressed = false;
    inp.useHeld = false;
    inp.firePressed = false;
  }, []);

  const startLevel = useCallback(
    (levelIdx: number, resetRun = false) => {
      gameAudio.unlock();
      clearHeldInputs();
      const world = worldRef.current!;
      world.loadLevel(levelIdx);
      if (resetRun) {
        setRunStats({ relicsByLevel: {}, timeByLevel: {} });
      }
      setInventoryOpen(false);
      setGameState('PLAYING');
      setHud(world.getHudSnapshot());
    },
    [clearHeldInputs]
  );

  // Wire world completion / game-over callbacks
  useEffect(() => {
    const world = worldRef.current!;
    world.onLevelComplete = () => {
      const snap = world.getHudSnapshot();
      setRunStats((prev) => ({
        relicsByLevel: {
          ...prev.relicsByLevel,
          [snap.levelIndex]: Math.max(
            prev.relicsByLevel[snap.levelIndex] ?? 0,
            snap.relicsCollected
          ),
        },
        timeByLevel: {
          ...prev.timeByLevel,
          [snap.levelIndex]: snap.elapsedSeconds,
        },
      }));
      setHud(snap);
      setInventoryOpen(false);
      clearHeldInputs();
      if (snap.levelIndex >= LEVELS.length - 1) {
        setGameState('VICTORY');
      } else {
        setGameState('LEVEL_COMPLETE');
      }
    };
    world.onGameOver = () => {
      setHud(world.getHudSnapshot());
      setInventoryOpen(false);
      clearHeldInputs();
      setGameState('GAME_OVER');
    };
  }, [clearHeldInputs]);

  // Keyboard & Blur Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;

      if (gameStateRef.current === 'TITLE_MENU') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startLevel(selectedTitleLevel, true);
        }
        return;
      }

      if (code === 'Escape') {
        e.preventDefault();
        if (inventoryOpenRef.current) {
          setInventoryOpen(false);
          clearHeldInputs();
        } else if (gameStateRef.current === 'PLAYING') {
          setGameState('PAUSED');
          clearHeldInputs();
        } else if (gameStateRef.current === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (code === 'Tab' || code === 'KeyI') {
        if (gameStateRef.current === 'PLAYING') {
          e.preventDefault();
          setInventoryOpen((prev) => {
            const next = !prev;
            if (next) clearHeldInputs();
            return next;
          });
          syncHudNow();
        }
        return;
      }

      if (gameStateRef.current !== 'PLAYING' || inventoryOpenRef.current) {
        return;
      }

      const inp = inputRef.current;

      if (code === 'KeyA' || code === 'ArrowLeft') {
        inp.left = true;
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        inp.right = true;
      } else if (code === 'KeyW' || code === 'ArrowUp') {
        inp.up = true;
        if (!e.repeat && code === 'KeyW') {
          // Allow W to jump too if not grappling
          if (!worldRef.current?.player.grapple.active) {
            inp.jumpHeld = true;
            inp.jumpPressed = true;
          }
        }
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        inp.down = true;
      } else if (code === 'Space') {
        e.preventDefault();
        if (!e.repeat) inp.jumpPressed = true;
        inp.jumpHeld = true;
      } else if (code === 'KeyE' || code === 'KeyF') {
        if (!e.repeat) inp.interactPressed = true;
      } else if (code === 'KeyQ') {
        if (!e.repeat) inp.usePressed = true;
        inp.useHeld = true;
      } else if (code === 'KeyR') {
        if (!e.repeat && worldRef.current) {
          startLevel(worldRef.current.level.index, false);
        }
      } else if (
        code === 'Digit1' ||
        code === 'Digit2' ||
        code === 'Digit3' ||
        code === 'Digit4' ||
        code === 'Digit5'
      ) {
        const idx = Number(code.replace('Digit', '')) - 1;
        worldRef.current?.selectHotbar(idx);
        syncHudNow();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const inp = inputRef.current;
      if (code === 'KeyA' || code === 'ArrowLeft') inp.left = false;
      else if (code === 'KeyD' || code === 'ArrowRight') inp.right = false;
      else if (code === 'KeyW' || code === 'ArrowUp') {
        inp.up = false;
        if (code === 'KeyW') inp.jumpHeld = false;
      } else if (code === 'KeyS' || code === 'ArrowDown') inp.down = false;
      else if (code === 'Space') inp.jumpHeld = false;
      else if (code === 'KeyQ') inp.useHeld = false;
    };

    const onBlur = () => {
      clearHeldInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [clearHeldInputs, selectedTitleLevel, startLevel, syncHudNow]);

  // Isolated 60fps Canvas Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const canvas = canvasRef.current;
      const world = worldRef.current;
      if (canvas && world && gameStateRef.current !== 'TITLE_MENU') {
        resizeCanvas();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewW = canvas.clientWidth;
        const viewH = canvas.clientHeight;

        if (gameStateRef.current === 'PLAYING' && !inventoryOpenRef.current) {
          world.update(rawDt, inputRef.current, viewW, viewH);
          // Clear edge-triggered flags after consumption
          inputRef.current.jumpPressed = false;
          inputRef.current.interactPressed = false;
          inputRef.current.usePressed = false;
          inputRef.current.firePressed = false;

          hudSyncAccum += rawDt;
          if (hudSyncAccum >= 0.085) {
            hudSyncAccum = 0;
            setHud(world.getHudSnapshot());
          }
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderWorld(ctx, world, viewW, viewH, inputRef.current);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleToggleMute = () => {
    gameAudio.unlock();
    setMuted(gameAudio.toggleMute());
  };

  const handleSwapSlots = (a: number, b: number) => {
    worldRef.current?.swapSlots(a, b);
    syncHudNow();
  };

  const handleDropSlot = (idx: number) => {
    worldRef.current?.dropSlotToWorld(idx);
    syncHudNow();
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    worldRef.current?.craftRecipe(recipe);
    syncHudNow();
  };

  const totalRelicsAcrossRun = Object.values(runStats.relicsByLevel).reduce(
    (acc, n) => acc + n,
    0
  );
  const totalTimeAcrossRun = Object.values(runStats.timeByLevel).reduce(
    (acc, n) => acc + n,
    0
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0B0F17]">
      {gameState === 'TITLE_MENU' ? (
        <TitleScreen
          selectedLevel={selectedTitleLevel}
          muted={muted}
          onSelectLevel={setSelectedTitleLevel}
          onStart={() => startLevel(selectedTitleLevel, true)}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <div className="relative w-full h-full">
          {/* Isolated Canvas Viewport */}
          <canvas
            ref={canvasRef}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              inputRef.current.mouseScreenX = e.clientX - rect.left;
              inputRef.current.mouseScreenY = e.clientY - rect.top;
              inputRef.current.mouseActive = true;
            }}
            onMouseDown={(e) => {
              if (gameState !== 'PLAYING' || inventoryOpen) return;
              gameAudio.unlock();
              if (e.button === 0) {
                inputRef.current.jumpPressed = true;
                inputRef.current.jumpHeld = true;
              } else if (e.button === 2) {
                inputRef.current.firePressed = true;
              } else if (e.button === 1) {
                e.preventDefault();
                inputRef.current.usePressed = true;
                inputRef.current.useHeld = true;
              }
            }}
            onMouseUp={(e) => {
              if (e.button === 0) {
                inputRef.current.jumpHeld = false;
              } else if (e.button === 1) {
                inputRef.current.useHeld = false;
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseLeave={() => {
              inputRef.current.mouseActive = false;
              inputRef.current.jumpHeld = false;
              inputRef.current.useHeld = false;
            }}
            onWheel={(e) => {
              if (gameState !== 'PLAYING' || inventoryOpen) return;
              const dir = e.deltaY > 0 ? 1 : -1;
              const cur = worldRef.current?.activeHotbarIndex ?? 0;
              const next = (cur + dir + 5) % 5;
              worldRef.current?.selectHotbar(next);
              syncHudNow();
            }}
            className="block w-full h-full cursor-crosshair"
          />

          {/* Low-Occlusion Perimeter HUD */}
          <GameHUD
            hud={hud}
            muted={muted}
            onToggleMute={handleToggleMute}
            onOpenInventory={() => {
              clearHeldInputs();
              syncHudNow();
              setInventoryOpen(true);
            }}
            onResetChamber={() => startLevel(hud.levelIndex, false)}
            onPause={() => {
              clearHeldInputs();
              setGameState('PAUSED');
            }}
            onSelectHotbar={(idx) => {
              worldRef.current?.selectHotbar(idx);
              syncHudNow();
            }}
            onDropHotbarSlot={(idx) => {
              worldRef.current?.dropSlotToWorld(idx);
              syncHudNow();
            }}
          />

          {/* Inventory & Crafting Drawer */}
          {inventoryOpen && gameState === 'PLAYING' && (
            <InventoryDrawer
              hud={hud}
              onClose={() => setInventoryOpen(false)}
              onSwapSlots={handleSwapSlots}
              onDropSlot={handleDropSlot}
              onCraft={handleCraft}
            />
          )}

          {/* Modals */}
          {gameState === 'PAUSED' && (
            <PauseModal
              hud={hud}
              onResume={() => setGameState('PLAYING')}
              onRestartChamber={() => startLevel(hud.levelIndex, false)}
              onBackToTitle={() => {
                clearHeldInputs();
                setGameState('TITLE_MENU');
              }}
            />
          )}

          {(gameState === 'LEVEL_COMPLETE' || gameState === 'VICTORY') && (
            <LevelCompleteModal
              hud={hud}
              isFinalVictory={gameState === 'VICTORY'}
              totalRelicsAcrossRun={totalRelicsAcrossRun}
              totalTimeAcrossRun={totalTimeAcrossRun}
              onNextLevel={() => startLevel(hud.levelIndex + 1, false)}
              onReplayChamber={() => startLevel(hud.levelIndex, false)}
              onPlayAgain={() => startLevel(0, true)}
              onBackToTitle={() => {
                clearHeldInputs();
                setGameState('TITLE_MENU');
              }}
            />
          )}

          {gameState === 'GAME_OVER' && (
            <GameOverModal
              hud={hud}
              onRetry={() => startLevel(hud.levelIndex, false)}
              onBackToTitle={() => {
                clearHeldInputs();
                setGameState('TITLE_MENU');
              }}
            />
          )}
        </div>
      )}
    </main>
  );
}
