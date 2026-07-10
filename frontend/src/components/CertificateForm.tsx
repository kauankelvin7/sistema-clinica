import { useState } from 'react'
import type { CertificateFormProps } from '../types'
import AutocompleteInput from './AutocompleteInput'
import { searchCID } from '../data/cids'

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
  
  return (
    <div className="space-y-6">
      {/* Seleção do Tipo de Atestado */}
      <div>
        <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
          Tipo de Atestado
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="tipoAtestado"
              value="saude"
              checked={formData.tipoAtestado === 'saude'}
              onChange={() => updateFormData('tipoAtestado', 'saude')}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-200 transition-colors">
              Homologação (Atestado Médico)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="tipoAtestado"
              value="fisico"
              checked={formData.tipoAtestado === 'fisico'}
              onChange={() => updateFormData('tipoAtestado', 'fisico')}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-200 transition-colors">
              Atestado Físico
            </span>
          </label>
        </div>
      </div>

      {formData.tipoAtestado === 'fisico' ? (
        /* Apenas Data para Atestado Físico */
        <div>
          <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
            Data do Atestado
          </label>
          <input
            type="date"
            className="input-field"
            value={formData.dataAtestado}
            onChange={(e) => updateFormData('dataAtestado', e.target.value)}
          />
        </div>
      ) : (
        /* Estrutura completa de Homologação */
        <>
          {/* Data e Dias de Afastamento em linha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
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
              <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
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
            <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
              Código CID
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              
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
                  placeholder="Digite o código ou descrição (Ex: J00, gripe, dor)"
                  minChars={1}
                  disabled={formData.cidNaoInformado}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer whitespace-nowrap px-2 py-2 group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-600 text-orange-500 bg-white/50 dark:bg-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  checked={formData.cidNaoInformado}
                  onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
                />
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                  Não Informado
                </span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
