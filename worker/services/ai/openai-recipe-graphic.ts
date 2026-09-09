export class RecipeGraphicError extends Error {
  readonly code: 'UNAVAILABLE' | 'INVALID_OUTPUT'
  constructor(code: 'UNAVAILABLE' | 'INVALID_OUTPUT') { super(code); this.code = code }
}

export class OpenAiRecipeGraphic {
  private readonly apiKey: string
  private readonly request: typeof fetch
  constructor(apiKey: string, request: typeof fetch = fetch) { this.apiKey = apiKey; this.request = request.bind(globalThis) }

  async generate(recipe: { title: string; description?: string; ingredients: Array<{ originalText: string }> }): Promise<Uint8Array> {
    const ingredients = recipe.ingredients.slice(0, 12).map((item) => item.originalText.slice(0, 120))
    const prompt = `Square editorial food illustration of ${recipe.title}. Make the actual meal recognizable from these ingredients: ${ingredients.join(', ')}. ${recipe.description?.slice(0, 300) ?? ''} Playfully ridiculous high-end restaurant-menu energy: dramatic, surreal garnish or impossible presentation, but appetizing. No words, labels, logos, people, or text.`
    let response: Response
    try {
      response = await this.request('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: 'gpt-image-1-mini', prompt, size: '1024x1024', quality: 'low', output_format: 'png', n: 1 }) })
    } catch (error) {
      console.warn('OpenAI recipe graphic transport failed.', { errorName: error instanceof Error ? error.name : 'unknown', message: error instanceof Error ? error.message.slice(0, 160) : undefined })
      throw new RecipeGraphicError('UNAVAILABLE')
    }
    if (!response.ok) {
      console.warn('OpenAI recipe graphic request was rejected.', { status: response.status })
      throw new RecipeGraphicError('UNAVAILABLE')
    }
    const payload = await response.json().catch(() => undefined) as { data?: Array<{ b64_json?: string }> } | undefined
    const encoded = payload?.data?.[0]?.b64_json
    if (!encoded || encoded.length > 12_000_000) throw new RecipeGraphicError('INVALID_OUTPUT')
    try { return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)) } catch { throw new RecipeGraphicError('INVALID_OUTPUT') }
  }
}
