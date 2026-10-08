import { ValidationContext } from '../utils/validationContext'
import { useTranslation } from '../utils/i18n'
import { cloneElement, isValidElement, useContext, useEffect, type ReactElement, type ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  hint?: string
  children: ReactNode
}

export default function Field({ id, label, hint, children }: FieldProps) {
  const invalid = useContext(ValidationContext).has(id)
  const { lang } = useTranslation()
  const required = { pt: 'Preencha este campo.', en: 'Fill in this field.', es: 'Complete este campo.' }[lang]
  const errorId = `${id}-error`
  useEffect(() => {
    const element = document.getElementById(id)
    if (!element || !invalid) return
    const describedBy = element.getAttribute('aria-describedby')
    element.setAttribute('aria-invalid', 'true')
    element.setAttribute('aria-describedby', [describedBy, errorId].filter(Boolean).join(' '))
    return () => {
      element.removeAttribute('aria-invalid')
      if (describedBy) element.setAttribute('aria-describedby', describedBy)
      else element.removeAttribute('aria-describedby')
    }
  }, [id, invalid, errorId])
  const hintId = `${id}-hint`
  const control = hint && isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': hintId,
      })
    : children

  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      {control}
      {invalid && <p id={errorId} className="field-error">{required}</p>}
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
    </div>
  )
}
