import type { ImportApprovalInput, RecipeImport } from '../domain/recipe/imports.js'
import type { Recipe } from './recipes.js'
async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } }); if (!response.ok) { const body = await response.json().catch(() => undefined) as { error?: { message?: string } }; throw new Error(body?.error?.message ?? 'The recipe import could not be completed.') } return response.json() as Promise<T> }
export function importRecipeUrl(url: string): Promise<RecipeImport> { return request('/api/import/url', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) }) }
export function importRecipeText(text: string): Promise<RecipeImport> { return request('/api/import/text', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) }) }
export function importRecipePdf(file: File): Promise<RecipeImport> { const body = new FormData(); body.set('file', file); return request('/api/import/pdf', { method: 'POST', body }) }
export function runPdfOcr(importId: string): Promise<RecipeImport> { return request(`/api/import/${encodeURIComponent(importId)}/ocr`, { method: 'POST' }) }
export function getRecipeImport(importId: string): Promise<RecipeImport> { return request(`/api/import/${encodeURIComponent(importId)}`) }
export function approveRecipeImport(importId: string, input: ImportApprovalInput): Promise<Recipe> { return request(`/api/import/${encodeURIComponent(importId)}/approve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }) }
