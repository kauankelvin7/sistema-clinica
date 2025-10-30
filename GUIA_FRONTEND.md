# 🚀 GUIA DE INSTALAÇÃO - Frontend React + TypeScript + Tailwind

## 📋 Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** ou **yarn**

## ⚡ Instalação Rápida

```powershell
# 1. Navegar para o diretório frontend
cd frontend

# 2. Instalar dependências (pode demorar alguns minutos)
npm install

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em: **http://localhost:3000** 🎉

## 📦 O que foi criado?

### ✅ **Estrutura Completa**
```
frontend/
├── src/
│   ├── components/           # Componentes React
│   │   ├── Header.tsx        # Cabeçalho moderno
│   │   ├── PatientForm.tsx   # Formulário do paciente
│   │   ├── CertificateForm.tsx # Formulário do atestado
│   │   ├── DoctorForm.tsx    # Formulário do médico
│   │   └── ActionButtons.tsx # Botões de ação
│   ├── types/                # TypeScript definitions
│   ├── App.tsx               # App principal
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind + estilos
├── package.json              # Dependências
├── tailwind.config.js        # Config Tailwind
├── tsconfig.json             # Config TypeScript
└── vite.config.ts            # Config Vite
```

### 🎨 **Tecnologias Incluídas**

✅ **React 18** - Framework UI moderno  
✅ **TypeScript** - Type safety completo  
✅ **Tailwind CSS** - Estilização utility-first  
✅ **Vite** - Build tool ultra-rápida  
✅ **Lucide React** - Ícones modernos SVG  
✅ **React Hook Form** - Gerenciamento de forms  

### 🌈 **Design System**

- **Cores Primárias**: Roxo (#667eea), Violeta (#764ba2), Rosa (#f093fb)
- **Gradientes**: Horizontais e diagonais vibrantes
- **Componentes**: Cards, inputs, buttons com hover effects
- **Responsivo**: Mobile, tablet e desktop
- **Animações**: Smooth transitions

## 🎯 Próximos Passos

### 1️⃣ **Testar o Frontend**
```powershell
npm run dev
```
Acesse `http://localhost:3000` e teste a interface!

### 2️⃣ **Integrar com Backend Python (Opcional)**

Crie um backend FastAPI para conectar com o Python existente:

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Permitir CORS do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AtestadoData(BaseModel):
    nomePaciente: str
    numeroDocumento: str
    # ... outros campos

@app.post("/api/generate-document")
async def generate_document(data: AtestadoData):
    # Reutilizar código existente de document_generator.py
    return {"status": "success", "path": "caminho/documento.docx"}
```

### 3️⃣ **Build para Produção**
```powershell
npm run build
```

### 4️⃣ **Deploy**

**Frontend (Vercel/Netlify)**:
```powershell
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🆚 Comparação: PyQt5 vs React

| Feature | PyQt5 (Desktop) | React (Web) |
|---------|----------------|-------------|
| **Interface** | Aplicação Windows | Web App |
| **Deployment** | .exe file | Website |
| **Atualizações** | Reinstalar | Refresh automático |
| **Acessibilidade** | Apenas PC com .exe | Qualquer dispositivo |
| **Manutenção** | Mais complexa | Mais simples |
| **Modernidade** | Limitada | Ilimitada |

## 🎨 Customização

### Alterar Cores
Edite `tailwind.config.js`:
```javascript
colors: {
  primary: { 500: '#SUA_COR_AQUI' },
}
```

### Adicionar Componentes
Crie em `src/components/SeuComponente.tsx`:
```typescript
export default function SeuComponente() {
  return <div className="card">...</div>
}
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'react'"
```powershell
npm install
```

### Erro de porta já em uso
```powershell
# Usar porta diferente
npm run dev -- --port 3001
```

### Cache issues
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

## 📚 Recursos

- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Guide](https://vitejs.dev/)

## 💡 Dicas

1. **Hot Reload**: O Vite atualiza automaticamente ao salvar
2. **TypeScript**: Use `npm run build` para verificar erros de tipo
3. **Tailwind**: Use extension VS Code "Tailwind CSS IntelliSense"
4. **Debugging**: Use React DevTools no Chrome

---

**Desenvolvido por Kauan Kelvin** 🚀
Sistema de Homologação v2.0 - Versão Web Moderna
