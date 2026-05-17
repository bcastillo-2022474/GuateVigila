export function getSupplierDisplayIdentifier(supplierId: string): string {
  const trimmedSupplierId = supplierId.trim()
  if (!trimmedSupplierId) return ''

  if (trimmedSupplierId.startsWith('GT-NIT-')) {
    return trimmedSupplierId.replace(/^GT-NIT-/, '')
  }

  if (trimmedSupplierId.startsWith('GT-GCID-')) {
    return trimmedSupplierId.replace(/^GT-GCID-/, '')
  }

  return trimmedSupplierId.replace(/^GT-/, '')
}

export function buildRegistroMercantilUrl(supplierId: string): string | undefined {
  const trimmedSupplierId = supplierId.trim()
  if (!trimmedSupplierId.startsWith('GT-NIT-')) return undefined

  const nit = trimmedSupplierId.replace(/^GT-NIT-/, '').replace(/K$/i, '')
  if (!nit) return undefined

  return `https://eregistros.registromercantil.gob.gt/index.jsp?nit=${encodeURIComponent(nit)}`
}
