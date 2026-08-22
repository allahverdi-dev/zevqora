import type { Policy } from '@/domain'
import { POLICY_CATEGORY_LABELS } from '@/domain'
import { Badge } from '@/components/ui/Badge'
import { cx } from '@/lib/cx'

import styles from './policies.module.css'

export function PolicyListItem({
  policy,
  selected,
  onSelect,
}: {
  readonly policy: Policy
  readonly selected: boolean
  readonly onSelect: (policy: Policy) => void
}) {
  const enforced = policy.status === 'enforced'

  return (
    <li>
      <button
        type="button"
        className={cx(
          styles.listItem,
          enforced ? styles.listItemEnforced : styles.listItemDisabled,
          selected && styles.listItemSelected,
        )}
        onClick={() => onSelect(policy)}
        aria-current={selected ? 'true' : undefined}
      >
        <span className={styles.listHead}>
          <span className={styles.listStatus}>
            <span
              className={cx(
                'status-dot',
                enforced ? styles.dotEnforced : styles.dotDisabled,
              )}
              aria-hidden="true"
            />
            <span className={cx('text-label-caps', styles.listStatusLabel)}>
              {enforced ? 'Enforced' : 'Disabled'}
            </span>
          </span>
          <Badge tone="neutral" mono>
            {policy.displayId}
          </Badge>
        </span>

        <span className={styles.listName}>{policy.name}</span>

        <span className={cx('text-body-sm', styles.listDescription)}>
          {policy.description}
        </span>

        <span className={styles.listTags}>
          <Badge tone={policy.severity === 'critical' ? 'danger' : 'neutral'} mono>
            {policy.severity === 'critical'
              ? 'HIGH_SEVERITY'
              : POLICY_CATEGORY_LABELS[policy.category].toUpperCase()}
          </Badge>
          <Badge tone="secondary" mono>
            {policy.appliedToAgentIds.length >= 6
              ? 'ALL AGENTS'
              : `${policy.appliedToAgentIds.length} AGENT${
                  policy.appliedToAgentIds.length === 1 ? '' : 'S'
                }`}
          </Badge>
        </span>
      </button>
    </li>
  )
}
