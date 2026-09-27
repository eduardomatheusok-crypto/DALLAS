/** Intent only: ordered equivalent movements, never exercise records or prescription. */
export const MOVEMENTS = {
  bench: ['Supino Reto', 'Supino com Halteres', 'Supino Inclinado com Halteres'],
  incline: ['Supino Inclinado com Halteres', 'Supino Reto'],
  inclineMachine: ['Supino Inclinado Máquina', 'Supino Inclinado na Máquina', 'Supino Inclinado com Halteres', 'Supino Reto'],
  dumbbellBench: ['Supino Reto com Halteres', 'Supino com Halteres', 'Supino Reto', 'Supino Inclinado com Halteres'],
  cableRowUnilateral: ['Remada Baixa Unilateral', 'Remada Unilateral (Serrote)', 'Remada Baixa no Triângulo'],
  articulatedPull: ['Puxada Articulada', 'Puxada Frontal (Pulley)', 'Barra Fixa (Pronada)'],
  row: ['Remada Curvada com Barra', 'Remada Baixa no Triângulo', 'Remada Unilateral (Serrote)'],
  cableRow: ['Remada Baixa no Triângulo', 'Remada Curvada com Barra'],
  unilateralRow: ['Remada Articulada Unilateral', 'Remada Unilateral (Serrote)', 'Remada Baixa no Triângulo'],
  tRow: ['Remada Cavalinho', 'Remada Baixa no Triângulo', 'Remada Curvada com Barra'],
  shoulder: ['Desenvolvimento com Halteres', 'Desenvolvimento Militar'],
  military: ['Desenvolvimento Militar', 'Desenvolvimento com Halteres'],
  pull: ['Puxada Frontal (Pulley)', 'Barra Fixa (Pronada)'],
  chin: ['Barra Fixa Supinada', 'Puxada Supinada', 'Barra Fixa (Pronada)', 'Puxada Frontal (Pulley)'],
  lateral: ['Elevação Lateral com Halteres', 'Elevação Lateral Sentado na Polia'],
  triceps: ['Tríceps Pulley com Corda', 'Tríceps Pulley com Barra Reta', 'Tríceps Testa com Barra W'],
  french: ['Tríceps Francês com Halter', 'Tríceps Pulley com Corda'],
  dips: ['Mergulho nas Paralelas (Tríceps)', 'Tríceps Testa com Barra W'],
  squat: ['Agachamento Livre com Barra', 'Agachamento Hack', 'Leg Press 45°'],
  frontSquat: ['Agachamento Frontal', 'Leg Press 45°', 'Agachamento Livre com Barra'],
  hack: ['Agachamento Goblet', 'Agachamento Hack', 'Agachamento Livre com Barra'],
  press: ['Leg Press 45°', 'Agachamento Hack'],
  extension: ['Cadeira Extensora', 'Leg Press 45°'],
  curlLeg: ['Mesa Flexora', 'Cadeira Flexora'],
  seatedCurl: ['Cadeira Flexora', 'Mesa Flexora'],
  calf: ['Panturrilha em Pé na Máquina', 'Panturrilha no Leg Press', 'Panturrilha Sentado (Gêmeos)'],
  seatedCalf: ['Panturrilha Sentado (Gêmeos)', 'Panturrilha em Pé na Máquina'],
  fly: ['Crucifixo com Halteres', 'Voador / Peck Deck', 'Crossover na Polia Média'],
  curl: ['Rosca Direta com Barra W', 'Rosca Alternada com Halteres', 'Rosca Scott com Barra'],
  alternateCurl: ['Rosca Alternada com Halteres', 'Rosca Direta com Barra W'],
  hammer: ['Rosca Martelo', 'Rosca Alternada com Halteres'],
  stiff: ['Levantamento Terra Romeno', 'Stiff com Halteres', 'Levantamento Terra'],
  deadlift: ['Levantamento Terra', 'Agachamento Búlgaro'],
  lunge: ['Afundo / Passada com Halteres', 'Agachamento Búlgaro'],
  abductor: ['Cadeira Abdutora', 'Abdução de Quadril na Polia'],
  infra: ['Abdominal Infra na Barra', 'Abdominal Crunch no Solo'],
  reverse: ['Crucifixo Invertido (Deltoide Posterior)', 'Face Pull'],
  lumbar: ['Hiperextensão Lombar', 'Levantamento Terra', 'Stiff com Halteres'],
  hip: ['Elevação Pélvica com Barra', 'Ponte de Glúteos'],
  plank: ['Prancha Abdominal', 'Abdominal Crunch no Solo'],
} as const;
export type Movement = keyof typeof MOVEMENTS;
export interface RoutineIntent { name: string; movements: Movement[] }
export interface Template { title: string; routines: RoutineIntent[] }
const routine = (name: string, movements: Movement[]): RoutineIntent => ({ name, movements });
export const WORKOUT_TEMPLATES: Record<string, Template> = {
  UPPER_LOWER_4X: { title: 'UPPER / LOWER', routines: [
    routine('Upper A', ['bench','row','shoulder','pull','lateral','triceps']),
    routine('Lower A', ['squat','press','extension','curlLeg','calf']),
    routine('Upper B', ['chin','incline','unilateralRow','fly','curl','hammer']),
    routine('Lower B', ['stiff','lunge','curlLeg','abductor','seatedCalf']),
  ]},
  ANTERIOR_POSTERIOR_4X: { title: 'ANTERIOR / POSTERIOR', routines: [
    routine('Anterior A', ['bench','military','extension','frontSquat','lateral','infra']),
    routine('Posterior A', ['chin','stiff','curlLeg','reverse','calf','lumbar']),
    routine('Anterior B', ['dumbbellBench','dips','hack','lunge','triceps']),
    routine('Posterior B', ['pull','tRow','curlLeg','hip','alternateCurl','calf']),
  ]},
  PPL_UPPER_LOWER_5X: { title: 'PPLUL', routines: [
    routine('Push', ['bench','shoulder','inclineMachine','lateral','french']),
    routine('Pull', ['pull','cableRowUnilateral','reverse','curl','hammer']),
    routine('Legs', ['squat','press','seatedCurl','stiff','calf']),
    routine('Upper', ['incline','row','military','articulatedPull','curl','triceps']),
    routine('Lower', ['deadlift','extension','curlLeg','abductor','calf']),
  ]},
  FULL_BODY_3X: { title: 'FULL BODY', routines: [
    routine('Sessão A', ['squat','bench','row','lateral','plank']),
    routine('Sessão B', ['stiff','military','pull','extension','curl','triceps']),
    routine('Sessão C', ['press','incline','cableRow','curlLeg','calf']),
  ]},
};
// Retain older choices for saved preferences; the new onboarding exposes the four requested splits.
WORKOUT_TEMPLATES.FULL_BODY_2X = { title: 'FULL BODY', routines: WORKOUT_TEMPLATES.FULL_BODY_3X.routines.slice(0, 2) };
WORKOUT_TEMPLATES.PPL_3X = { title: 'PPL', routines: WORKOUT_TEMPLATES.PPL_UPPER_LOWER_5X.routines.slice(0, 3) };
WORKOUT_TEMPLATES.PPL_6X = { title: 'PPL 2X', routines: ['A','B'].flatMap(suffix => WORKOUT_TEMPLATES.PPL_3X.routines.map(r => ({ ...r, name: `${r.name} ${suffix}` }))) };
