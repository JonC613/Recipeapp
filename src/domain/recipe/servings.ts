const vulgarFractions: Record<string, number> = {
  '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
}

const amount = String.raw`(?:\d+\s+\d+\/\d+|\d+[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])`
const leadingAmount = new RegExp(`^(\\s*)(${amount})(?:(\\s*(?:-|–|—|to)\\s*)(${amount}))?(?=\\s|$|[,;(])`, 'i')

function parseAmount(value: string): number | undefined {
  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const fraction = value.match(/^(\d+)\/(\d+)$/)
  if (fraction) return Number(fraction[1]) / Number(fraction[2])
  const vulgar = value.match(/^(\d+)?([¼½¾⅓⅔⅛⅜⅝⅞])$/)
  if (vulgar) return Number(vulgar[1] ?? 0) + vulgarFractions[vulgar[2]]
  return Number(value)
}

function formatAmount(value: number): string {
  const whole = Math.floor(value + 1e-9)
  const remainder = value - whole
  if (remainder < 0.001) return String(whole)
  for (let denominator = 2; denominator <= 16; denominator++) {
    const numerator = Math.round(remainder * denominator)
    if (numerator > 0 && numerator < denominator && Math.abs(remainder - numerator / denominator) < 0.002) {
      return whole ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`
    }
  }
  return String(Number(value.toFixed(2)))
}

export function scaledIngredientText(text: string, baseServings: number | undefined, servings: number): string {
  if (!baseServings || baseServings <= 0 || !Number.isFinite(baseServings) || !Number.isFinite(servings) || servings <= 0 || servings === baseServings) return text
  const match = text.match(leadingAmount)
  if (!match) return text
  const first = parseAmount(match[2])
  const second = match[4] ? parseAmount(match[4]) : undefined
  if (first === undefined || !Number.isFinite(first) || (match[4] && (second === undefined || !Number.isFinite(second)))) return text
  const factor = servings / baseServings
  const prefix = `${match[1]}${formatAmount(first * factor)}${match[3] ? `${match[3]}${formatAmount(second! * factor)}` : ''}`
  return prefix + text.slice(match[0].length)
}

export function selectedServings(value: string | null, baseServings: number | undefined): number | undefined {
  if (!baseServings || baseServings <= 0 || !Number.isFinite(baseServings)) return undefined
  const target = value && /^\d+$/.test(value) ? Number(value) : NaN
  return Number.isInteger(target) && target >= 1 && target <= 100 ? target : baseServings
}
