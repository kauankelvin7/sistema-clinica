import type { CertificateFormProps } from '../types'

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  return (
    <div className="space-y-5">
      {/* Data */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Data
        </label>
        <input
          type="date"
          className="input-field"
          value={formData.dataAtestado}
          onChange={(e) => updateFormData('dataAtestado', e.target.value)}
        />
      </div>

      {/* Dias de Afastamento */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
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

      {/* CID */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          CID
        </label>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Ex: A00, F32.9, J06.9"
            disabled={formData.cidNaoInformado}
            value={formData.cidNaoInformado ? '' : formData.cid}
            onChange={(e) => updateFormData('cid', e.target.value)}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded-md border-2 border-primary-200 text-primary-500 
                       focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
              checked={formData.cidNaoInformado}
              onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
            />
            <span className="text-sm font-semibold text-gray-700">Não Informado</span>
          </label>
        </div>
      </div>
    </div>
  )
}
