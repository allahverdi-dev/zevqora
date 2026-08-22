import { RouterProvider } from 'react-router-dom'

import { router } from './router'
import { EnvironmentProvider } from './providers/EnvironmentProvider'
import { ServicesProvider } from './providers/ServicesProvider'
import { ToastProvider } from './providers/ToastProvider'

export function App() {
  return (
    <ServicesProvider>
      <EnvironmentProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </EnvironmentProvider>
    </ServicesProvider>
  )
}
