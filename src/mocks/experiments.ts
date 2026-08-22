import type { Experiment } from '@/domain'

import { agoIso, DAY, HOUR } from './demo-context'

/**
 * Comparative experiments (`/experiments`).
 *
 * The first three reproduce the approved screen's cards and directory rows
 * exactly (id, name, status, duration, win rate, base/challenger models,
 * delta). EXP-620X is the directory's fourth, unselected row.
 */
export const MOCK_EXPERIMENTS: readonly Experiment[] = [
  {
    id: 'EXP-842A',
    name: 'Model Comparison: Claude vs GPT',
    type: 'Model comparison',
    status: 'running',
    startedAt: agoIso(4 * DAY + 12 * HOUR),
    durationLabel: '4d 12h',
    baseVariant: { label: 'Variant A', model: 'claude-sonnet-5' },
    challengerVariant: { label: 'Variant B', model: 'gpt-5.6' },
    trafficAllocation: { variantA: 75, variantB: 25 },
    comparisons: [
      { metric: 'Accuracy', unit: 'percent', variantA: 94, variantB: 82 },
      { metric: 'Latency', unit: 'seconds', variantA: 1.2, variantB: 1.8 },
      { metric: 'Cost/Req', unit: 'usd', variantA: 0.04, variantB: 0.02 },
    ],
    deltaKpi: 14.2,
  },
  {
    id: 'EXP-911B',
    name: 'Retrieval Strategy: Dense vs Hybrid',
    type: 'Retrieval strategy',
    status: 'completed',
    startedAt: agoIso(14 * DAY),
    durationLabel: '14d',
    baseVariant: { label: 'Variant A', model: 'dense-retriever-v1' },
    challengerVariant: { label: 'Variant B', model: 'hybrid-alpha' },
    trafficAllocation: { variantA: 50, variantB: 50 },
    comparisons: [
      { metric: 'Accuracy', unit: 'percent', variantA: 88, variantB: 91 },
      { metric: 'Latency', unit: 'seconds', variantA: 0.9, variantB: 1.1 },
      { metric: 'Cost/Req', unit: 'usd', variantA: 0.015, variantB: 0.021 },
    ],
    deltaKpi: 4.1,
  },
  {
    id: 'EXP-775C',
    name: 'Prompt Optimization V3',
    type: 'Prompt optimization',
    status: 'running',
    startedAt: agoIso(2 * DAY + 4 * HOUR),
    durationLabel: '2d 4h',
    baseVariant: { label: 'Variant A', model: 'prompt-v2-base' },
    challengerVariant: { label: 'Variant B', model: 'prompt-v3-cot' },
    trafficAllocation: { variantA: 60, variantB: 40 },
    comparisons: [
      { metric: 'Accuracy', unit: 'percent', variantA: 90, variantB: 92 },
      { metric: 'Latency', unit: 'seconds', variantA: 1.4, variantB: 2.1 },
      { metric: 'Cost/Req', unit: 'usd', variantA: 0.031, variantB: 0.044 },
    ],
    deltaKpi: -2.4,
  },
  {
    id: 'EXP-620X',
    name: 'Semantic Routing Rollout',
    type: 'Agent routing',
    status: 'completed',
    startedAt: agoIso(30 * DAY),
    durationLabel: '21d',
    baseVariant: { label: 'Variant A', model: 'agent-router-old' },
    challengerVariant: { label: 'Variant B', model: 'semantic-router' },
    trafficAllocation: { variantA: 20, variantB: 80 },
    comparisons: [
      { metric: 'Accuracy', unit: 'percent', variantA: 79, variantB: 96 },
      { metric: 'Latency', unit: 'seconds', variantA: 2.1, variantB: 1.0 },
      { metric: 'Cost/Req', unit: 'usd', variantA: 0.052, variantB: 0.028 },
    ],
    deltaKpi: 22.8,
  },
]
