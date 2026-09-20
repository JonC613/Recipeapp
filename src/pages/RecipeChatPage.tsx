import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { RecipeChatConversation, RecipeChatConversationSummary, RecipeChatProposal, RecipeChatStreamEvent } from '../domain/recipe-chat.js'
import { cancelRecipeChatTurn, createRecipeChatConversation, deleteRecipeChatConversation, getRecipeChatConversation, listRecipeChatConversations, resolveRecipeChatProposal, streamRecipeChatMessage } from '../services/recipe-chat.js'
import './recipe-chat.css'

const MAX_QUESTION_LENGTH = 600

function ProposalPreview({ proposal }: { proposal: RecipeChatProposal }) {
  if (proposal.kind === 'recipe_variation') {
    const recipe = proposal.preview.recipe && typeof proposal.preview.recipe === 'object' && !Array.isArray(proposal.preview.recipe) ? proposal.preview.recipe as Record<string, unknown> : undefined
    const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : []
    const instructions = Array.isArray(recipe?.instructions) ? recipe.instructions : []
    return <div className="recipe-chat__recipe-preview">
      {typeof recipe?.title === 'string' && <h3>{recipe.title}</h3>}
      {typeof recipe?.description === 'string' && recipe.description && <p>{recipe.description}</p>}
      {typeof recipe?.servings === 'number' && <p><strong>Serves {recipe.servings}</strong></p>}
      {ingredients.length > 0 && <><h4>Ingredients</h4><ul>{ingredients.map((item, index) => { const value = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>).originalText : undefined; return typeof value === 'string' ? <li key={index}>{value}</li> : null })}</ul></>}
      {instructions.length > 0 && <><h4>Directions</h4><ol>{instructions.map((item, index) => { const value = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>).text : undefined; return typeof value === 'string' ? <li key={index}>{value}</li> : null })}</ol></>}
    </div>
  }
  if (proposal.kind === 'meal_plan') return <dl><div><dt>Day</dt><dd>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(proposal.preview.dayIndex)] ?? 'Selected day'}</dd></div><div><dt>Week of</dt><dd>{String(proposal.preview.weekStart ?? '')}</dd></div></dl>
  const excluded = Array.isArray(proposal.preview.excludedItems) ? proposal.preview.excludedItems.filter((item): item is string => typeof item === 'string') : []
  return <div className="recipe-chat__recipe-preview"><p><strong>Week of {String(proposal.preview.weekStart ?? '')}</strong></p>{excluded.length > 0 && <><h4>Leave off the list</h4><ul>{excluded.map((item) => <li key={item}>{item}</li>)}</ul></>}</div>
}

