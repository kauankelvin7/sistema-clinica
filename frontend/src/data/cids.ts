// Lista de CIDs mais comuns em atestados médicos
export const CIDS_COMUNS = [
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

export function searchCID(query: string) {
  if (!query || query.length < 1) return []
  
  const searchTerm = query.toLowerCase()
  
  return CIDS_COMUNS.filter(cid => 
    cid.codigo.toLowerCase().includes(searchTerm) ||
    cid.descricao.toLowerCase().includes(searchTerm)
  ).slice(0, 10) // Limita a 10 resultados
}
