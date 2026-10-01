import { Briefcase, Building2, ChevronLeft, ChevronRight, Hash, Search, User, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Paciente } from '../types'
import { useTranslation } from '../utils/i18n'
import { normalizeText } from '../utils/normalize'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect?: (patient: Paciente) => void
  patients: Paciente[]
}

const PAGE_SIZE = 30

export default function PatientsListModal({ isOpen, onClose, onSelect, patients }: Props) {
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

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

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

  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="directory-modal" role="dialog" aria-modal="true" aria-label={t.modalPatientsTitle}>
        <header className="directory-modal__header">
          <div className="flex min-w-0 items-center gap-3">
            <div className="directory-modal__hero-icon"><User className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 className="directory-modal__title">{t.modalPatientsTitle}</h2>
              <p className="directory-modal__subtitle">
                {filtered.length} encontrados · {patients.length} disponíveis no cache local
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="directory-modal__toolbar">
          <label className="search-field">
            <Search className="search-field__icon" />
            <input
              autoFocus
              className="input-field pl-10"
              placeholder={t.searchPatientsPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
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
              <User className="h-7 w-7" />
              <h3>Nenhum paciente encontrado</h3>
              <p>Altere a busca ou atualize a base local.</p>
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
                  <div className="directory-card__avatar"><User className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="directory-card__title" title={patient.nome_completo}>
                      {patient.nome_completo}
                    </h3>
                    <div className="directory-card__meta">
                      <span><Hash className="h-3 w-3" /> {patient.tipo_doc} {patient.numero_doc}</span>
                      {patient.cargo && <span><Briefcase className="h-3 w-3" /> {patient.cargo}</span>}
                      {patient.empresa && <span><Building2 className="h-3 w-3" /> {patient.empresa}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <footer className="directory-modal__footer">
            <span>Página {safePage} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary min-h-9 px-3 py-1.5"
                disabled={safePage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                type="button"
                className="btn-secondary min-h-9 px-3 py-1.5"
                disabled={safePage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>,
    document.body
  )
}
