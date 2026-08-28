import { useEffect, useState } from 'react'
import { checkHealth, type ServiceAvailability } from '../services/health'

export function HomePage() {
  const [availability, setAvailability] = useState<ServiceAvailability>({ state: 'idle', retryable: false })
  const refreshHealth = async () => { setAvailability({ state: 'checking', retryable: false }); setAvailability(await checkHealth()) }
  useEffect(() => { void refreshHealth() }, [])
  return <section className="welcome" aria-labelledby="page-title">
    <p className="eyebrow">Your personal kitchen archive</p>
    <h1 id="page-title">Recipe Library</h1>
    <p className="lede">Save the recipes worth making again, then keep them clear, searchable, and ready when you cook.</p>
    <section className="foundation-card" aria-labelledby="foundation-title">
      <p className="card-kicker">Foundation</p><h2 id="foundation-title">Your library is getting ready</h2>
      <p>Manual recipe creation is the next step. This release establishes a reliable, mobile-friendly home for it.</p>
      <ServiceStatus availability={availability} onRetry={refreshHealth} />
    </section>
  </section>
}

function ServiceStatus({ availability, onRetry }: { availability: ServiceAvailability; onRetry: () => Promise<void> }) {
  if (availability.state === 'idle' || availability.state === 'checking') return <p className="service-status" role="status">Checking service availability…</p>
  if (availability.state === 'available') return <p className="service-status service-status--available" role="status">Service is ready.</p>
  return <div className="service-status service-status--unavailable" role="alert"><p>{availability.message}</p><button type="button" onClick={() => void onRetry()}>Retry</button></div>
}
