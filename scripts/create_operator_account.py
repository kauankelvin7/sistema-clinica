"""Provisionamento local de credenciais de operador (sem guardar senha em arquivo).

Uso: python scripts/create_operator_account.py usuario.exemplo admin
Copie o objeto JSON gerado para OPERATOR_ACCOUNTS_JSON no gerenciador de segredos.
Para mais contas, combine os pares de usuário no mesmo objeto JSON.
"""
import argparse
import getpass
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.operator_accounts import create_password_hash, load_operator_accounts


def main() -> int:
    parser = argparse.ArgumentParser(description="Criar hash para uma conta de operador.")
    parser.add_argument("username", help="Identificador individual, sem espaços")
    parser.add_argument("role", choices=["admin", "operator"])
    args = parser.parse_args()
    first = getpass.getpass("Senha individual (mínimo 12 caracteres): ")
    second = getpass.getpass("Repita a senha: ")
    if first != second:
        parser.error("As senhas não coincidem.")
    try:
        encoded = create_password_hash(first)
        entry = {args.username: {"password_hash": encoded, "role": args.role, "active": True}}
        if args.role == "admin":
            load_operator_accounts(json.dumps(entry))
    except (ValueError, RuntimeError) as exc:
        parser.error(str(exc))
    print(json.dumps(entry, ensure_ascii=False, indent=2))
    print("Configure no gerenciador de segredos. Não envie esse conteúdo para o Git.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
