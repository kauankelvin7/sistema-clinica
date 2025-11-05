import { CIDS_COMPLETO } from './cids-completo'
import { CIDS_PARTE2 } from './cids-parte2'
import { CIDS_PARTE3 } from './cids-parte3'
import { CIDS_PARTE4 } from './cids-parte4'
import { CIDS_PARTE5 } from './cids-parte5'

// Combinação de todas as bases de CIDs
interface CidData {
  codigo: string
  descricao: string
}

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

// Base completa combinada de TODOS os CIDs (~3500+ códigos da CID-10 completa!)
export const TODOS_CIDS: CidData[] = [
  ...CIDS_COMPLETO,  // Capítulos I-V: A-F (Infecciosas, Neoplasias, Sangue, Endócrinas, Mentais)
  ...CIDS_PARTE2,    // Capítulos VI-XI: G-K (Nervoso, Olho, Ouvido, Circulatório, Respiratório, Digestivo)
  ...CIDS_PARTE3,    // Capítulos XII-XV: L-O (Pele, Músculo-esquelético, Geniturinário, Gravidez)
  ...CIDS_PARTE4,    // Capítulos XVI-XVIII: P-R (Perinatais, Congênitas, Sintomas)
  ...CIDS_PARTE5     // Capítulos XIX-XXI: S-Z (Lesões, Envenenamentos, Fatores de Saúde)
]

/**
 * Função de busca OTIMIZADA e INTELIGENTE de CIDs
 * 
 * Como funciona:
 * - Digite "A" → mostra A00, A01, A02... (em ordem alfabética)
 * - Digite "J0" → mostra J00, J01, J02...
 * - Digite "dor" → mostra todos com "dor" na descrição
 * - Digite "51" → mostra códigos com 51 (I51, J51, M51...)
 * 
 * Priorização INTELIGENTE:
 * 1º - Códigos que COMEÇAM com o termo (prefixo)
 * 2º - Códigos que CONTÊM o termo
 * 3º - Descrições que CONTÊM o termo
 * 
 * Performance: Muito rápido mesmo com 3500+ CIDs! ⚡
 */
export function searchCID(query: string): CidData[] {
  if (!query || query.length < 1) {
    return CIDS_COMUNS.slice(0, 10)
  }
  
  const searchTerm = query.toLowerCase().trim()
  
  // Arrays para categorizar resultados por PRIORIDADE
  const prefixMatches: CidData[] = []      // 🥇 PRIORIDADE 1: A → A00, A01, A02
  const codeContains: CidData[] = []       // 🥈 PRIORIDADE 2: 51 → I51, J51, M51
  const descMatches: CidData[] = []        // 🥉 PRIORIDADE 3: dor → "dor de cabeça"
  
  // Busca otimizada: UMA ÚNICA passada pelo array
  for (const cid of TODOS_CIDS) {
    const codigoLower = cid.codigo.toLowerCase()
    const descricaoLower = cid.descricao.toLowerCase()
    
    // PRIORIDADE 1: Códigos que começam com o termo (A, A0, A00...)
    if (codigoLower.startsWith(searchTerm)) {
      prefixMatches.push(cid)
    }
    // PRIORIDADE 2: Códigos que contêm o termo mas não começam
    else if (codigoLower.includes(searchTerm)) {
      codeContains.push(cid)
    }
    // PRIORIDADE 3: Descrições que contêm o termo
    else if (descricaoLower.includes(searchTerm)) {
      descMatches.push(cid)
    }
    
    // Otimização: para se já temos resultados suficientes
    if (prefixMatches.length + codeContains.length + descMatches.length >= 20) {
      break
    }
  }
  
  // Ordena códigos por prefixo ALFABETICAMENTE (A00, A01, A02, A03...)
  prefixMatches.sort((a, b) => a.codigo.localeCompare(b.codigo))
  
  // Combina resultados mantendo a PRIORIDADE e limita a 15 resultados
  return [
    ...prefixMatches,
    ...codeContains,
    ...descMatches
  ].slice(0, 15)
}


