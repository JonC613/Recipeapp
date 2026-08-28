import { NavLink, Outlet } from 'react-router'

export function AppShell() {
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <div className="site-header__content">
        <NavLink className="brand" to="/" end>Recipe Library</NavLink>
        <nav aria-label="Primary navigation"><NavLink to="/" end>Library</NavLink></nav>
      </div>
    </header>
    <main id="main-content" tabIndex={-1}><Outlet /></main>
    <footer className="site-footer">A calm place to keep the recipes you love.</footer>
  </div>
}
