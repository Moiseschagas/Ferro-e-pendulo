import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { LEVELS } from '../game/levels';

interface TitleScreenProps {
  selectedLevel: number;
  muted: boolean;
  onSelectLevel: (index: number) => void;
  onStart: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedLevel,
  muted,
  onSelectLevel,
  onStart,
  onToggleMute,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B0F17] flex flex-col justify-between">
      {/* Key-Art Backdrop */}
      {!imgFailed && (
        <img
          src="/src/assets/images/title_observatory_backdrop_1795542115393.jpg"
          alt="Observatório mecânico com pêndulos e aquedutos ao crepúsculo"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* Measured contrast scrim preserving the right-hand key art */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0B0F17]/95 via-[#0B0F17]/72 to-[#0B0F17]/20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-transparent to-[#0B0F17]/40"
        aria-hidden="true"
      />

      {/* Top Mute Control */}
      <div className="relative z-10 flex justify-end p-6">
        <button
          type="button"
          onClick={onToggleMute}
          className="h-10 px-3.5 bg-[#0F1623]/88 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
          aria-label={muted ? 'Ativar Som' : 'Silenciar Som'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          <span>{muted ? 'Som Desativado' : 'Som Ativado'}</span>
        </button>
      </div>

      {/* Main Left Lockup over Negative Space */}
      <div className="relative z-10 max-w-xl px-8 md:px-14 my-auto">
        {/* Bespoke SVG Title Lockup */}
        <svg
          viewBox="0 0 540 124"
          className="w-full max-w-[490px] h-auto"
          role="img"
          aria-label="Ferro & Pêndulo"
        >
          <defs>
            <linearGradient id="brassTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          {/* Hanging pendulum emblem */}
          <line x1="22" y1="6" x2="22" y2="82" stroke="#94A3B8" strokeWidth="2.5" />
          <circle cx="22" cy="8" r="4" fill="#F59E0B" />
          <circle cx="22" cy="94" r="14" fill="#1E293B" stroke="url(#brassTitleGrad)" strokeWidth="3" />
          <circle cx="22" cy="94" r="4.5" fill="#F59E0B" />

          {/* Main Title */}
          <text
            x="54"
            y="62"
            fill="#F8FAFC"
            fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
            fontWeight="800"
            fontSize="48"
            letterSpacing="-1.2"
          >
            FERRO &amp; PÊNDULO
          </text>
          <line x1="56" y1="78" x2="495" y2="78" stroke="url(#brassTitleGrad)" strokeWidth="2" opacity="0.7" />
          <text
            x="56"
            y="102"
            fill="#CBD5E1"
            fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
            fontWeight="600"
            fontSize="15"
            letterSpacing="0.4"
          >
            Engenharia de Massa, Empuxo &amp; Inventário Tático
          </text>
        </svg>

        <p className="mt-4 text-sm md:text-base text-slate-300 leading-relaxed max-w-md">
          Atravesse quatro câmaras de mecanismos antigos manipulando pesos reais, gangorras de torque, fluidos e ferramentas montadas na sua mochila.
        </p>

        {/* Chamber Selector */}
        <div className="mt-6">
          <div className="text-xs font-medium text-slate-400 mb-2">
            Selecionar Câmara
          </div>
          <div className="inline-flex flex-wrap gap-1.5 p-1 bg-[#0F1623]/90 border border-slate-800 rounded-lg">
            {LEVELS.map((lvl, idx) => {
              const active = selectedLevel === idx;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onSelectLevel(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Câmara {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-amber-300/90 font-medium">
            {LEVELS[selectedLevel].name} — {LEVELS[selectedLevel].subtitle}
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-7 flex items-center gap-4">
          <button
            type="button"
            onClick={onStart}
            className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base rounded-lg shadow-lg transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          >
            Iniciar Expedição
          </button>
          <span className="text-xs text-slate-400">
            ou pressione Enter / Espaço
          </span>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="relative z-10 px-8 md:px-14 py-5 border-t border-slate-800/60 bg-[#0B0F17]/75">
        <p className="text-xs text-slate-300 font-medium tracking-wide">
          Mouse Mover · Clique Esq. Pular (2x Duplo Pulo) · Clique Dir. Bola de Fogo · Q Usar Item/Gancho · E Pegar/Soltar · 1-5 Barra · Tab Mochila
        </p>
      </div>
    </div>
  );
};
