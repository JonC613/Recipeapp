import { Link } from 'react-router'
export function NotFoundPage() { return <section className="recovery-page" aria-labelledby="not-found-title"><p className="eyebrow">404</p><h1 id="not-found-title">Page not found</h1><p>That page is not in your Recipe Library yet.</p><Link className="button-link" to="/">Return to Recipe Library</Link></section> }
