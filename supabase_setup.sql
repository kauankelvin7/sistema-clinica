-- 1. CRIAÇÃO DAS TABELAS
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    tipo_doc VARCHAR(50),
    numero_doc VARCHAR(50) UNIQUE,
    cargo VARCHAR(100),
    empresa VARCHAR(150),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    tipo_crm VARCHAR(50),
    crm VARCHAR(50),
    uf_crm VARCHAR(2),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_crm UNIQUE (crm, tipo_crm)
);

-- 2. CAMADA DE SEGURANÇA 1: ROW LEVEL SECURITY (RLS)
-- Isso impede que qualquer pessoa consiga ler o banco, mesmo com a chave anônima (anon key).
-- Apenas o backend (que usa o DATABASE_URL com privilégios master) vai conseguir ler e escrever.
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backend_only_pacientes" ON pacientes
  USING (auth.role() = 'service_role');

CREATE POLICY "backend_only_medicos" ON medicos
  USING (auth.role() = 'service_role');
