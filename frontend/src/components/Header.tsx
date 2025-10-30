import { FileHeart } from 'lucide-react'

export default function Header() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/20">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border-2 border-white/30 shadow-md">
          <FileHeart className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <h1 className="text-white text-2xl font-bold tracking-tight">
            Sistema de Homologação
          </h1>
          <p className="text-white/90 text-sm font-medium mt-0.5">
            Por Kauan Kelvin
          </p>
        </div>
      </div>
    </div>
  )
}
