const BASE = 'https://www.guatecompras.gt'

export function supplierUrl(nit: string): string {
  return `${BASE}/proveedores/consultaProveeHist.aspx?nit=${nit}`
}

export function tenderUrl(nog: number | string): string {
  return `${BASE}/concursos/consultaconcurso.aspx?nog=${nog}`
}

export function nogFromOcid(ocid: string): string | null {
  const match = ocid.match(/(\d+)$/)
  return match ? match[1] : null
}

export function entitySearchUrl(entityName: string): string {
  return `${BASE}/concursos/listadoConcursos.aspx?entidad=${encodeURIComponent(entityName)}`
}
