import React from 'react';
import { HudSnapshot } from '../game/types';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface PauseModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestartChamber: () => void;
  onBackToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  onResume,
  onRestartChamber,
  onBackToTitle,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#070A10]/82 p-4">
    <div className="w-full max-w-md bg-[#111827] border border-slate-700 rounded-xl p-6 shadow-2xl">
      <h2 className="font-display text-2xl font-bold text-slate-100">Jogo Pausado</h2>
      <p className="text-xs text-slate-400 mt-1">
        {hud.levelName} · Tempo decorrido: <span className="font-mono tabular-nums text-slate-200">{formatTime(hud.elapsedSeconds)}</span>
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onResume}
          className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={onRestartChamber}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Reiniciar Câmara
        </button>
        <button
          type="button"
          onClick={onBackToTitle}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Menu Inicial
        </button>
      </div>
    </div>
  </div>
);

interface LevelCompleteModalProps {
  hud: HudSnapshot;
  isFinalVictory: boolean;
  totalRelicsAcrossRun: number;
  totalTimeAcrossRun: number;
  onNextLevel: () => void;
  onReplayChamber: () => void;
  onPlayAgain: () => void;
  onBackToTitle: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  hud,
  isFinalVictory,
  totalRelicsAcrossRun,
  totalTimeAcrossRun,
  onNextLevel,
  onReplayChamber,
  onPlayAgain,
  onBackToTitle,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#070A10]/85 p-4">
    <div className="w-full max-w-md bg-[#111827] border border-amber-500/40 rounded-xl p-6 shadow-2xl">
      <div className="text-xs font-semibold text-emerald-400">
        {isFinalVictory ? 'Expedição Concluída' : 'Câmara Atravessada'}
      </div>
      <h2 className="font-display text-2xl font-bold text-slate-100 mt-1">
        {isFinalVictory ? 'Grande Observatório Dominado' : hud.levelName}
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-slate-400">Tempo da Câmara</div>
          <div className="font-mono text-lg font-bold text-slate-100 tabular-nums mt-0.5">
            {formatTime(hud.elapsedSeconds)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-slate-400">Relíquias Coletadas</div>
          <div className="font-mono text-lg font-bold text-amber-400 tabular-nums mt-0.5">
            {hud.relicsCollected}/{hud.relicsTotal}
          </div>
        </div>
      </div>

      {isFinalVictory && (
        <div className="mt-3 bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
          <span className="text-slate-300">Total da Expedição</span>
          <span className="font-mono font-bold text-amber-300 tabular-nums">
            {totalRelicsAcrossRun}/12 Relíquias · {formatTime(totalTimeAcrossRun)}
          </span>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        {!isFinalVictory ? (
          <button
            type="button"
            onClick={onNextLevel}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            Próxima Câmara
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            Jogar Novamente
          </button>
        )}

        <button
          type="button"
          onClick={onReplayChamber}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Repetir Câmara
        </button>

        <button
          type="button"
          onClick={onBackToTitle}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Menu Inicial
        </button>
      </div>
    </div>
  </div>
);

interface GameOverModalProps {
  hud: HudSnapshot;
  onRetry: () => void;
  onBackToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  onRetry,
  onBackToTitle,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#070A10]/85 p-4">
    <div className="w-full max-w-md bg-[#111827] border border-red-500/40 rounded-xl p-6 shadow-2xl">
      <div className="text-xs font-semibold text-red-400">Integridade Esgotada</div>
      <h2 className="font-display text-2xl font-bold text-slate-100 mt-1">
        Fim de Tentativa
      </h2>
      <p className="text-xs text-slate-400 mt-1">
        {hud.levelName} · Tempo: <span className="font-mono tabular-nums text-slate-200">{formatTime(hud.elapsedSeconds)}</span>
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Tentar Novamente
        </button>
        <button
          type="button"
          onClick={onBackToTitle}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Menu Inicial
        </button>
      </div>
    </div>
  </div>
);
