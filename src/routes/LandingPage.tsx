import {
  Activity,
  BarChart3,
  Eye,
  Gavel,
  PlayCircle,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/shell/BrandMark'
import { LinkButton } from '@/components/ui/Button'
import { TraceDemo } from '@/features/landing/TraceDemo'
import { cx } from '@/lib/cx'

import styles from './LandingPage.module.css'

interface Feature {
  readonly icon: LucideIcon
  readonly title: string
  readonly body: string
  readonly signal?: boolean
}

const FEATURES: readonly Feature[] = [
  {
    icon: Eye,
    title: 'Agent Observability',
    body: 'Real-time visibility into agent state, active tools, and execution steps. Monitor fleet health at a glance.',
  },
  {
    icon: Activity,
    title: 'Full Execution Traces',
    body: 'Reconstruct exact sequences of events. Trace every prompt, model response, and API call chronologically.',
  },
  {
    icon: BarChart3,
    title: 'Evaluations',
    body: 'Score agent outputs automatically against defined criteria. Track regression and improvements over time.',
  },
  {
    icon: Gavel,
    title: 'Human Approvals',
    body: 'Pause execution for critical tools. Review intent and parameters before authorizing destructive actions.',
    signal: true,
  },
  {
    icon: Shield,
    title: 'Policies & Permissions',
    body: 'Define granular access control for tools. Restrict capabilities based on user role, input context, or dynamic rules.',
  },
  {
    icon: Activity,
    title: 'Cost & Latency',
    body: 'Track token usage and provider costs per agent run. Identify bottlenecks and optimize execution speed.',
  },
]

/**
 * Marketing entry point.
 *
 * Keeps the approved structure: a compact technical hero whose product
 * demonstration *is* the hero visual, then the oversight capability grid.
 */
export function LandingPage() {
  return (
    <div className={styles.page}>
      <a className="skip-link" href="#landing-main">
        Skip to main content
      </a>

      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="ZEVQORA home">
          <span className={styles.brandMark}>
            <BrandMark size={30} title="" />
          </span>
          <span className={styles.brandName}>ZEVQORA</span>
        </Link>

        <nav className={styles.nav} aria-label="Landing">
          <a href="#features" className={styles.navLink}>
            Features
          </a>
          <a href="#trace" className={styles.navLink}>
            Documentation
          </a>
          <a href="#features" className={styles.navLink}>
            Pricing
          </a>
        </nav>

        <div className={styles.headerActions}>
          <LinkButton to="/dashboard" variant="secondary" size="md">
            Sign in
          </LinkButton>
          <LinkButton to="/dashboard" variant="signal" size="md">
            Start building
          </LinkButton>
        </div>
      </header>

      <main id="landing-main">
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <span className={styles.heroLine} aria-hidden="true" />

          <div className={styles.heroInner}>
            <p className={styles.release}>
              <span
                className={cx('status-dot', styles.releaseDot, 'pulse')}
                aria-hidden="true"
              />
              <span className="text-label-caps">Control Plane Preview</span>
            </p>

            <h1 className={styles.title}>Control what your agents can do.</h1>

            <p className={styles.subtitle}>
              Observe every run. Evaluate agent quality. Control tool
              permissions. Require human approval for sensitive actions.
            </p>

            <div className={styles.heroActions}>
              <LinkButton to="/dashboard" variant="signal" size="lg">
                Start building
              </LinkButton>
              <LinkButton
                to="/simulator"
                variant="secondary"
                size="lg"
                icon={<PlayCircle size={18} />}
              >
                View demo
              </LinkButton>
            </div>
          </div>

          <div id="trace" className={styles.demoWrap}>
            <span className={styles.demoConnector} aria-hidden="true" />
            <TraceDemo />
          </div>
        </section>

        <hr className={styles.rule} />

        <section id="features" className={styles.features}>
          <div className={styles.featuresHead}>
            <h2 className={styles.featuresTitle}>
              Comprehensive Agent Oversight
            </h2>
            <p className={styles.featuresBody}>
              Move beyond raw logs. ZEVQORA provides a structured control plane
              to monitor, evaluate, and govern your AI agent fleet in production.
            </p>
          </div>

          <ul className={styles.featureGrid} role="list">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <li
                  key={feature.title}
                  className={cx(
                    styles.featureCard,
                    feature.signal && styles.featureCardSignal,
                  )}
                >
                  <span
                    className={cx(
                      styles.featureIcon,
                      feature.signal && styles.featureIconSignal,
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                  <h3 className={cx('text-headline-md', styles.featureTitle)}>
                    {feature.title}
                  </h3>
                  <p className={cx('text-body-sm', styles.featureBody)}>
                    {feature.body}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Observe. Evaluate. Govern.</h2>
          <p className={styles.ctaBody}>
            Put a control plane between your agents and the actions they can
            take.
          </p>
          <div className={styles.heroActions}>
            <LinkButton to="/dashboard" variant="signal" size="lg">
              Start building
            </LinkButton>
            <LinkButton to="/runs" variant="secondary" size="lg">
              Explore runs
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerMark}>
            <BrandMark size={20} title="" />
          </span>
          <span>ZEVQORA</span>
        </div>
        <p className={cx('text-code-sm', styles.footerNote)}>
          Frontend demonstration · fictional workspace · no live agent execution
        </p>
      </footer>
    </div>
  )
}
