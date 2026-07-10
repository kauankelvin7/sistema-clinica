-- ============================================================
-- SCRIPT DE SANEAMENTO DO BANCO DE DADOS
-- Sistema de Homologação de Atestados Médicos
--
-- Execute APENAS UMA VEZ no banco de produção/desenvolvimento.
-- Mantém o registro com data_atualizacao mais recente.
--
-- Compatível com: PostgreSQL e SQLite
-- ============================================================

-- ============================================================
-- ETAPA 1: DIAGNÓSTICO (LEIA ANTES DE EXECUTAR A LIMPEZA)
-- Mostra todos os grupos de duplicados encontrados.
-- ============================================================
SELECT
    numero_doc_hash,
    tipo_doc,
    COUNT(*) AS total_duplicados,
    MIN(id)  AS id_mais_antigo,
    MAX(id)  AS id_mais_recente
FROM pacientes
GROUP BY numero_doc_hash, tipo_doc
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC;


-- ============================================================
-- ETAPA 2: REMOÇÃO DOS DUPLICADOS
--
-- Regra: mantém o registro com data_atualizacao mais recente.
-- Em caso de empate, mantém o maior id (inserido por último).
--
-- ⚠️  Para POSTGRESQL: use o bloco abaixo.
-- ⚠️  Para SQLITE: use o bloco alternativo logo após.
-- ============================================================


-- ---- POSTGRESQL ----
/*
DELETE FROM pacientes
WHERE id NOT IN (
    SELECT DISTINCT ON (numero_doc_hash, tipo_doc) id
    FROM pacientes
    ORDER BY numero_doc_hash, tipo_doc, data_atualizacao DESC, id DESC
);
*/


-- ---- SQLITE ----
/*
DELETE FROM pacientes
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY numero_doc_hash, tipo_doc
                   ORDER BY data_atualizacao DESC, id DESC
               ) AS rn
        FROM pacientes
    ) ranked
    WHERE rn = 1
);
*/


-- ============================================================
-- ETAPA 3: CONFIRMAÇÃO (rode após a etapa 2)
-- Resultado esperado: zero linhas retornadas.
-- ============================================================
SELECT
    numero_doc_hash,
    tipo_doc,
    COUNT(*) AS total_duplicados
FROM pacientes
GROUP BY numero_doc_hash, tipo_doc
HAVING COUNT(*) > 1;


-- ============================================================
-- ETAPA 4: CONSTRAINT ÚNICA (se não existir)
--
-- O schema do db_manager.py já define UNIQUE(tipo_doc, numero_doc_hash).
-- Use os comandos abaixo caso o banco seja legado e não possua a constraint.
--
-- ⚠️  Para POSTGRESQL:
-- ============================================================
/*
ALTER TABLE pacientes
    ADD CONSTRAINT IF NOT EXISTS uq_pacientes_tipodoc_hash
    UNIQUE (tipo_doc, numero_doc_hash);
*/

-- ⚠️  Para SQLITE (não suporta ADD CONSTRAINT diretamente):
-- Recriar a tabela com a constraint. Apenas se necessário.
-- A forma mais segura é usar db_manager.py que já cria corretamente.


-- ============================================================
-- ETAPA 5: ANÁLISE DE MÉDICOS (opcional)
-- Mesma lógica para a tabela de médicos.
-- ============================================================
SELECT
    crm_hash,
    tipo_crm,
    COUNT(*) AS total_duplicados,
    MIN(id)  AS id_mais_antigo,
    MAX(id)  AS id_mais_recente
FROM medicos
GROUP BY crm_hash, tipo_crm
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC;

-- Limpeza de médicos duplicados (POSTGRESQL):
/*
DELETE FROM medicos
WHERE id NOT IN (
    SELECT DISTINCT ON (crm_hash, tipo_crm) id
    FROM medicos
    ORDER BY crm_hash, tipo_crm, data_atualizacao DESC, id DESC
);
*/

-- Limpeza de médicos duplicados (SQLITE):
/*
DELETE FROM medicos
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY crm_hash, tipo_crm
                   ORDER BY data_atualizacao DESC, id DESC
               ) AS rn
        FROM medicos
    ) ranked
    WHERE rn = 1
);
*/
