import { readFileSync } from 'node:fs'
const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
const required = ['"binding": "DB"', '"binding": "RECIPE_SOURCES"', '"/api/*"', '"workers_dev": false', '"pattern": "recipes.merkavaenterprises.com"', '"custom_domain": true']
const missing = required.filter((entry) => !config.includes(entry))
if (missing.length > 0) throw new Error(`wrangler.jsonc is missing required Recipeapp configuration: ${missing.join(', ')}`)
console.log('Recipeapp production-safe configuration is present.')
