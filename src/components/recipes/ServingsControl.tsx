import { useState } from 'react'

export function ServingsControl({ original, servings, onChange }: { original: number; servings: number; onChange: (value: number) => void }) {
  const [input, setInput] = useState<string | null>(null)
  return <div className="servings-control">
    <label htmlFor="display-servings">Servings
      <input id="display-servings" type="number" min="1" max="100" step="1" value={input ?? String(servings)} onChange={(event) => {
        const value = event.target.value
        setInput(value)
        if (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100) onChange(Number(value))
      }} onBlur={() => setInput(null)} />
    </label>
    <span>Original recipe: {original}</span>
    {servings !== original && <button type="button" onClick={() => { setInput(null); onChange(original) }}>Reset</button>}
  </div>
}
