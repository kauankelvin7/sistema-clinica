import { FileHeart, Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-2xl p-6 md:p-8 border border-blue-400/20 shadow-2xl shadow-blue-500/20">
      {/* Efeito de brilho de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      
      {/* Padrão decorativo de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative flex items-center gap-4 md:gap-6">
        {/* Logo com animação */}
        <div className="relative group animate-float">
          <div className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
            <FileHeart className="w-8 h-8 md:w-9 md:h-9 text-blue-600" />
          </div>
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-white text-xl md:text-3xl font-bold tracking-tight drop-shadow-md">
              Sistema de Homologação
            </h1>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-200 animate-pulse hidden sm:block" />
          </div>
          <p className="text-blue-100 text-xs md:text-sm font-medium mt-1 drop-shadow">
            Geração de Declarações Médicas - Por Kauan Kelvin
          </p>
        </div>
      </div>
    </div>
  )
}
