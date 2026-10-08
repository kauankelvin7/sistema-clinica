import { useUiCopy } from '../utils/uiCopy'
import { Briefcase, Building2, ChevronLeft, ChevronRight, Hash, Search, User, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Paciente } from '../types'
import { useTranslation } from '../utils/i18n'
import { normalizeText } from '../utils/normalize'
import Dialog from './Dialog'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect?: (patient: Paciente) => void
  patients: Paciente[]
}

const PAGE_SIZE = 30

export default function PatientsListModal({ isOpen, onClose, onSelect, patients }: Props) {
  const c = useUiCopy()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [documentType, setDocumentType] = useState<'TODOS' | 'CPF' | 'RG'>('TODOS')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isOpen) return
    setSearchTerm('')
    setDocumentType('TODOS')
    setPage(1)
  }, [isOpen])

  const filtered = useMemo(() => {
    const query = normalizeText(searchTerm.trim())
    return patients.filter((patient) => {
      if (documentType !== 'TODOS' && patient.tipo_doc !== documentType) return false
      if (!query) return true
      const searchable = normalizeText([
        patient.nome_completo,
        patient.numero_doc,
        patient.cargo,
        patient.empresa,
      ].join(' '))
      return searchable.includes(query)
    })
  }, [documentType, patients, searchTerm])

  useEffect(() => setPage(1), [searchTerm, documentType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label={t.modalPatientsTitle}>
      <section className="directory-modal">
        <header className="directory-modal__header">
          <div className="flex min-w-0 items-center gap-3">
            <div className="directory-modal__hero-icon"><User className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 className="directory-modal__title">{t.modalPatientsTitle}</h2>
              <p className="directory-modal__subtitle">
                {filtered.length} {c.found} · {patients.length} {c.available}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label={c.close}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="directory-modal__toolbar">
          <label className="search-field">
            <Search className="search-field__icon" aria-hidden="true" />
            <input
              data-dialog-focus
              className="input-field pl-10"
              aria-label={t.searchPatientsPlaceholder}
              placeholder={t.searchPatientsPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
            aria-label={c.filterDoc}
            className="input-field max-w-48"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as typeof documentType)}
          >
            <option value="TODOS">CPF e RG</option>
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
        </div>

        <div className="directory-modal__content">
          {visible.length === 0 ? (
            <div className="empty-state">
              <User className="h-7 w-7" aria-hidden="true" />
              <h3>{t.noPatientsFound}</h3>
              <p>{c.emptyHelp}</p>
            </div>
          ) : (
            <div className="directory-grid">
              {visible.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    onSelect?.(patient)
                    onClose()
                  }}
                  className="directory-card"
                >
                  <div className="directory-card__avatar"><User className="h-4 w-4" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="directory-card__title" title={patient.nome_completo}>
                      {patient.nome_completo}
                    </h3>
                    <div className="directory-card__meta">
                      <span><Hash className="h-3 w-3" aria-hidden="true" /> {patient.tipo_doc} {patient.numero_doc}</span>
                      {patient.cargo && <span><Briefcase className="h-3 w-3" aria-hidden="true" /> {patient.cargo}</span>}
                      {patient.empresa && <span><Building2 className="h-3 w-3" aria-hidden="true" /> {patient.empresa}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <footer className="directory-modal__footer">
            <span>{c.page} {safePage} {c.of} {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary px-3 py-1.5"
                disabled={safePage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {c.previous}
              </button>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5"
                disabled={safePage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                {c.next} <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </footer>
        )}
      </section>
    </Dialog>
  )
}
