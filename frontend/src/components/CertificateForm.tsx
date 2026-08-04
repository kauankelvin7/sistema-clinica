import { useState } from 'react'
import type { CertificateFormProps } from '../types'
import AutocompleteInput from './AutocompleteInput'
import { searchCID } from '../data/cids'
import { Calendar, AlertCircle, Clock, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../utils/i18n'

interface CidOption {
  label: string
  value: string
  codigo: string
  descricao: string
}

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  const { t, lang } = useTranslation()
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
    if (!formData.dataAtestado || !formData.diasAfastamento) return null
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

    const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'

    const formattedDate = endDate.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    const rawWeekDay = endDate.toLocaleDateString(locale, { weekday: 'long' })
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

        {/* Data e Dias de Afastamento em linha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
              {t.certificateDateLabel}
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
              {t.leaveDaysLabel}
            </label>
            <input
              type="number"
              className="input-field"
              placeholder={t.leaveDaysPlaceholder}
              min="1"
              value={formData.diasAfastamento}
              onChange={(e) => updateFormData('diasAfastamento', e.target.value)}
            />
          </div>
        </div>

        {/* Código CID */}
        <div>
          <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
            {t.cidLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="w-full flex-1">
              <AutocompleteInput
                value={formData.cidNaoInformado ? '' : formData.cid}
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
                placeholder={t.cidPlaceholder}
                minChars={1}
                disabled={formData.cidNaoInformado}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap px-1 py-1 group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-orange-500 bg-white dark:bg-surface-input focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
                checked={formData.cidNaoInformado}
                onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
              />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                {t.cidNotProvided}
              </span>
            </label>
          </div>
        </div>

        {/* Painel Informativo Inteligente de Retorno e Regra do INSS (CLT) */}
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
                  <span>{t.expectedReturnTitle}: {returnInfo.formattedDate} ({returnInfo.weekDay})</span>
                </div>
                <p className="text-[11px] opacity-90 leading-snug">
                  {returnInfo.requiresINSS
                    ? `⚠️ ${t.cltExceededWarning}`
                    : `✓ ${t.cltNormalNotice}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="text-[11px]">
              {t.fillDateNotice}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
