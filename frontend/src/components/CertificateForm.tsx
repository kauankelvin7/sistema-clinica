import { useState, useEffect } from 'react'
import type { CertificateFormProps } from '../types'
import AutocompleteInput from './AutocompleteInput'
import { CIDS_COMUNS } from '../data/cids'

interface CidOption {
  label: string
  value: string
  codigo: string
  descricao: string
}

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  const [cidOptions, setCidOptions] = useState<CidOption[]>([])

  useEffect(() => {
    const options = CIDS_COMUNS.map(cid => ({
      label: `${cid.codigo} - ${cid.descricao}`,
      value: cid.codigo,
      codigo: cid.codigo,
      descricao: cid.descricao
    }))
    setCidOptions(options)
  }, [])
  return (
    <div className="space-y-6">
      {/* Data e Dias de Afastamento em linha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Dias de Afastamento
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Ex: 3 dias"
            min="1"
            value={formData.diasAfastamento}
            onChange={(e) => updateFormData('diasAfastamento', e.target.value)}
          />
        </div>
      </div>

      {/* CID */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Código CID
        </label>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <AutocompleteInput
            value={formData.cidNaoInformado ? '' : formData.cid}
            onChange={(value) => updateFormData('cid', value)}
            onSelect={(option) => {
              const selectedCid = cidOptions.find(cid => cid.value === option.value)
              if (selectedCid) {
                updateFormData('cid', selectedCid.codigo)
              }
            }}
            options={cidOptions}
            placeholder="Digite o código ou descrição (Ex: J00, gripe, dor)"
            minChars={1}
            disabled={formData.cidNaoInformado}
          />
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap px-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-2 border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              checked={formData.cidNaoInformado}
              onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Não Informado</span>
          </label>
        </div>
      </div>
    </div>
  )
}
