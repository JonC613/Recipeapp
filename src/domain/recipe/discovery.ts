import type { ManualRecipeInput } from './schema.js'

export type DiscoveryAdapter = 'wordpress_rest'
export type DiscoveryCriterionId = 'https' | 'robots' | 'search' | 'same_origin' | 'recipe'

export interface DiscoveryCriterion {
  id: DiscoveryCriterionId
  passed: boolean
  message: string
}

export interface DiscoveryValidationReport {
  compatible: boolean
  adapter?: DiscoveryAdapter
  criteria: DiscoveryCriterion[]
}

export interface DiscoverySite {
  id: string
  origin: string
  hostname: string
  adapter?: DiscoveryAdapter
  status: 'pending' | 'approved'
  enabled: boolean
  validation: DiscoveryValidationReport
  validatedAt: string
  approvedAt?: string
}

export interface DiscoverySearchResult {
  id: string
  title: string
  url: string
  siteId: string
  siteHostname: string
}

export interface DiscoverySearchResponse {
  results: DiscoverySearchResult[]
  sitesSearched: number
  sitesUnavailable: number
}

export interface DiscoveryPreview {
  sourceUrl: string
  siteHostname: string
  draft: ManualRecipeInput
}
