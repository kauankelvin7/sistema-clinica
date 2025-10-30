import { FileHeart } from 'lucide-react'

export default function Header() {
  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <FileHeart className="w-6 h-6 text-white" />
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <h1 className="text-white text-xl font-bold">
            Sistema de Homologação
          </h1>
          <p className="text-white/90 text-xs font-medium">
            Por Kauan Kelvin
          </p>
        </div>
      </div>
    </div>
  )
}
