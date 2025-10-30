# 🚀 Sistema de Homologação - Frontend Moderno

Interface web moderna desenvolvida com **React + TypeScript + Tailwind CSS** para o Sistema de Homologação de Atestados Médicos.

## 🎨 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização moderna e responsiva
- **Vite** - Build tool ultra-rápida
- **Lucide React** - Ícones modernos
- **React Hook Form** - Gerenciamento de formulários

## 🎯 Features

✨ **Design Moderno**
- Gradientes vibrantes (roxo, violeta, rosa)
- Glassmorphism effects
- Animações suaves
- Responsivo (mobile-first)

🎨 **UI/UX**
- Cards com hover effects
- Inputs com gradientes sutis
- Botões com animações
- Feedback visual interativo

📱 **Responsividade**
- Layout adaptativo
- Mobile, tablet e desktop
- Touch-friendly

## 📦 Instalação

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🛠️ Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build de produção
npm run lint     # Executar linter
```

## 🏗️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Header.tsx       # Cabeçalho
│   │   ├── PatientForm.tsx  # Formulário do paciente
│   │   ├── CertificateForm.tsx # Formulário do atestado
│   │   ├── DoctorForm.tsx   # Formulário do médico
│   │   └── ActionButtons.tsx # Botões de ação
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
├── public/                  # Assets estáticos
├── index.html               # HTML template
├── package.json
├── tailwind.config.js       # Configuração Tailwind
├── tsconfig.json            # Configuração TypeScript
└── vite.config.ts           # Configuração Vite
```

## 🎨 Customização de Cores

As cores principais estão definidas em `tailwind.config.js`:

```javascript
colors: {
  primary: { 500: '#667eea' },  // Roxo principal
  violet: { 500: '#764ba2' },   // Violeta
  pink: { 400: '#f093fb' },     // Rosa
}
```

## 🔗 Próximos Passos

1. **Integração com Backend FastAPI**
   - Criar endpoints REST
   - Conectar formulários com API
   - Implementar autenticação

2. **Features Adicionais**
   - Histórico de documentos
   - Download de PDFs
   - Busca e filtros
   - Dashboards

3. **Deploy**
   - Vercel/Netlify (frontend)
   - Railway/Render (backend)

## 👨‍💻 Desenvolvedor

**Kauan Kelvin**

---

**Sistema de Homologação v2.0** - Interface Moderna
