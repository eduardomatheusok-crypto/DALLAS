// Técnicas avançadas do DALLAS.
//
// Estrutura extensível: cada técnica possui um `kind` e, quando envolve mais
// de um exercício (técnicas compostas), uma lista de exercícios na ordem de
// execução. Configurações específicas da técnica ficam em `config`.

export type AdvancedTechniqueKind =
  | 'none'
  | 'cluster'
  | 'myo'
  | 'rest-pause'
  | 'drop-set'
  | 'biset'
  | 'triset'
  | 'superset'
  | 'giant-set';

export type TechniqueComposition = 'single' | 'multi';

export interface AdvancedTechniqueExercise {
  exerciseId: string;
  exerciseName?: string;
  order: number;
  /** Séries/blocos da técnica quando aplicável (ex.: blocos de um Tri-set). */
  blocks?: number;
}

export interface AdvancedTechnique {
  kind: AdvancedTechniqueKind;
  /** Preenchido apenas para técnicas compostas (biset/triset/superset/giant-set). */
  exercises?: AdvancedTechniqueExercise[];
  /** Configurações específicas da técnica (extensível). */
  config?: Record<string, number | string | boolean>;
}

export interface AdvancedTechniqueMeta {
  kind: AdvancedTechniqueKind;
  label: string;
  description: string;
  composition: TechniqueComposition;
  /** Quantidade de exercícios exigida (compostas). */
  minExercises: number;
  maxExercises: number;
  /** Indica se a técnica permite definir séries/blocos por exercício. */
  configurableBlocks: boolean;
}

export const ADVANCED_TECHNIQUES: AdvancedTechniqueMeta[] = [
  {
    kind: 'none',
    label: 'Nenhuma',
    description: 'Sem técnica avançada aplicada.',
    composition: 'single',
    minExercises: 0,
    maxExercises: 0,
    configurableBlocks: false,
  },
  {
    kind: 'cluster',
    label: 'Cluster Set',
    description: 'Séries com mini-pausas entre repetições.',
    composition: 'single',
    minExercises: 0,
    maxExercises: 0,
    configurableBlocks: false,
  },
  {
    kind: 'myo',
    label: 'Myo Reps',
    description: 'Série longa com mini-reps até a falha.',
    composition: 'single',
    minExercises: 0,
    maxExercises: 0,
    configurableBlocks: false,
  },
  {
    kind: 'rest-pause',
    label: 'Rest-Pause',
    description: 'Pausas curtas dentro de uma série.',
    composition: 'single',
    minExercises: 0,
    maxExercises: 0,
    configurableBlocks: false,
  },
  {
    kind: 'drop-set',
    label: 'Drop Set',
    description: 'Reduz a carga ao atingir a falha, sem pausa.',
    composition: 'single',
    minExercises: 0,
    maxExercises: 0,
    configurableBlocks: false,
  },
  {
    kind: 'biset',
    label: 'Bi-set',
    description: 'Dois exercícios executados em sequência.',
    composition: 'multi',
    minExercises: 2,
    maxExercises: 2,
    configurableBlocks: true,
  },
  {
    kind: 'triset',
    label: 'Tri-set',
    description: 'Três exercícios executados em sequência.',
    composition: 'multi',
    minExercises: 3,
    maxExercises: 3,
    configurableBlocks: true,
  },
  {
    kind: 'superset',
    label: 'Super Set',
    description: 'Dois exercícios opostos em sequência.',
    composition: 'multi',
    minExercises: 2,
    maxExercises: 2,
    configurableBlocks: true,
  },
  {
    kind: 'giant-set',
    label: 'Giant Set',
    description: 'Quatro ou mais exercícios em sequência.',
    composition: 'multi',
    minExercises: 4,
    maxExercises: 6,
    configurableBlocks: true,
  },
];

export const ADVANCED_TECHNIQUE_META: Record<AdvancedTechniqueKind, AdvancedTechniqueMeta> =
  Object.fromEntries(
    ADVANCED_TECHNIQUES.map((t) => [t.kind, t]),
  ) as Record<AdvancedTechniqueKind, AdvancedTechniqueMeta>;

export const techniqueName = (kind: AdvancedTechniqueKind): string =>
  ADVANCED_TECHNIQUE_META[kind]?.label ?? 'Nenhuma';

export const isCompositeTechnique = (kind: AdvancedTechniqueKind): boolean =>
  ADVANCED_TECHNIQUE_META[kind]?.composition === 'multi';

/**
 * Quantidade total de blocos da técnica para um exercício composto.
 * Usa `blocks` do exercício quando definido; senão cai para o campo `blocks`
 * genérico no `config` (para técnicas de exercício único) ou 0.
 */
export function exBlocksFor(
  technique: AdvancedTechnique | undefined,
  exerciseId: string,
): number {
  if (!technique || technique.kind === 'none') return 0;
  const forEx = technique.exercises?.find((e) => e.exerciseId === exerciseId);
  if (forEx && typeof forEx.blocks === 'number' && forEx.blocks > 0) {
    return forEx.blocks;
  }
  if (isCompositeTechnique(technique.kind)) return 0;
  const configBlocks = technique.config?.blocks;
  return typeof configBlocks === 'number' && configBlocks > 0 ? configBlocks : 0;
}
