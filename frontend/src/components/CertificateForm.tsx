import type { CertificateFormProps } from '../types'

export default function CertificateForm({ formData, updateFormData }: CertificateFormProps) {
  return (
    <div className="space-y-3.5">
      {/* Data e Dias de Afastamento em linha */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
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
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
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
        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          CID
        </label>
        <div className="flex gap-3 items-center">
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
              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 
                       focus:ring-2 focus:ring-primary-300"
              checked={formData.cidNaoInformado}
              onChange={(e) => updateFormData('cidNaoInformado', e.target.checked)}
            />
            <span className="text-xs font-semibold text-gray-700">Não Informado</span>
          </label>
        </div>
      </div>
    </div>
  )
}
