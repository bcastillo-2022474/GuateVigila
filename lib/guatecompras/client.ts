import type { paths, components } from './types'

export type Release = components['schemas']['Releases']
export type Tender = components['schemas']['Tender']
export type Awards = components['schemas']['Awards']
export type Contracts = components['schemas']['Contracts']
export type Parties = components['schemas']['Parties']

const BASE_URL = 'https://ocds.guatecompras.gt'

type SearchReleasesResponse =
  paths['/release/search']['get']['responses'][200]['content']['application/json']
type SearchNogResponse =
  paths['/release/searchNog/{nog}']['get']['responses'][200]['content']['application/json']

async function fetchJson<T>(pathname: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(pathname, BASE_URL)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Guatecompras request failed (${response.status}) for ${url.pathname}`)
  }

  return (await response.json()) as T
}

export async function searchReleases(params: {
  anio?: number
  mes?: number
  dia?: number
  entidad?: number
  modalidad?: number
  estatus?: number
  pagina?: number
}): Promise<Release[]> {
  const data = await fetchJson<SearchReleasesResponse>('/release/search', {
    Anio: params.anio,
    Mes: params.mes,
    Dia: params.dia,
    Entidad: params.entidad,
    Modalidad_compradora: params.modalidad,
    Estatus_concurso: params.estatus,
    pagina: params.pagina,
  })
  return data?.releases ?? []
}

export async function getReleaseByNog(nog: number): Promise<Release | null> {
  const data = await fetchJson<SearchNogResponse>(`/release/searchNog/${nog}`)
  return data?.releases?.[0] ?? null
}

export async function getRecord(ocid: string) {
  return fetchJson<unknown>(`/record/${encodeURIComponent(ocid)}`)
}
