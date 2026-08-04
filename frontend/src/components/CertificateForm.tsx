import { useState } from 'react'
import type { CertificateFormProps } from '../types'
import AutocompleteInput from './AutocompleteInput'
import { searchCID } from '../data/cids'
import { Calendar, AlertCircle, Clock, ShieldCheck, FileSpreadsheet, Stethoscope } from 'lucide-react'

interface CidOption {
  label: string
  value: string
  codigo: string
  descricao: string
}

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  const [cidOptions, setCidOptions] = useState<CidOption[]>([])

  // Atualiza opções de CID conforme o usuário digita (busca dinâmica)
  const handleCidSearch = (value: string) => {
    const results = searchCID(value)
    const options = results.map(cid => ({
      label: `${cid.codigo} - ${cid.descricao}`,
      value: cid.codigo,
      codigo: cid.codigo,
      descricao: cid.descricao
    }))
    setCidOptions(options)
  }

  // Função auxiliar para calcular data prevista de retorno ao trabalho
  const calculateReturnInfo = () => {
    if (!formData.dataAtestado || !formData.diasAfastamento || formData.tipoAtestado === 'fisico') return null
    const days = parseInt(formData.diasAfastamento, 10)
    if (isNaN(days) || days <= 0) return null

    const parts = formData.dataAtestado.split('-')
    if (parts.length !== 3) return null

    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)

    const startDate = new Date(year, month, day)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + days)

    const formattedDate = endDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    const rawWeekDay = endDate.toLocaleDateString('pt-BR', { weekday: 'long' })
    const weekDay = rawWeekDay.charAt(0).toUpperCase() + rawWeekDay.slice(1)

    return {
      formattedDate,
      weekDay,
      days,
      requiresINSS: days > 15
    }
  }

  const returnInfo = calculateReturnInfo()

  return (
    <div className="space-y-4 flex flex-col h-full justify-between">
      <div className="space-y-4">

        {/* 1. Modalidade / Tipo de Atestado */}
        <div>
          <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
            Tipo de Atestado / Finalidade
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateFormData('tipoAtestado', 'saude')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                formData.tipoAtestado === 'saude'
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Saúde / Afastamento</span>
            </button>

            <button
              type="button"
              onClick={() => updateFormData('tipoAtestado', 'fisico')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                formData.tipoAtestado === 'fisico'
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Comparecimento / Físico</span>
            </button>
          </div>
        </div>

        {/* 2. Data e Dias de Afastamento em linha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
              Data do Atestado
            </label>
            <input
              type="date"
              className="input-field"
              value={formData.dataAtestado}
              onChange={(e) => updateFormData('dataAtestado', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
              Dias de Afastamento
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="Ex: 3 dias"
              min="1"
              disabled={formData.tipoAtestado === 'fisico'}
              value={formData.tipoAtestado === 'fisico' ? '' : formData.diasAfastamento}
              onChange={(e) => updateFormData('diasAfastamento', e.target.value)}
            />
          </div>
        </div>

        {/* 3. Código CID */}
        <div>
          <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
            Código CID (Classificação Internacional de Doenças)
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="w-full flex-1">
              <AutocompleteInput
                value={formData.cidNaoInformado || formData.tipoAtestado === 'fisico' ? '' : formData.cid}
                onChange={(value) => {
                  updateFormData('cid', value)
                  handleCidSearch(value)
                }}
                onSelect={(option) => {
                  const selectedCid = cidOptions.find(cid => cid.value === option.value)
                  if (selectedCid) {
                    updateFormData('cid', selectedCid.codigo)
                  }
                }}
                options={cidOptions}
                placeholder={
                  formData.tipoAtestado === 'fisico'
                    ? 'Atestado de comparecimento (CID Isento)'
                    : 'Digite o código ou descrição (Ex: J00, gripe, dor)'
                }
                minChars={1}
                disabled={formData.cidNaoInformado || formData.tipoAtestado === 'fisico'}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap px-1 py-1 group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-orange-500 bg-white dark:bg-surface-input focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
                checked={formData.cidNaoInformado}
                disabled={formData.tipoAtestado === 'fisico'}
                onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
              />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                Não Informado
              </span>
            </label>
          </div>
        </div>

        {/* 4. Painel Informativo Inteligente de Retorno e Regra do INSS (CLT) */}
        {returnInfo ? (
          <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
            returnInfo.requiresINSS
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {returnInfo.requiresINSS ? (
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold tracking-tight">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Retorno Previsto: {returnInfo.formattedDate} ({returnInfo.weekDay})</span>
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  {returnInfo.requiresINSS
                    ? `⚠️ Afastamento de ${returnInfo.days} dias excede o limite CLT de 15 dias. Requer encaminhamento para perícia médica do INSS a partir do 16º dia.`
                    : `✓ Afastamento de ${returnInfo.days} dias dentro do limite legal de 15 dias. Homologação direta e custeada pela empresa.`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="text-[11px]">
              {formData.tipoAtestado === 'fisico'
                ? 'Atestado de Comparecimento: sem necessidade de afastamento das atividades laborais.'
                : 'Preencha a data e os dias de afastamento para calcular a previsão de retorno ao trabalho.'}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
