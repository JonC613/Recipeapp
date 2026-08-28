import { Link } from 'react-router'
export function RouteErrorPage() { return <section className="recovery-page" aria-labelledby="route-error-title"><p className="eyebrow">Something went wrong</p><h1 id="route-error-title">We could not open that page</h1><p>Please try again or return to your Recipe Library.</p><Link className="button-link" to="/">Return to Recipe Library</Link></section> }
