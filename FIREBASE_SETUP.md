# 🔥 Firebase Setup - Sistema de Homologação

## 📋 Visão Geral

O sistema foi completamente migrado do Render (PostgreSQL) para **Firebase Firestore**, garantindo:
- ✅ Banco de dados permanente e escalável
- ✅ Sem custo de expiração (free tier generoso)
- ✅ Melhor performance global
- ✅ Backups automáticos

## 🚀 Configuração do Firebase

### 1️⃣ Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: `sistema-homologacao` (ou outro nome)
4. Desabilite Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### 2️⃣ Ativar Firestore Database

1. No menu lateral, vá em **"Build" → "Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Selecione o modo:
   - **Produção**: Regras seguras (recomendado)
   - **Teste**: Regras permissivas (temporário)
4. Escolha a localização:
   - `southamerica-east1` (São Paulo) - melhor para Brasil
   - `us-central1` - alternativa
5. Clique em **"Ativar"**

### 3️⃣ Gerar Credenciais (Service Account)

1. No Firebase Console, vá em **⚙️ Configurações do Projeto**
2. Clique na aba **"Contas de serviço"**
3. Selecione **"SDK Admin do Firebase"**
4. Clique em **"Gerar nova chave privada"**
5. Um arquivo JSON será baixado (guarde com segurança!)
6. Renomeie o arquivo para: `firebase-credentials.json`

### 4️⃣ Configurar Credenciais no Backend

**Opção A - Desenvolvimento Local:**

1. Copie `firebase-credentials.json` para a raiz do projeto:
   ```
   sistema_clinica_homologacao/
   ├── firebase-credentials.json  ← AQUI
   ├── backend/
   ├── frontend/
   └── ...
   ```

2. Crie arquivo `.env` na raiz:
   ```env
   FIREBASE_CRED_PATH=./firebase-credentials.json
   ```

**Opção B - Produção (Render/Railway/Outro):**

1. No painel de deploy, adicione variável de ambiente:
   ```
   FIREBASE_CRED_PATH=/etc/secrets/firebase-credentials.json
   ```

2. Faça upload do arquivo JSON como "secret file" ou codifique em Base64:
   ```bash
   # Codificar em Base64 (para variável de ambiente)
   cat firebase-credentials.json | base64
   ```

3. Se usar Base64, adicione ao `.env`:
   ```env
   FIREBASE_CREDENTIALS_BASE64=<conteúdo-base64-aqui>
   ```

### 5️⃣ Estrutura do Firestore

O sistema cria automaticamente as seguintes coleções:

```
📂 pacientes
  └── documento_paciente_001
      ├── nome_completo: "João Silva"
      ├── tipo_doc: "CPF"
      ├── numero_doc: "12345678900"
      ├── cargo: "Desenvolvedor"
      ├── empresa: "Tech Corp"
      └── updated_at: "2025-01-15T10:30:00"

📂 medicos
  └── medico_CRM_12345
      ├── nome_completo: "Dra. Maria Santos"
      ├── tipo_crm: "CRM"
      ├── crm: "12345"
      ├── uf_crm: "SP"
      └── updated_at: "2025-01-15T10:30:00"
```

### 6️⃣ Regras de Segurança (Produção)

No Firestore Console, vá em **"Regras"** e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir apenas servidor backend autenticado
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7️⃣ Testar Conexão

Execute o backend:

```bash
cd backend
python main.py
```

Acesse: http://localhost:8000/api/health

Resposta esperada:
```json
{
  "status": "ok",
  "database": "Firebase Firestore",
  "patients_count": 0,
  "doctors_count": 0,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 🔒 Segurança

### Proteger Credenciais

**NUNCA** faça commit do arquivo `firebase-credentials.json`!

Adicione ao `.gitignore`:
```gitignore
# Firebase
firebase-credentials.json
.env
```

### Variáveis de Ambiente Recomendadas

```env
# Firebase
FIREBASE_CRED_PATH=./firebase-credentials.json

# Backend
FRONTEND_URL=https://seu-frontend.vercel.app

# Produção
NODE_ENV=production
```

## 📊 Monitoramento

### Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **"Firestore Database"**
3. Monitore:
   - Uso de leitura/escrita
   - Tamanho do banco
   - Índices criados

### Limites do Free Tier

- **Armazenamento**: 1 GB
- **Leituras**: 50.000/dia
- **Escritas**: 20.000/dia
- **Exclusões**: 20.000/dia

Para este sistema de atestados médicos, isso é mais que suficiente!

## 🎨 Novas Features

### Purple Neon Theme 💜

- Gradientes roxo neon (#8b00ff, #bf40bf, #ff00ff)
- Efeitos de glow e animações suaves
- Dark mode otimizado com cores vibrantes

### Performance Optimization ⚡

- **Lazy Loading**: Componentes carregados sob demanda
- **Code Splitting**: Bundles menores e mais rápidos
- **GZip Compression**: Backend comprime respostas automaticamente
- **useCallback**: Funções memoizadas evitam re-renders desnecessários
- **Suspense**: Loading states elegantes durante carregamento

### Nova Logo 🎨

- SVG vetorial com gradiente roxo neon
- Cruz médica + estetoscópio + linhas de certificado
- Efeitos de glow para visual moderno
- Favicon atualizado no navegador

## 🐛 Troubleshooting

### Erro: "Could not initialize Firebase"

**Solução:**
1. Verifique se `firebase-credentials.json` existe
2. Confirme que `FIREBASE_CRED_PATH` está correta no `.env`
3. Valide o JSON (não pode ter erros de sintaxe)

### Erro: "Permission Denied"

**Solução:**
1. Vá em Firestore → Regras
2. Temporariamente use regras abertas para testes:
   ```javascript
   allow read, write: if true;
   ```
3. Depois configure autenticação adequada

### Banco vazio após migração

**Solução:**
- Os dados antigos do Render não foram migrados automaticamente
- Gere novos atestados para popular o Firebase
- Ou importe dados manualmente via Firebase Console

## 📞 Suporte

Desenvolvido por **Kauan Kelvin**

- Sistema: v2.0.0
- Database: Firebase Firestore
- Theme: Purple Neon
- Performance: Otimizado

---

✅ **Migration Complete**: Render → Firebase  
⚡ **Performance**: Lazy Loading + Code Splitting  
💜 **Theme**: Purple Neon Activated  
🚀 **Ready for Production!**
