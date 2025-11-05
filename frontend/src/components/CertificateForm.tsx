import type { CertificateFormProps } from '../types'

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
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
          <input
            type="text"
            className="input-field flex-1 w-full"
            placeholder="Ex: A00, F32.9, J06.9"
            disabled={formData.cidNaoInformado}
            value={formData.cidNaoInformado ? '' : formData.cid}
            onChange={(e) => updateFormData('cid', e.target.value)}
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
