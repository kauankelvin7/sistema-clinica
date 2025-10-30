import { FileHeart } from 'lucide-react'

export default function Header() {
  return (
    <div className="bg-gradient-to-r from-primary-500 via-violet-500 to-pink-400 rounded-3xl p-10 shadow-2xl border border-white/30">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-4 border-white/40 shadow-lg">
          <FileHeart className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <h1 className="text-white text-4xl font-black tracking-tight leading-tight">
            Sistema de Homologação
          </h1>
          <p className="text-white/95 text-lg font-semibold mt-1 tracking-wide">
            Por Kauan Kelvin
          </p>
        </div>
      </div>
    </div>
  )
}
