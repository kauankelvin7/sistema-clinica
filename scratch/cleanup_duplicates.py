import os
import sys
from pathlib import Path

# Adiciona a raiz do projeto ao sys.path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from core.db_manager import get_db_connection
from core.crypto import decrypt, generate_hash

def cleanup_duplicates():
    print("Iniciando limpeza de duplicatas e geracao de hashes...")
    
    with get_db_connection() as conn:
        # 1. Processar Pacientes
        print("Processando pacientes...")
        cursor = conn.cursor()
        cursor.execute("SELECT id, numero_doc FROM pacientes")
        pacientes = cursor.fetchall()
        
        seen_hashes = {} # hash -> id_original
        to_delete = []
        
        for p_id, enc_doc in pacientes:
            raw_doc = decrypt(enc_doc)
            p_hash = generate_hash(raw_doc)
            
            if p_hash in seen_hashes:
                print(f"  [!] Duplicata encontrada: ID {p_id} (mantendo {seen_hashes[p_hash]})")
                to_delete.append(p_id)
            else:
                seen_hashes[p_hash] = p_id
                # Atualiza o registro com o hash
                cursor.execute("UPDATE pacientes SET numero_doc_hash = ? WHERE id = ?", (p_hash, p_id))
        
        # Deletar duplicatas
        for p_id in to_delete:
            cursor.execute("DELETE FROM pacientes WHERE id = ?", (p_id,))
            
        # 2. Processar Médicos
        print("Processando medicos...")
        cursor.execute("SELECT id, crm FROM medicos")
        medicos = cursor.fetchall()
        
        seen_crm_hashes = {}
        to_delete_medicos = []
        
        for m_id, enc_crm in medicos:
            raw_crm = decrypt(enc_crm)
            m_hash = generate_hash(raw_crm)
            
            if m_hash in seen_crm_hashes:
                print(f"  [!] Duplicata encontrada: ID {m_id} (mantendo {seen_crm_hashes[m_hash]})")
                to_delete_medicos.append(m_id)
            else:
                seen_crm_hashes[m_hash] = m_id
                cursor.execute("UPDATE medicos SET crm_hash = ? WHERE id = ?", (m_hash, m_id))
                
        for m_id in to_delete_medicos:
            cursor.execute("DELETE FROM medicos WHERE id = ?", (m_id,))
            
        conn.commit()
        print(f"Concluido! {len(to_delete)} pacientes e {len(to_delete_medicos)} medicos removidos.")

if __name__ == "__main__":
    cleanup_duplicates()
