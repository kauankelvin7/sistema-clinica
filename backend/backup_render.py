"""
Backup utility for the clinic database.

Exports records to JSON only. Runtime dependencies must be installed from
requirements.txt; this script never invokes a shell or writes executable SQL.
"""
import json
import os
from datetime import datetime

from sqlalchemy import create_engine, text


def fazer_backup_direto():
    """Connect to PostgreSQL and export known tables to an ignored JSON backup."""
    print("\n" + "=" * 70)
    print("  BACKUP SEGURO DO BANCO")
    print("=" * 70)

    database_url = input("\nCole a DATABASE_URL aqui: ").strip()
    if not database_url:
        print("\nErro: DATABASE_URL vazia.")
        return None

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    backup_dir = os.path.join(os.path.dirname(__file__), "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_file = os.path.join(backup_dir, f"backup_render_{timestamp}.json")

    backup_data = {
        "timestamp": datetime.now().isoformat(),
        "source": "PostgreSQL",
        "pacientes": [],
        "medicos": [],
        "atestados": [],
    }

    engine = create_engine(database_url, pool_pre_ping=True)
    try:
        queries = {
            "pacientes": text("SELECT * FROM pacientes ORDER BY id"),
            "medicos": text("SELECT * FROM medicos ORDER BY id"),
            "atestados": text("SELECT * FROM atestados ORDER BY id"),
        }
        with engine.connect() as conn:
            for table, query in queries.items():
                try:
                    result = conn.execute(query)
                    columns = result.keys()
                    backup_data[table] = [dict(zip(columns, row)) for row in result]
                    print(f"{table}: {len(backup_data[table])} registros")
                except Exception as exc:
                    # Some deployments may not have every optional table.
                    print(f"{table}: indispon?vel ({type(exc).__name__})")
    finally:
        engine.dispose()

    with open(json_file, "w", encoding="utf-8") as handle:
        json.dump(backup_data, handle, indent=2, ensure_ascii=False, default=str)

    print(f"\nBackup JSON criado: {os.path.basename(json_file)}")
    return json_file


if __name__ == "__main__":
    fazer_backup_direto()
