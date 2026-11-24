import { CraftingRecipe, InventorySlot, ItemDefinition, ItemId } from './types';

export const ITEMS: Record<ItemId, ItemDefinition> = {
  wood_crate: {
    id: 'wood_crate',
    name: 'Caixa de Carvalho',
    shortLabel: 'Caixa',
    description:
      'Estrutura leve de madeira reforçada. Flutua na água e pode ser empilhada para alcançar plataformas altas.',
    category: 'deployable',
    massKg: 18,
    density: 0.62,
    restitution: 0.12,
    friction: 0.78,
    maxStack: 6,
    accentColor: '#C2854C',
    buoyancyLabel: 'Flutua (0.62)',
  },
  iron_weight: {
    id: 'iron_weight',
    name: 'Peso de Ferro Fundido',
    shortLabel: 'Ferro',
    description:
      'Bloco maciço de alta densidade. Afunda rapidamente na água, desequilibra gangorras e aciona placas pesadas.',
    category: 'throwable',
    massKg: 65,
    density: 4.2,
    restitution: 0.08,
    friction: 0.65,
    maxStack: 4,
    accentColor: '#7C8B9E',
    buoyancyLabel: 'Afunda (4.20)',
  },
  rubber_sphere: {
    id: 'rubber_sphere',
    name: 'Esfera Elástica',
    shortLabel: 'Esfera',
    description:
      'Núcleo vulcanizado com alta restituição. Ricocheteia preservando energia cinética para atingir alvos distantes.',
    category: 'throwable',
    massKg: 12,
    density: 0.85,
    restitution: 0.88,
    friction: 0.35,
    maxStack: 5,
    accentColor: '#D97706',
    buoyancyLabel: 'Flutua (0.85)',
  },
  grapple_hook: {
    id: 'grapple_hook',
    name: 'Gancho de Pêndulo',
    shortLabel: 'Gancho',
    description:
      'Ferramenta mecânica reutilizável. Prende-se a anéis de latão suspensos para balançar com física pendular real.',
    category: 'tool',
    massKg: 3,
    density: 3.1,
    restitution: 0.1,
    friction: 0.5,
    maxStack: 1,
    accentColor: '#F59E0B',
    buoyancyLabel: 'Equipamento',
  },
  seismic_charge: {
    id: 'seismic_charge',
    name: 'Carga Sísmica',
    shortLabel: 'Carga',
    description:
      'Dispositivo de pulso cinético. Detona após 2 segundos liberando onda de choque radial que quebra rochas rachadas.',
    category: 'throwable',
    massKg: 10,
    density: 1.6,
    restitution: 0.35,
    friction: 0.55,
    maxStack: 4,
    accentColor: '#EF4444',
    buoyancyLabel: 'Afunda (1.60)',
  },
  spring_pad: {
    id: 'spring_pad',
    name: 'Prancha de Impulso',
    shortLabel: 'Mola',
    description:
      'Mecanismo de mola portátil. Posicione no chão para catapultar o explorador ou objetos lançados sobre ela.',
    category: 'deployable',
    massKg: 14,
    density: 2.2,
    restitution: 0.2,
    friction: 0.8,
    maxStack: 3,
    accentColor: '#10B981',
    buoyancyLabel: 'Instalável',
  },
  scrap_iron: {
    id: 'scrap_iron',
    name: 'Sucata de Ferro',
    shortLabel: 'Sucata',
    description:
      'Placas metálicas recuperadas. Combine na mochila com Pólvora Bruta ou outra Sucata para forjar itens úteis.',
    category: 'material',
    massKg: 15,
    density: 4.5,
    restitution: 0.1,
    friction: 0.7,
    maxStack: 10,
    accentColor: '#94A3B8',
    buoyancyLabel: 'Material',
  },
  black_powder: {
    id: 'black_powder',
    name: 'Pólvora Bruta',
    shortLabel: 'Pólvora',
    description:
      'Reagente granular instável. Usada em conjunto com Sucata de Ferro para montar uma Carga Sísmica.',
    category: 'material',
    massKg: 4,
    density: 1.2,
    restitution: 0.1,
    friction: 0.8,
    maxStack: 10,
    accentColor: '#F97316',
    buoyancyLabel: 'Material',
  },
  spring_coil: {
    id: 'spring_coil',
    name: 'Mola Espiral',
    shortLabel: 'Espiral',
    description:
      'Mola de aço temperado de alta tensão. Combine com Caixa de Carvalho para construir uma Prancha de Impulso.',
    category: 'material',
    massKg: 6,
    density: 3.8,
    restitution: 0.6,
    friction: 0.5,
    maxStack: 6,
    accentColor: '#34D399',
    buoyancyLabel: 'Material',
  },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_seismic',
    resultId: 'seismic_charge',
    resultQty: 1,
    ingredients: [
      { itemId: 'scrap_iron', quantity: 1 },
      { itemId: 'black_powder', quantity: 1 },
    ],
    label: 'Forjar Carga Sísmica',
  },
  {
    id: 'craft_spring_pad',
    resultId: 'spring_pad',
    resultQty: 1,
    ingredients: [
      { itemId: 'wood_crate', quantity: 1 },
      { itemId: 'spring_coil', quantity: 1 },
    ],
    label: 'Montar Prancha de Impulso',
  },
  {
    id: 'craft_iron_weight',
    resultId: 'iron_weight',
    resultQty: 1,
    ingredients: [{ itemId: 'scrap_iron', quantity: 2 }],
    label: 'Fundir Peso de Ferro',
  },
];

export const HOTBAR_SIZE = 5;
export const TOTAL_INVENTORY_SLOTS = 15;

export function countItemInSlots(slots: (InventorySlot | null)[], itemId: ItemId): number {
  let total = 0;
  for (const slot of slots) {
    if (slot && slot.itemId === itemId) total += slot.quantity;
  }
  return total;
}

export function calculateInventoryMassKg(slots: (InventorySlot | null)[]): number {
  let total = 0;
  for (const slot of slots) {
    if (slot) {
      total += ITEMS[slot.itemId].massKg * slot.quantity;
    }
  }
  return total;
}

export function addItemToSlots(
  slots: (InventorySlot | null)[],
  itemId: ItemId,
  quantity: number
): boolean {
  const def = ITEMS[itemId];
  let remaining = quantity;

  // First try stacking into existing slots
  for (let i = 0; i < slots.length && remaining > 0; i++) {
    const slot = slots[i];
    if (slot && slot.itemId === itemId && slot.quantity < def.maxStack) {
      const space = def.maxStack - slot.quantity;
      const add = Math.min(space, remaining);
      slot.quantity += add;
      remaining -= add;
    }
  }

  // Then fill empty slots (hotbar first, then backpack)
  for (let i = 0; i < slots.length && remaining > 0; i++) {
    if (!slots[i]) {
      const add = Math.min(def.maxStack, remaining);
      slots[i] = { itemId, quantity: add };
      remaining -= add;
    }
  }

  return remaining < quantity;
}

export function removeItemFromSlots(
  slots: (InventorySlot | null)[],
  itemId: ItemId,
  quantity: number
): boolean {
  if (countItemInSlots(slots, itemId) < quantity) return false;
  let remaining = quantity;
  for (let i = slots.length - 1; i >= 0 && remaining > 0; i--) {
    const slot = slots[i];
    if (slot && slot.itemId === itemId) {
      const take = Math.min(slot.quantity, remaining);
      slot.quantity -= take;
      remaining -= take;
      if (slot.quantity <= 0) {
        slots[i] = null;
      }
    }
  }
  return true;
}
