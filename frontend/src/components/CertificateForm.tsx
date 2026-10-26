import { useEffect, useRef, useState } from 'react'
import type { CertificateFormProps } from '../types'
import AutocompleteInput from './AutocompleteInput'
import Field from './Field'
import { searchCID } from '../data/cids'
import { Calendar, AlertCircle, Clock, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../utils/i18n'
import { requiresLateAuthorization } from '../utils/homologationDeadline'

interface CidOption {
  label: string
  value: string
  codigo: string
  descricao: string
}

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  const { t, lang } = useTranslation()
  const [cidOptions, setCidOptions] = useState<CidOption[]>([])
  const [cidSearching, setCidSearching] = useState(false)
  const [cidSearchError, setCidSearchError] = useState(false)
  const cidSearchSequence = useRef(0)
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 10000)
    return () => window.clearInterval(timer)
  }, [])
  const overdue = requiresLateAuthorization(formData.dataAtestado, clock)

  // Pesquisa assíncrona, protegida contra resultados de buscas antigas.
  const handleCidSearch = async (value: string) => {
    const request = ++cidSearchSequence.current
    setCidOptions([])
    setCidSearchError(false)
    if (!value.trim()) {
      setCidSearching(false)
      return
    }
    setCidSearching(true)
    try {
      const results = await searchCID(value)
      if (request !== cidSearchSequence.current) return
      setCidOptions(results.map(cid => ({
        label: `${cid.codigo} - ${cid.descricao}`,
        value: cid.codigo,
        codigo: cid.codigo,
        descricao: cid.descricao,
      })))
    } catch {
      if (request === cidSearchSequence.current) setCidSearchError(true)
    } finally {
      if (request === cidSearchSequence.current) setCidSearching(false)
    }
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
          <Field id="certificate-date" label={t.certificateDateLabel}>
            <input
              id="certificate-date"
              type="date"
              className="input-field"
              value={formData.dataAtestado}
              onChange={(e) => updateFormData('dataAtestado', e.target.value)}
            />
          </Field>

          <Field id="certificate-days" label={t.leaveDaysLabel}>
            <input
              id="certificate-days"
              type="number"
              className="input-field"
              placeholder={t.leaveDaysPlaceholder}
              min="1"
              value={formData.diasAfastamento}
              onChange={(e) => updateFormData('diasAfastamento', e.target.value)}
            />
          </Field>
        </div>

        {overdue && (
          <div role="group" aria-label={t.lateAuthorizationDescription} className="rounded-xl border border-amber-400/60 bg-amber-500/10 p-3.5 text-amber-950 dark:text-amber-100">
            <p className="mb-2 flex items-start gap-2 text-sm font-semibold">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t.lateAuthorizationDescription}
            </p>
            <label className="flex cursor-pointer items-start gap-2 text-sm font-medium">
              <input
                id="late-authorization-checkbox"
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-amber-700"
                checked={formData.autorizacaoForaPrazo}
                onChange={(event) => updateFormData('autorizacaoForaPrazo', event.target.checked)}
              />
              <span>{t.lateAuthorizationLabel}</span>
            </label>
            {!formData.autorizacaoForaPrazo && <p className="mt-2 text-xs">{t.lateAuthorizationHint}</p>}
          </div>
        )}

        {/* Código CID */}
        <Field id="certificate-cid" label={t.cidLabel}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="w-full flex-1">
              <AutocompleteInput
                id="certificate-cid"
                value={formData.cidNaoInformado ? '' : formData.cid}
                onChange={(value) => updateFormData('cid', value)}
                onSearch={handleCidSearch}
                onSelect={(option) => {
                  cidSearchSequence.current += 1
                  setCidOptions([])
                  setCidSearching(false)
                  setCidSearchError(false)
                  updateFormData('cid', String(option.value))
                }}
                options={cidOptions}
                placeholder={t.cidPlaceholder}
                minChars={1}
                isLoading={cidSearching}
                disabled={formData.cidNaoInformado}
              />
              {cidSearchError && (
                <p role="alert" className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {lang === 'en' ? 'ICD-10 catalog unavailable; manual entry remains possible.'
                    : lang === 'es' ? 'Catálogo CIE-10 no disponible; puede ingresar el código manualmente.'
                    : 'Catálogo CID-10 indisponível. Você ainda pode digitar o código manualmente.'}
                </p>
              )}
            </div>

            <label className="flex min-h-11 items-center gap-2 cursor-pointer whitespace-nowrap px-1 py-1 group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-garnet-500 bg-white dark:bg-surface-input focus:ring-2 focus:ring-garnet-500/20 transition-all cursor-pointer"
                checked={formData.cidNaoInformado}
                onChange={(e) => {
                  cidSearchSequence.current += 1
                  setCidOptions([])
                  setCidSearching(false)
                  setCidSearchError(false)
                  updateFormData('cidNaoInformado', e.target.checked)
                }}
              />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                {t.cidNotProvided}
              </span>
            </label>
          </div>
        </Field>

        {/* Painel Informativo Inteligente de Retorno e Regra do INSS (CLT) */}
        {returnInfo ? (
          <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
            returnInfo.requiresINSS
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {returnInfo.requiresINSS ? (
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold tracking-tight">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
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
            <Calendar className="w-4 h-4 text-garnet-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px]">
              {t.fillDateNotice}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
