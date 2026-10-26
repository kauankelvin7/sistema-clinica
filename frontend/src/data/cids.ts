export interface CidData {
  codigo: string
  descricao: string
}

// Sugestões frequentes mantidas no carregamento inicial.
// Lista expandida de CIDs mais comuns para carregamento rápido inicial
export const CIDS_COMUNS: CidData[] = [
  { codigo: 'A09', descricao: 'Diarreia e gastroenterite de origem infecciosa presumível' },
  { codigo: 'B34.9', descricao: 'Infecção viral não especificada' },
  { codigo: 'G43', descricao: 'Enxaqueca' },
  { codigo: 'G44', descricao: 'Outras síndromes de cefaleia' },
  { codigo: 'H10', descricao: 'Conjuntivite' },
  { codigo: 'H66', descricao: 'Otite média supurativa e as não especificadas' },
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)' },
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)' },
  { codigo: 'J02', descricao: 'Faringite aguda' },
  { codigo: 'J03', descricao: 'Amigdalite aguda' },
  { codigo: 'J06', descricao: 'Infecção aguda das vias aéreas superiores' },
  { codigo: 'J11', descricao: 'Influenza (gripe) devida a vírus não identificado' },
  { codigo: 'J18', descricao: 'Pneumonia por microorganismo não especificado' },
  { codigo: 'J20', descricao: 'Bronquite aguda' },
  { codigo: 'J30', descricao: 'Rinite alérgica e vasomotora' },
  { codigo: 'J40', descricao: 'Bronquite não especificada como aguda ou crônica' },
  { codigo: 'J45', descricao: 'Asma' },
  { codigo: 'K29', descricao: 'Gastrite e duodenite' },
  { codigo: 'K30', descricao: 'Dispepsia' },
  { codigo: 'K52', descricao: 'Outras gastroenterites e colites não infecciosas' },
  { codigo: 'K59', descricao: 'Outros transtornos funcionais do intestino' },
  { codigo: 'M25.5', descricao: 'Dor articular' },
  { codigo: 'M54', descricao: 'Dorsalgia (dor nas costas)' },
  { codigo: 'M54.5', descricao: 'Dor lombar baixa' },
  { codigo: 'M79.1', descricao: 'Mialgia' },
  { codigo: 'N39', descricao: 'Outros transtornos do trato urinário' },
  { codigo: 'O26.9', descricao: 'Afecção relacionada com a gravidez, não especificada' },
  { codigo: 'R05', descricao: 'Tosse' },
  { codigo: 'R10', descricao: 'Dor abdominal e pélvica' },
  { codigo: 'R11', descricao: 'Náusea e vômitos' },
  { codigo: 'R50', descricao: 'Febre de origem desconhecida' },
  { codigo: 'R51', descricao: 'Cefaleia' },
  { codigo: 'R68', descricao: 'Outros sintomas e sinais gerais' },
  { codigo: 'S06', descricao: 'Traumatismo intracraniano' },
  { codigo: 'S52', descricao: 'Fratura do antebraço' },
  { codigo: 'S60', descricao: 'Traumatismo superficial do punho e da mão' },
  { codigo: 'S82', descricao: 'Fratura da perna, incluindo tornozelo' },
  { codigo: 'S93', descricao: 'Luxação, entorse e distensão das articulações do tornozelo e pé' },
  { codigo: 'T14.9', descricao: 'Traumatismo não especificado' },
  { codigo: 'Z76.5', descricao: 'Pessoa fingindo ser doente (simulação consciente)' },
  { codigo: 'F32', descricao: 'Episódios depressivos' },
  { codigo: 'F41', descricao: 'Outros transtornos ansiosos' },
  { codigo: 'F43', descricao: 'Reações ao estresse grave e transtornos de adaptação' },
  { codigo: 'F48', descricao: 'Outros transtornos neuróticos' },
  { codigo: 'Z73.0', descricao: 'Estado de exaustão (Burnout)' },
]


// Fonte: DATASUS CID-10 V2008, 14.233 códigos únicos + 5 complementos
// de COVID-19 (Guia de Vigilância Integrada do Ministério da Saúde, 2024).
// https://www2.datasus.gov.br/cid10/V2008/downloads/CID10CSV.zip
type CIDIndex = CidData & { codigoBusca: string; descricaoBusca: string }
const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

let catalogoPromise: Promise<CIDIndex[]> | undefined

function carregarCatalogo(): Promise<CIDIndex[]> {
  if (!catalogoPromise) {
    catalogoPromise = Promise.all([
      import('./cid10/catalogo-a-d.json'),
      import('./cid10/catalogo-e-h.json'),
      import('./cid10/catalogo-i-l.json'),
      import('./cid10/catalogo-m-p.json'),
      import('./cid10/catalogo-q-t.json'),
      import('./cid10/catalogo-u-z.json'),
    ]).then(partes => partes.flatMap(parte => parte.default.map(([codigo, descricao]) => ({
      codigo,
      descricao,
      codigoBusca: codigo.replace('.', '').toUpperCase(),
      descricaoBusca: normalizar(descricao),
    })))).catch((error: unknown) => {
      catalogoPromise = undefined
      throw error
    })
  }
  return catalogoPromise
}

/** Busca todos os códigos, priorizando exato, prefixo, trecho e descrição.
 * Aceita F321/F32.1 e texto com ou sem acentos; limita após a varredura.
 */
export async function searchCID(query: string): Promise<CidData[]> {
  const termo = query.trim()
  if (!termo) return CIDS_COMUNS.slice(0, 10)
  if (termo.length > 120) return []
  const itens = await carregarCatalogo()
  const codigo = termo.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const descricao = normalizar(termo)
  const exatos: CidData[] = []
  const prefixos: CidData[] = []
  const trechos: CidData[] = []
  const descricoes: CidData[] = []
  for (const item of itens) {
    const cid = { codigo: item.codigo, descricao: item.descricao }
    if (codigo && item.codigoBusca === codigo) exatos.push(cid)
    else if (codigo && item.codigoBusca.startsWith(codigo)) prefixos.push(cid)
    else if (codigo && item.codigoBusca.includes(codigo)) trechos.push(cid)
    else if (item.descricaoBusca.includes(descricao)) descricoes.push(cid)
  }
  return [...exatos, ...prefixos, ...trechos, ...descricoes].slice(0, 15)
}
