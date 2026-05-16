import createClient from 'openapi-fetch'
import type { paths, components } from './types'

export type Release = components['schemas']['Releases']
export type Tender = components['schemas']['Tender']
export type Awards = components['schemas']['Awards']
export type Contracts = components['schemas']['Contracts']
export type Parties = components['schemas']['Parties']

const BASE_URL = 'https://ocds.guatecompras.gt'

export const guatecompras = createClient<paths>({ baseUrl: BASE_URL })

export async function searchReleases(params: {
  anio?: number
  mes?: number
  dia?: number
  entidad?: number
  modalidad?: number
  estatus?: number
  pagina?: number
}): Promise<Release[]> {
  const { data } = await guatecompras.GET('/release/search', {
    params: {
      query: {
        Anio: params.anio,
        Mes: params.mes,
        Dia: params.dia,
        Entidad: params.entidad,
        Modalidad_compradora: params.modalidad,
        Estatus_concurso: params.estatus,
        pagina: params.pagina,
      },
    },
  })
  return data?.releases ?? []
}

export async function getReleaseByNog(nog: number): Promise<Release | null> {
  const { data } = await guatecompras.GET('/release/searchNog/{nog}', {
    params: { path: { nog } },
  })
  return data?.releases?.[0] ?? null
}

export async function getRecord(ocid: string) {
  const { data } = await guatecompras.GET('/record/{ocid}', {
    params: { path: { ocid } },
  })
  return data
}
