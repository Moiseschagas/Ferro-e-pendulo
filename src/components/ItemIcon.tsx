import React from 'react';
import { ItemId } from '../game/types';

interface ItemIconProps {
  itemId: ItemId;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ itemId, className = 'w-7 h-7' }) => {
  switch (itemId) {
    case 'wood_crate':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="2" fill="#A86E3E" stroke="#FBBF24" strokeWidth="1.5" />
          <path d="M5 5L27 27M27 5L5 27" stroke="#5C381B" strokeWidth="2" />
          <rect x="4" y="4" width="24" height="24" rx="2" stroke="#5C381B" strokeWidth="2" />
        </svg>
      );
    case 'iron_weight':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <path d="M11 9C11 6.8 13.2 5 16 5C18.8 5 21 6.8 21 9" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M7 10H25L27 27H5L7 10Z" fill="#475569" stroke="#94A3B8" strokeWidth="2" strokeLinejoin="round" />
          <path d="M11 19H21" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'rubber_sphere':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="#D97706" stroke="#FEF3C7" strokeWidth="2" />
          <path d="M6 16H26" stroke="#78350F" strokeWidth="3" />
          <circle cx="12" cy="11" r="2.2" fill="#FEF3C7" opacity="0.7" />
        </svg>
      );
    case 'grapple_hook':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <path d="M7 25L21 11" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 7L24 8L25 16" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 11L25 7" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="7" cy="25" r="2.5" fill="#94A3B8" />
        </svg>
      );
    case 'seismic_charge':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <circle cx="16" cy="18" r="10" fill="#334155" stroke="#F97316" strokeWidth="2" />
          <circle cx="16" cy="18" r="4" fill="#EF4444" />
          <path d="M16 8V4M16 4L20 3" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'spring_pad':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <rect x="4" y="8" width="24" height="5" rx="2" fill="#10B981" />
          <path d="M8 13L24 19L8 25" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="25" width="24" height="3" rx="1" fill="#475569" />
        </svg>
      );
    case 'scrap_iron':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <polygon points="6,19 13,8 25,11 26,23 12,26" fill="#64748B" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="14" cy="15" r="2" fill="#1E293B" />
          <circle cx="20" cy="19" r="1.5" fill="#1E293B" />
        </svg>
      );
    case 'black_powder':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <path d="M6 25L14 11L19 16L26 25H6Z" fill="#475569" stroke="#F97316" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="15" cy="9" r="2" fill="#FBBF24" />
          <circle cx="20" cy="7" r="1.5" fill="#F97316" />
        </svg>
      );
    case 'spring_coil':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
          <path
            d="M9 8H23L10 14H22L10 20H22L10 26H23"
            stroke="#34D399"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};
