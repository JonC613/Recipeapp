import { createBrowserRouter } from 'react-router'
import { AppShell } from './AppShell'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'

export const router = createBrowserRouter([{ path: '/', Component: AppShell, errorElement: <RouteErrorPage />, children: [
  { index: true, Component: HomePage }, { path: '*', Component: NotFoundPage },
] }])
