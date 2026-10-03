import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  hint?: string
  children: ReactNode
}

export default function Field({ id, label, hint, children }: FieldProps) {
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
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
    </div>
  )
}
