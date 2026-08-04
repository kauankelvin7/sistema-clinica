import sqlite3
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from core.crypto import decrypt

def verify_sqlite(db_file):
    print(f"=== Verificando {db_file.name} ===")
    conn = sqlite3.connect(str(db_file))
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM medicos")
    count = cursor.fetchone()[0]
    print(f"Total de médicos na tabela 'medicos': {count}")
    
    cursor.execute("SELECT id, nome_completo, tipo_crm, crm, uf_crm FROM medicos ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Últimos 5 médicos cadastrados:")
    for r in rows:
        nome_dec = decrypt(r[1])
        print(f"  ID {r[0]}: {nome_dec} | {r[2]} {r[3]}-{r[4]}")
    conn.close()

if __name__ == '__main__':
    verify_sqlite(ROOT_DIR / 'data' / 'clinica.db')
    print()
    verify_sqlite(ROOT_DIR / 'data' / 'homologacao.db')
