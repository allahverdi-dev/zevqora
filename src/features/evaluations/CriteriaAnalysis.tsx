import type { CriterionScore } from '@/domain'
import { EVALUATION_CRITERION_LABELS } from '@/domain'
import { formatPercent } from '@/lib/format'
import { cx } from '@/lib/cx'

import styles from './evaluations.module.css'

/**
 * Per-criterion score bars.
 *
 * A criterion scoring below its threshold is drawn in the error tone *and*
 * labelled as below target, so the regression is not signalled by colour alone.
 */
export function CriteriaAnalysis({
  scores,
}: {
  readonly scores: readonly CriterionScore[]
}) {
  return (
    <ul className={styles.criteriaList} role="list">
      {scores.map((entry) => {
        const belowThreshold = entry.score < entry.threshold
        const isNearPerfect = entry.score >= 95

        return (
          <li key={entry.criterion} className={styles.criterion}>
            <div className={styles.criterionHead}>
              <span className={cx('mono', styles.criterionLabel)}>
                {EVALUATION_CRITERION_LABELS[entry.criterion]}
              </span>
              <span
                className={cx(
                  'mono',
                  'tabular',
                  styles.criterionScore,
                  belowThreshold && styles.criterionScoreLow,
                )}
              >
                {formatPercent(entry.score)}
              </span>
            </div>

            <div
              className={styles.track}
              role="meter"
              aria-valuenow={entry.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${EVALUATION_CRITERION_LABELS[entry.criterion]}: ${formatPercent(
                entry.score,
              )}${belowThreshold ? ', below target' : ''}`}
            >
              <span
                className={cx(
                  styles.fill,
                  belowThreshold
                    ? styles.fillLow
                    : isNearPerfect
                      ? styles.fillHigh
                      : styles.fillSignal,
                )}
                style={{ width: `${Math.min(entry.score, 100)}%` }}
              />
            </div>

            {belowThreshold ? (
              <p className={cx('text-code-sm', styles.criterionNote)}>
                Below target of {formatPercent(entry.threshold, 0)}
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
