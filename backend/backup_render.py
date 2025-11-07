"""
Backup Automatico - Conecta no Render e extrai todos os dados
Nao precisa de interface web, so a DATABASE_URL
"""
import os
import sys
import json
from datetime import datetime

def fazer_backup_direto():
    """Conecta direto no PostgreSQL do Render e extrai dados"""
    
    print("\n" + "="*70)
    print("  BACKUP AUTOMATICO DO RENDER")
    print("="*70)
    print("\nComo pegar a DATABASE_URL do Render:")
    print("   1. Acesse: https://dashboard.render.com")
    print("   2. Clique no seu POSTGRESQL (nao o Web Service!)")
    print("   3. Procure 'Internal Database URL' ou 'External Database URL'")
    print("   4. Copie a URL completa (comeca com postgresql://)")
    print("\n" + "="*70)
    
    # Pedir DATABASE_URL
    database_url = input("\nCole a DATABASE_URL aqui: ").strip()
    
    if not database_url:
        print("\nErro: DATABASE_URL vazia!")
        return None
    
    # Criar pasta backups
    backup_dir = os.path.join(os.path.dirname(__file__), '..', 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_file = os.path.join(backup_dir, f'backup_render_{timestamp}.sql')
    json_file = os.path.join(backup_dir, f'backup_render_{timestamp}.json')
    
    print(f"\nSalvando backup em:")
    print(f"   SQL:  {os.path.basename(sql_file)}")
    print(f"   JSON: {os.path.basename(json_file)}")
    print("\nConectando ao Render PostgreSQL...")
    
    try:
        # Importar SQLAlchemy
        try:
            from sqlalchemy import create_engine, text
        except ImportError:
            print("\nInstalando SQLAlchemy...")
            os.system("pip install sqlalchemy psycopg2-binary")
            from sqlalchemy import create_engine, text
        
        # Ajustar URL
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        # Conectar
        engine = create_engine(database_url, pool_pre_ping=True)
        
        print("Conectado ao Render!\n")
        
        # Estrutura para armazenar dados
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'source': 'Render PostgreSQL',
            'pacientes': [],
            'medicos': [],
            'atestados': []
        }
        
        with engine.connect() as conn:
            # ===== EXTRAIR PACIENTES =====
            print("Extraindo PACIENTES...")
            try:
                result = conn.execute(text("SELECT * FROM pacientes ORDER BY id"))
                columns = result.keys()
                pacientes = []
                
                for row in result:
                    paciente = dict(zip(columns, row))
                    pacientes.append(paciente)
                    backup_data['pacientes'].append(paciente)
                
                print(f"   OK - {len(pacientes)} pacientes encontrados")
                
            except Exception as e:
                print(f"   Erro: {e}")
                pacientes = []
            
            # ===== EXTRAIR MEDICOS =====
            print("Extraindo MEDICOS...")
            try:
                result = conn.execute(text("SELECT * FROM medicos ORDER BY id"))
                columns = result.keys()
                medicos = []
                
                for row in result:
                    medico = dict(zip(columns, row))
                    medicos.append(medico)
                    backup_data['medicos'].append(medico)
                
                print(f"   OK - {len(medicos)} medicos encontrados")
                
            except Exception as e:
                print(f"   Erro: {e}")
                medicos = []
            
            # ===== EXTRAIR ATESTADOS =====
            print("Extraindo ATESTADOS...")
            try:
                result = conn.execute(text("SELECT * FROM atestados ORDER BY id"))
                columns = result.keys()
                atestados = []
                
                for row in result:
                    atestado = dict(zip(columns, row))
                    atestados.append(atestado)
                    backup_data['atestados'].append(atestado)
                
                print(f"   OK - {len(atestados)} atestados encontrados")
                
            except:
                print(f"   Tabela atestados nao existe (ok)")
                atestados = []
        
        # ===== SALVAR JSON =====
        print(f"\nSalvando JSON...")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)
        print(f"   OK - {os.path.basename(json_file)}")
        
        # ===== GERAR SQL =====
        print(f"\nGerando SQL...")
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- Backup Sistema Clinica\n")
            f.write(f"-- Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- Pacientes: {len(pacientes)} | Medicos: {len(medicos)}\n\n")
            
            f.write("""CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    tipo_doc TEXT NOT NULL DEFAULT 'CPF',
    numero_doc TEXT NOT NULL,
    cargo TEXT,
    empresa TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tipo_doc, numero_doc)
);

CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    tipo_crm TEXT NOT NULL DEFAULT 'CRM',
    crm TEXT NOT NULL,
    uf_crm TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tipo_crm, crm)
);

""")
            
            # Inserir Pacientes
            if pacientes:
                f.write(f"\n-- PACIENTES ({len(pacientes)} registros)\n\n")
                for p in pacientes:
                    nome = p.get('nome_completo', '').replace("'", "''")
                    tipo = p.get('tipo_doc', 'CPF')
                    numero = p.get('numero_doc', '')
                    cargo = (p.get('cargo') or '').replace("'", "''")
                    empresa = (p.get('empresa') or '').replace("'", "''")
                    
                    f.write(f"INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES ({p['id']}, '{nome}', '{tipo}', '{numero}', '{cargo}', '{empresa}');\n")
            
            # Inserir Medicos
            if medicos:
                f.write(f"\n-- MEDICOS ({len(medicos)} registros)\n\n")
                for m in medicos:
                    nome = m.get('nome_completo', '').replace("'", "''")
                    tipo = m.get('tipo_crm', 'CRM')
                    crm = m.get('crm', '')
                    uf = m.get('uf_crm', 'DF')
                    
                    f.write(f"INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES ({m['id']}, '{nome}', '{tipo}', '{crm}', '{uf}');\n")
            
            # Reset sequences
            f.write("\n-- RESET SEQUENCES\n\n")
            if pacientes:
                f.write(f"SELECT setval('pacientes_id_seq', {max(p['id'] for p in pacientes)});\n")
            if medicos:
                f.write(f"SELECT setval('medicos_id_seq', {max(m['id'] for m in medicos)});\n")
        
        print(f"   OK - {os.path.basename(sql_file)}")
        
        # ===== RESUMO =====
        print("\n" + "="*70)
        print("BACKUP CONCLUIDO COM SUCESSO!")
        print("="*70)
        print(f"\nResumo:")
        print(f"   Pacientes: {len(pacientes)}")
        print(f"   Medicos: {len(medicos)}")
        print(f"   Atestados: {len(atestados)}")
        print(f"\nArquivos em: backups/")
        print(f"   {os.path.basename(sql_file)}")
        print(f"   {os.path.basename(json_file)}")
        print("\nProximo passo: Migrar para Fly.io")
        
        return sql_file
        
    except Exception as e:
        print(f"\nERRO: {str(e)}\n")
        print("Verifique:")
        print("   - DATABASE_URL esta correta?")
        print("   - Banco esta ativo no Render?")
        return None

if __name__ == '__main__':
    fazer_backup_direto()
    input("\nPressione ENTER para fechar...")
