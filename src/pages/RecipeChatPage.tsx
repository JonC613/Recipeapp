import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { RecipeChatHistoryItem, RecipeChatResponse } from '../domain/recipe-chat.js'
import { askRecipeChat } from '../services/recipe-chat.js'

const MAX_QUESTION_LENGTH = 600
type Message = { role: 'question'; text: string } | { role: 'answer'; response: RecipeChatResponse }

export function RecipeChatPage() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const controller = useRef<AbortController | undefined>(undefined)
  const generation = useRef(0)
  const normalized = question.trim().replace(/\s+/g, ' ')
  const tooLong = normalized.length > MAX_QUESTION_LENGTH

  const history = (): RecipeChatHistoryItem[] => messages.flatMap((message, index) => message.role === 'answer' && message.response.outcome === 'answer' ? (() => { const prior = messages[index - 1]; return prior?.role === 'question' ? [{ question: prior.text, answer: message.response.answer, citationIds: message.response.citations.map((citation) => citation.recipeId) }] : [] })() : []).slice(-3)
  const ask = async (retryQuestion?: string) => {
    const submitted = retryQuestion ?? normalized
    if (!submitted || tooLong || busy) return
    const requestGeneration = ++generation.current; controller.current = new AbortController(); const timeout = window.setTimeout(() => controller.current?.abort(), 50_000)
    setBusy(true); setError(undefined); if (!retryQuestion) setMessages((current) => [...current, { role: 'question', text: submitted }])
    try {
      const response = await askRecipeChat(submitted, history(), controller.current.signal)
      if (generation.current !== requestGeneration) return
      setMessages((current) => [...current, { role: 'answer', response }])
      setQuestion('')
    } catch (cause) { if (generation.current === requestGeneration && !(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'Recipe Chat is temporarily unavailable. Please try again.') }
    finally { window.clearTimeout(timeout); if (generation.current === requestGeneration) setBusy(false) }
  }
  const cancel = () => { generation.current += 1; controller.current?.abort(); setBusy(false) }
  const clear = () => { cancel(); setMessages([]); setError(undefined); setQuestion('') }
  useEffect(() => () => { generation.current += 1; controller.current?.abort() }, [])
  const submit = (event: React.FormEvent) => { event.preventDefault(); void ask() }

  return <section className="recipe-page recipe-chat-page"><div className="page-heading"><div><p className="eyebrow">Ask your library</p><h1>Recipe Chat</h1><p className="page-heading__description">Ask about saved recipes in plain language. Answers use your saved recipes only.</p></div></div>
    <form className="recipe-chat__form" onSubmit={submit}><label htmlFor="recipe-chat-question">Your recipe question<textarea id="recipe-chat-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={MAX_QUESTION_LENGTH + 1} rows={3} placeholder="Which saved recipes use shrimp?" disabled={busy} /></label><div className="recipe-chat__form-footer"><p className={tooLong ? 'recipe-chat__limit recipe-chat__limit--invalid' : 'recipe-chat__limit'}>{normalized.length} / {MAX_QUESTION_LENGTH} characters</p><button type="submit" disabled={!normalized || tooLong || busy}>{busy ? 'Searching recipes…' : 'Ask Recipe Chat'}</button>{busy && <button type="button" onClick={cancel}>Cancel</button>}{messages.length > 0 && <button type="button" onClick={clear}>Clear conversation</button>}</div>{tooLong && <p role="alert">Keep your question to {MAX_QUESTION_LENGTH} characters or fewer.</p>}<p className="recipe-chat__limit">Follow-up context is temporary and clears when you leave this page.</p></form>
    {error && <section className="recipe-chat__error" role="alert"><p>{error}</p><button type="button" onClick={() => { const prior = [...messages].reverse().find((message): message is Extract<Message, { role: 'question' }> => message.role === 'question'); if (prior) void ask(prior.text) }}>Retry question</button></section>}
    <section className="recipe-chat__messages" aria-live="polite" aria-label="Recipe Chat conversation">{messages.length === 0 ? <p className="empty-state">Try asking about an ingredient, a cuisine, a recipe name, or a cooking method. You can also ask for recipes under 30 minutes or without mushrooms.</p> : messages.map((message, index) => message.role === 'question' ? <article className="recipe-chat__message recipe-chat__message--question" key={`question-${index}`}><p className="card-kicker">You asked</p><p>{message.text}</p></article> : message.response.outcome === 'answer' ? <article className="recipe-chat__message" key={`answer-${index}`}><p className="card-kicker">Recipe Chat</p><p>{message.response.answer}</p>{message.response.contextLimited && <p className="recipe-chat__limit">This answer covers selected matching recipes, not necessarily your entire library.</p>}<div className="recipe-chat__citations"><strong>Referenced recipes</strong><ul>{message.response.citations.map((citation) => <li key={citation.recipeId}><Link to={`/recipes/${citation.recipeId}`}>{citation.title}</Link></li>)}</ul></div></article> : <article className="recipe-chat__message recipe-chat__message--no-match" key={`answer-${index}`}><p className="card-kicker">Recipe Chat</p><p>{message.response.message}</p></article>)}</section>
  </section>
}