function ProposalCard({ conversationId, proposal, onChange }: { conversationId: string; proposal: RecipeChatProposal; onChange: (conversation: RecipeChatConversation) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState<string>()
  const resolve = async (action: 'apply' | 'cancel') => {
    setBusy(true); setError(undefined)
    try { onChange(await resolveRecipeChatProposal(conversationId, proposal.id, action)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The preview could not be updated.') }
    finally { setBusy(false) }
  }
  return <section className="recipe-chat__proposal" aria-label="Proposed change"><p className="card-kicker">Preview — no changes saved yet</p><strong>{proposal.summary}</strong><ProposalPreview proposal={proposal} />
    {proposal.status === 'pending' ? <div className="recipe-chat__proposal-actions"><button disabled={busy} onClick={() => void resolve('apply')}>Apply</button><button disabled={busy} className="button-secondary" onClick={() => void resolve('cancel')}>Cancel</button></div> : <p className="recipe-chat__limit">{proposal.status === 'applied' ? 'Applied' : proposal.status === 'cancelled' ? 'Cancelled' : 'This preview is no longer current.'}</p>}
    {error && <p role="alert">{error}</p>}
  </section>
}

export function RecipeChatPage() {
  const [conversations, setConversations] = useState<RecipeChatConversationSummary[]>([])
  const [active, setActive] = useState<RecipeChatConversation>()
  const [question, setQuestion] = useState(''), [progress, setProgress] = useState<string>(), [draft, setDraft] = useState(''), [error, setError] = useState<string>(), [deleting, setDeleting] = useState(false)
  const controller = useRef<AbortController | undefined>(undefined)
  const activeTurnId = useRef<string | undefined>(undefined)
  const normalized = question.trim().replace(/\s+/g, ' '), tooLong = normalized.length > MAX_QUESTION_LENGTH
  const refreshList = useCallback(async () => setConversations(await listRecipeChatConversations()), [])
  const makeConversation = useCallback(async () => { const created = await createRecipeChatConversation(); setActive(created); setDraft(''); await refreshList() }, [refreshList])

  useEffect(() => { void (async () => { try { const list = await listRecipeChatConversations(); setConversations(list); if (list[0]) setActive(await getRecipeChatConversation(list[0].id)); else await makeConversation() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Recipe Chat could not load.') } })(); return () => controller.current?.abort() }, [makeConversation])
  const selectConversation = async (id: string) => { controller.current?.abort(); setActive(await getRecipeChatConversation(id)); setDraft(''); setProgress(undefined); setError(undefined) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!active || !normalized || tooLong || progress) return
    controller.current = new AbortController(); activeTurnId.current = crypto.randomUUID(); setError(undefined); setDraft(''); setProgress('Starting…')
    try {
      await streamRecipeChatMessage(active.id, activeTurnId.current, normalized, (streamEvent: RecipeChatStreamEvent) => {
        if (streamEvent.type === 'progress') setProgress(streamEvent.message)
        if (streamEvent.type === 'text_delta') setDraft((value) => value + streamEvent.delta)
        if (streamEvent.type === 'completed') { setActive(streamEvent.conversation); setDraft(''); setQuestion('') }
        if (streamEvent.type === 'error') setError(streamEvent.message)
      }, controller.current.signal)
      await refreshList()
    } catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'Recipe Chat is temporarily unavailable.') }
    finally { activeTurnId.current = undefined; setProgress(undefined) }
  }
  const stopTurn = () => {
    const turnId = activeTurnId.current
    controller.current?.abort()
    if (active && turnId) void cancelRecipeChatTurn(active.id, turnId).catch(() => setError('Recipe Chat could not confirm that the response stopped.'))
  }
  const removeActive = async () => {
    if (!active || deleting) return
    controller.current?.abort(); setDeleting(true); setError(undefined)
    try {
      await deleteRecipeChatConversation(active.id)
      const remaining = await listRecipeChatConversations()
      setConversations(remaining); setDraft(''); setProgress(undefined)
      setActive(remaining[0] ? await getRecipeChatConversation(remaining[0].id) : undefined)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The conversation could not be deleted.') }
    finally { setDeleting(false) }
  }

  return <section className="recipe-page recipe-chat-page"><div className="page-heading recipe-chat__heading"><div><p className="eyebrow">Your everyday recipe assistant</p><h1>Recipe Chat</h1><p className="page-heading__description">Ask about saved recipes, plan dinner, or preview a recipe variation before anything changes.</p></div>{active && <button className="recipe-chat__new" type="button" onClick={() => void makeConversation()}><span aria-hidden="true">＋</span> New chat</button>}</div>
    <div className={`recipe-chat__layout ${!active ? 'recipe-chat__layout--empty' : ''}`}>{active && <aside className="recipe-chat__sidebar" aria-label="Saved conversations"><div className="recipe-chat__sidebar-heading"><strong>Conversations</strong><span>{conversations.length}</span></div><div className="recipe-chat__conversation-list">{conversations.map((conversation) => <button type="button" aria-pressed={active.id === conversation.id} className={active.id === conversation.id ? 'is-active' : ''} key={conversation.id} onClick={() => void selectConversation(conversation.id)}><span>{conversation.title}</span><small>{new Date(conversation.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></button>)}</div><button type="button" className="recipe-chat__delete" disabled={deleting} onClick={() => void removeActive()}>{deleting ? 'Deleting…' : 'Delete this chat'}</button></aside>}
      <div className="recipe-chat__main">{!active ? <section className="recipe-chat__start"><span aria-hidden="true">✦</span><h2>Start a new conversation</h2><p>Ask Recipe Chat to find, compare, or adapt something from your library.</p><button type="button" onClick={() => void makeConversation()}>New chat</button></section> : <><section className="recipe-chat__messages" aria-live="polite" aria-label="Recipe Chat conversation">{!active.messages.length && <div className="recipe-chat__welcome"><span aria-hidden="true">✦</span><div><h2>What would you like to cook?</h2><p>Try “Find a quick chicken dinner,” then ask to adapt it, add it to your meal plan, or prepare its grocery list.</p></div></div>}{active.messages.map((message) => <article className={`recipe-chat__message ${message.role === 'user' ? 'recipe-chat__message--question' : ''}`} key={message.id}><p className="card-kicker">{message.role === 'user' ? 'You' : 'Recipe Chat'}</p><p>{message.text}</p>{message.sourceKind && <p className="recipe-chat__source">{message.sourceKind === 'library' ? 'From your saved recipes' : message.sourceKind === 'general' ? 'General cooking guidance' : 'Saved recipes + general cooking guidance'}</p>}{message.citations.length > 0 && <div className="recipe-chat__citations"><strong>Referenced recipes</strong><ul>{message.citations.map((citation) => <li key={citation.recipeId}><Link to={`/recipes/${citation.recipeId}`}>{citation.title}</Link></li>)}</ul></div>}{message.proposal && <ProposalCard conversationId={active.id} proposal={message.proposal} onChange={setActive} />}</article>)}{draft && <article className="recipe-chat__message"><p className="card-kicker">Recipe Chat</p><p>{draft}</p></article>}</section>
        {error && <section className="recipe-chat__error" role="alert"><p>{error}</p></section>}
        <form className="recipe-chat__form" onSubmit={(event) => void submit(event)}><label htmlFor="recipe-chat-question"><span>Message Recipe Chat</span><textarea id="recipe-chat-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={MAX_QUESTION_LENGTH + 1} rows={3} disabled={Boolean(progress)} placeholder="Ask about your recipes…" /></label><div className="recipe-chat__form-footer"><p className={tooLong ? 'recipe-chat__limit recipe-chat__limit--invalid' : 'recipe-chat__limit'}>{normalized.length} / {MAX_QUESTION_LENGTH}</p><div><button type="submit" disabled={!normalized || tooLong || Boolean(progress)}>{progress ?? 'Send'}</button>{progress && <button type="button" className="button-secondary" onClick={stopTurn}>Stop</button>}</div></div></form></>}</div>
    </div>
  </section>
}
