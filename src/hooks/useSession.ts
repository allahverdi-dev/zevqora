import { useServices } from '@/app/providers/ServicesProvider'
import { useAsync } from '@/hooks/useAsync'
import { withBase } from '@/lib/asset-path'
import type { Session } from '@/services/contracts'

/**
 * The active session — account, workspace and environment.
 *
 * The shell renders continuously, so this returns a usable placeholder while
 * the read is in flight rather than making every consumer branch on loading.
 * Once real authentication exists, an unauthenticated result is what redirects
 * to a sign-in flow.
 */
const PLACEHOLDER: Session = {
  account: {
    name: '—',
    role: '',
    email: '',
    plan: '',
    avatarUrl: withBase('/demo/avatar.png'),
  },
  workspace: { id: '', name: '—', slug: '', environments: [] },
  environment: 'production',
}

export function useSession(): { session: Session; loading: boolean } {
  const services = useServices()
  const { state } = useAsync(() => services.session.current(), [services])

  return {
    session: state.status === 'success' ? state.data : PLACEHOLDER,
    loading: state.status === 'loading',
  }
}
