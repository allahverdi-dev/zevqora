import {
  Activity,
  BarChart3,
  Bot,
  FlaskConical,
  LayoutDashboard,
  type LucideIcon,
  Play,
  ShieldCheck,
  Shield,
  SquareTerminal,
  Settings,
  AlertCircle,
} from 'lucide-react'

/**
 * The approved navigation structure, reproduced from the Stitch app screens.
 *
 * Sections and order are fixed. Every entry routes to a fully implemented
 * screen — the two approved design exports together cover all thirteen
 * primary destinations.
 */

export interface NavItem {
  readonly label: string
  readonly to: string
  readonly icon: LucideIcon
}

export interface NavSection {
  readonly label: string
  readonly items: readonly NavItem[]
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Build',
    items: [
      { label: 'Agents', to: '/agents', icon: Bot },
      { label: 'Runs', to: '/runs', icon: Play },
      { label: 'Simulator', to: '/simulator', icon: SquareTerminal },
    ],
  },
  {
    label: 'Improve',
    items: [
      { label: 'Evaluations', to: '/evaluations', icon: Activity },
      { label: 'Experiments', to: '/experiments', icon: FlaskConical },
    ],
  },
  {
    label: 'Control',
    items: [
      { label: 'Approvals', to: '/approvals', icon: ShieldCheck },
      { label: 'Policies', to: '/policies', icon: Shield },
      { label: 'Incidents', to: '/incidents', icon: AlertCircle },
    ],
  },
  {
    label: 'Observe',
    items: [{ label: 'Analytics', to: '/analytics', icon: BarChart3 }],
  },
]

export const SETTINGS_ITEM: NavItem = {
  label: 'Settings',
  to: '/settings',
  icon: Settings,
}
