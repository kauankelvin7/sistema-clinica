import { FileHeart } from 'lucide-react'

export default function Header() {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-purple-900 rounded-xl p-4 border-2 border-purple-500/30 shadow-purple-lg">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
          <FileHeart className="w-6 h-6 text-white" />
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <h1 className="text-white text-xl font-bold">
            Sistema de Homologação
          </h1>
          <p className="text-purple-200 text-xs font-medium">
            Por Kauan Kelvin
          </p>
        </div>
      </div>
    </div>
  )
}
