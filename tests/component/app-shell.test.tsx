import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { AppShell } from '../../src/app/AppShell'
import { HomePage } from '../../src/pages/HomePage'
import { NotFoundPage } from '../../src/pages/NotFoundPage'
import { RouteErrorPage } from '../../src/pages/RouteErrorPage'

function createRouter(initialEntry = '/') {
  return createMemoryRouter(
    [
      {
        path: '/',
        Component: AppShell,
        children: [
          { index: true, Component: HomePage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  )
}

test('renders an accessible Recipe Library shell', async () => {
  const screen = await render(<RouterProvider router={createRouter()} />)

  await expect.element(screen.getByRole('banner')).toBeVisible()
  await expect.element(screen.getByRole('main')).toBeVisible()
  await expect.element(screen.getByRole('heading', { name: 'Recipe Library' })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Skip to main content' })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Import' })).toBeVisible()
})

test('shows a route-specific not-found recovery page', async () => {
  const screen = await render(<RouterProvider router={createRouter('/missing')} />)

  await expect.element(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Return to Recipe Library' })).toBeVisible()
})

test('shows safe recovery when a route fails unexpectedly', async () => {
  const router = createMemoryRouter([
    {
      path: '/',
      Component: AppShell,
      errorElement: <RouteErrorPage />,
      children: [{ path: 'broken', loader: () => { throw new Error('private detail') }, Component: HomePage }],
    },
  ], { initialEntries: ['/broken'] })
  const screen = await render(<RouterProvider router={router} />)

  await expect.element(screen.getByRole('heading', { name: 'We could not open that page' })).toBeVisible()
})
