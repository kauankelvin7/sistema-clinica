import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface SectionCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}

export default function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: SectionCardProps) {
  return (
    <article className="section-shell">
      <header className="section-shell__header">
        <div className="section-shell__icon" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="section-shell__title">{title}</h2>
          </div>
          <p className="section-shell__description">{description}</p>
        </div>
      </header>
      <div className="section-shell__body">{children}</div>
    </article>
  )
}
