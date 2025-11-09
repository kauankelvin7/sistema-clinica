"""
Banco de dados em memória temporário
Usado para testes locais sem Firebase
"""

from typing import Dict, Optional, List
from datetime import datetime

# Armazenamento em memória
pacientes_db = {}
medicos_db = {}

def add_paciente(paciente: Dict) -> str:
    """Adiciona paciente ao banco em memória"""
    paciente_id = f"{paciente.get('tipo_documento')}_{paciente.get('numero_documento')}"
    pacientes_db[paciente_id] = {
        **paciente,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    return paciente_id

def get_paciente_by_doc(tipo_doc: str, numero_doc: str) -> Optional[Dict]:
    """Busca paciente por documento"""
    paciente_id = f"{tipo_doc}_{numero_doc}"
    return pacientes_db.get(paciente_id)

def add_medico(medico: Dict) -> str:
    """Adiciona médico ao banco em memória"""
    medico_id = f"{medico.get('tipo_registro')}_{medico.get('numero_registro')}"
    medicos_db[medico_id] = {
        **medico,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    return medico_id

def get_medico_by_crm(tipo_crm: str, crm: str) -> Optional[Dict]:
    """Busca médico por CRM"""
    medico_id = f"{tipo_crm}_{crm}"
    return medicos_db.get(medico_id)

def get_all_pacientes() -> List[Dict]:
    """Retorna todos os pacientes"""
    return list(pacientes_db.values())

def get_all_medicos() -> List[Dict]:
    """Retorna todos os médicos"""
    return list(medicos_db.values())

def get_stats() -> Dict:
    """Retorna estatísticas do banco"""
    return {
        'total_pacientes': len(pacientes_db),
        'total_medicos': len(medicos_db)
    }
