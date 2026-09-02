import { NavLink, Outlet } from 'react-router'
import { useEffect, useState } from 'react'
import { checkHealth, type ServiceAvailability } from '../services/health'

export function AppShell() {
  const [availability, setAvailability] = useState<ServiceAvailability>({ state: 'idle', retryable: false })
  const refreshHealth = async () => { setAvailability({ state: 'checking', retryable: false }); setAvailability(await checkHealth()) }
  useEffect(() => { void refreshHealth() }, [])
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <div className="site-header__content">
        <NavLink className="brand" to="/" end>Recipe Library</NavLink>
        <nav aria-label="Primary navigation">
          <NavLink to="/" end>Library</NavLink>
          <NavLink to="/recipes/import">Import</NavLink>
          <NavLink to="/admin/usage">Usage</NavLink>
        </nav>
      </div>
    </header>
    <main id="main-content" tabIndex={-1}>{availability.state === 'unavailable' && <div className="service-status service-status--unavailable" role="alert"><p>{availability.message}</p><button type="button" onClick={() => void refreshHealth()}>Retry</button></div>}<Outlet /></main>
    <footer className="site-footer">A calm place to keep the recipes you love.</footer>
  </div>
}
