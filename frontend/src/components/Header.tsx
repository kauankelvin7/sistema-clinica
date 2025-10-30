import { FileHeart, Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="relative flex items-center gap-4 md:gap-6">
        {/* Logo */}
        <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
          <FileHeart className="w-8 h-8 md:w-9 md:h-9 text-blue-600" />
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-white text-xl md:text-3xl font-bold">
              Sistema de Homologação
            </h1>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-200 hidden sm:block" />
          </div>
          <p className="text-blue-100 text-xs md:text-sm font-medium mt-1">
            Geração de Declarações Médicas - Por Kauan Kelvin
          </p>
        </div>
      </div>
    </div>
  )
}
