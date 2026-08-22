import type { AgentModel } from '@/domain'

/**
 * Model catalogue referenced by agents, runs, evaluations and experiments.
 *
 * This is the single canonical source for model identity across the demo
 * dataset — nothing outside this file should hard-code a model id or label.
 * Costs are illustrative figures used by the deterministic cost estimator in
 * the mock layer. ZEVQORA does not call any provider API in this release.
 */
export const MODELS = {
  claudeSonnet5: {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    provider: 'anthropic',
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  claudeOpus5: {
    id: 'claude-opus-5',
    label: 'Claude Opus 5',
    provider: 'anthropic',
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
  },
  gpt56: {
    id: 'gpt-5.6',
    label: 'GPT-5.6',
    provider: 'openai',
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
  },
  gemini3Pro: {
    id: 'gemini-3-pro',
    label: 'Gemini 3 Pro',
    provider: 'google',
    inputCostPer1k: 0.0035,
    outputCostPer1k: 0.0105,
  },
  llama4Maverick: {
    id: 'llama-4-maverick',
    label: 'Llama 4 Maverick',
    provider: 'meta',
    inputCostPer1k: 0.00088,
    outputCostPer1k: 0.00088,
  },
  /** A workspace-tuned model, used only as an Evaluations target — no agent is deployed on it. */
  customFinetuneV2: {
    id: 'custom-finetune-v2',
    label: 'Custom Finetune v2',
    provider: 'custom',
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.006,
  },
} as const satisfies Record<string, AgentModel>

export const MODEL_LIST: readonly AgentModel[] = Object.values(MODELS)

export function findModel(id: string): AgentModel | undefined {
  return MODEL_LIST.find((model) => model.id === id)
}
