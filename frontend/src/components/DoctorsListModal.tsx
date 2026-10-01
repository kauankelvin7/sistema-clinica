import { Award, ChevronLeft, ChevronRight, MapPin, Search, Stethoscope, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Medico } from '../types'
import { useTranslation } from '../utils/i18n'
import { normalizeText } from '../utils/normalize'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect?: (doctor: Medico) => void
  doctors: Medico[]
}

const PAGE_SIZE = 30

export default function DoctorsListModal({ isOpen, onClose, onSelect, doctors }: Props) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [registerType, setRegisterType] = useState<'TODOS' | 'CRM' | 'CRO' | 'RMS'>('TODOS')
  const [uf, setUf] = useState('TODAS')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isOpen) return
    setSearchTerm('')
    setRegisterType('TODOS')
    setUf('TODAS')
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

  const ufs = useMemo(
    () => Array.from(new Set(doctors.map((doctor) => doctor.uf_crm))).filter(Boolean).sort(),
    [doctors]
  )

  const filtered = useMemo(() => {
    const query = normalizeText(searchTerm.trim())
    return doctors.filter((doctor) => {
      if (registerType !== 'TODOS' && doctor.tipo_crm !== registerType) return false
      if (uf !== 'TODAS' && doctor.uf_crm !== uf) return false
      if (!query) return true
      return normalizeText(
        `${doctor.nome_completo} ${doctor.tipo_crm} ${doctor.crm} ${doctor.uf_crm}`
      ).includes(query)
    })
  }, [doctors, registerType, searchTerm, uf])

  useEffect(() => setPage(1), [searchTerm, registerType, uf])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="directory-modal" role="dialog" aria-modal="true" aria-label={t.modalDoctorsTitle}>
        <header className="directory-modal__header">
          <div className="flex min-w-0 items-center gap-3">
            <div className="directory-modal__hero-icon"><Stethoscope className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 className="directory-modal__title">{t.modalDoctorsTitle}</h2>
              <p className="directory-modal__subtitle">
                {filtered.length} encontrados · {doctors.length} disponíveis no cache local
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="directory-modal__toolbar">
          <label className="search-field sm:col-span-2">
            <Search className="search-field__icon" />
            <input
              autoFocus
              className="input-field pl-10"
              placeholder={t.searchDoctorsPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select
            className="input-field"
            value={registerType}
            onChange={(event) => setRegisterType(event.target.value as typeof registerType)}
          >
            <option value="TODOS">CRM / CRO / RMS</option>
            <option value="CRM">CRM</option>
            <option value="CRO">CRO</option>
            <option value="RMS">RMS</option>
          </select>

          <select className="input-field" value={uf} onChange={(event) => setUf(event.target.value)}>
            <option value="TODAS">Todas as UFs</option>
            {ufs.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>

        <div className="directory-modal__content">
          {visible.length === 0 ? (
            <div className="empty-state">
              <Stethoscope className="h-7 w-7" />
              <h3>Nenhum médico encontrado</h3>
              <p>Altere a busca ou atualize a base local.</p>
            </div>
          ) : (
            <div className="directory-grid">
              {visible.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => {
                    onSelect?.(doctor)
                    onClose()
                  }}
                  className="directory-card"
                >
                  <div className="directory-card__avatar"><Stethoscope className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="directory-card__title" title={doctor.nome_completo}>
                      {doctor.nome_completo}
                    </h3>
                    <div className="directory-card__meta">
                      <span><Award className="h-3 w-3" /> {doctor.tipo_crm} {doctor.crm}</span>
                      <span><MapPin className="h-3 w-3" /> {doctor.uf_crm}</span>
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
