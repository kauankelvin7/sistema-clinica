import type { CertificateFormProps } from '../types'

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  return (
    <div className="space-y-2.5">
      {/* Data e Dias de Afastamento em linha */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            className="input-field"
            value={formData.dataAtestado}
            onChange={(e) => updateFormData('dataAtestado', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Dias de Afastamento
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Ex: 3"
            min="1"
            value={formData.diasAfastamento}
            onChange={(e) => updateFormData('diasAfastamento', e.target.value)}
          />
        </div>
      </div>

      {/* CID */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          CID
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Ex: A00, F32.9, J06.9"
            disabled={formData.cidNaoInformado}
            value={formData.cidNaoInformado ? '' : formData.cid}
            onChange={(e) => updateFormData('cid', e.target.value)}
          />
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border border-gray-300 text-primary-500"
              checked={formData.cidNaoInformado}
              onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
            />
            <span className="text-xs font-medium text-gray-700">Não Informado</span>
          </label>
        </div>
      </div>
    </div>
  )
}
