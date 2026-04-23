"""
Módulo de validadores e utilitários
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 28/10/2025

Este módulo fornece funções de validação para:
- CPF
- RG
- Dados de entrada
- Datas
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def validar_cpf(cpf: str) -> bool:
    """
    Valida um CPF brasileiro (apenas dígitos).
    
    Args:
        cpf: String contendo apenas os dígitos do CPF (11 dígitos)
        
    Returns:
        bool: True se o CPF é válido, False caso contrário
    """
    # Remove caracteres não numéricos
    cpf_numeros = re.sub(r'\D', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf_numeros) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais (CPF inválido)
    if cpf_numeros == cpf_numeros[0] * 11:
        return False
    
    # Calcula o primeiro dígito verificador
    soma = sum(int(cpf_numeros[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Verifica o primeiro dígito
    if int(cpf_numeros[9]) != digito1:
        return False
    
    # Calcula o segundo dígito verificador
    soma = sum(int(cpf_numeros[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verifica o segundo dígito
    if int(cpf_numeros[10]) != digito2:
        return False
    
    return True

def validar_rg(rg: str, min_length: int = 5, max_length: int = 15) -> bool:
    """
    Valida um RG brasileiro.
    Verifica apenas se tem o tamanho adequado (RG varia por estado).
    
    Args:
        rg: String contendo o RG
        min_length: Tamanho mínimo aceitável
        max_length: Tamanho máximo aceitável
        
    Returns:
        bool: True se o RG é válido, False caso contrário
    """
    # Remove caracteres não numéricos
    rg_numeros = re.sub(r'\D', '', rg)
    
    # Verifica tamanho
    if len(rg_numeros) < min_length or len(rg_numeros) > max_length:
        logger.debug(f"RG '{rg}' com tamanho inválido: {len(rg_numeros)} dígitos")
        return False
    
    # Verifica se não são todos os dígitos iguais
    if rg_numeros == rg_numeros[0] * len(rg_numeros):
        logger.debug(f"RG '{rg}' com todos os dígitos iguais")
        return False
    
    return True

def formatar_cpf(cpf: str) -> str:
    """
    Formata um CPF no padrão XXX.XXX.XXX-XX
    
    Args:
        cpf: String contendo os dígitos do CPF
        
    Returns:
        str: CPF formatado ou string original se inválido
    """
    # Remove caracteres não numéricos
    cpf_numeros = re.sub(r'\D', '', cpf)
    
    if len(cpf_numeros) != 11:
        return cpf
    
    return f"{cpf_numeros[:3]}.{cpf_numeros[3:6]}.{cpf_numeros[6:9]}-{cpf_numeros[9:]}"

def limpar_documento(documento: str) -> str:
    """
    Remove caracteres não numéricos de um documento (CPF/RG)
    
    Args:
        documento: String contendo o documento
        
    Returns:
        str: Documento contendo apenas dígitos
    """
    return re.sub(r'\D', '', documento)

def validar_nome(nome: str, min_length: int = 3, max_length: int = 200) -> bool:
    """
    Valida um nome completo
    
    Args:
        nome: String contendo o nome
        min_length: Tamanho mínimo do nome
        max_length: Tamanho máximo do nome
        
    Returns:
        bool: True se o nome é válido, False caso contrário
    """
    if not nome or not isinstance(nome, str):
        return False
    
    nome_limpo = nome.strip()
    
    if len(nome_limpo) < min_length or len(nome_limpo) > max_length:
        return False
    
    # Verifica se contém pelo menos duas palavras (nome e sobrenome)
    palavras = nome_limpo.split()
    if len(palavras) < 2:
        logger.debug(f"Nome '{nome}' não contém sobrenome")
        return False
    
    # Verifica se contém apenas letras e espaços
    if not re.match(r'^[A-Za-zÀ-ÿ\s]+$', nome_limpo):
        logger.debug(f"Nome '{nome}' contém caracteres inválidos")
        return False
    
    return True

def validar_data_brasileira(data: str) -> bool:
    """
    Valida uma data no formato brasileiro DD/MM/AAAA
    
    Args:
        data: String contendo a data
        
    Returns:
        bool: True se a data é válida, False caso contrário
    """
    padrao = r'^\d{2}/\d{2}/\d{4}$'
    
    if not re.match(padrao, data):
        return False
    
    try:
        dia, mes, ano = map(int, data.split('/'))
        
        # Validações básicas
        if mes < 1 or mes > 12:
            return False
        
        if dia < 1 or dia > 31:
            return False
        
        if ano < 1900 or ano > 2100:
            return False
        
        # Validar dias por mês
        dias_por_mes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        
        # Verificar ano bissexto
        if ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0):
            dias_por_mes[1] = 29
        
        if dia > dias_por_mes[mes - 1]:
            return False
        
        return True
        
    except (ValueError, IndexError):
        return False

def validar_numero_inteiro(valor: str, min_val: Optional[int] = None, max_val: Optional[int] = None) -> bool:
    """
    Valida se um valor é um número inteiro dentro de um intervalo
    
    Args:
        valor: String contendo o número
        min_val: Valor mínimo permitido (opcional)
        max_val: Valor máximo permitido (opcional)
        
    Returns:
        bool: True se o valor é válido, False caso contrário
    """
    try:
        numero = int(valor)
        
        if min_val is not None and numero < min_val:
            return False
        
        if max_val is not None and numero > max_val:
            return False
        
        return True
        
    except (ValueError, TypeError):
        return False

def validar_codigo_cid(cid: str) -> bool:
    """
    Valida um código CID (Classificação Internacional de Doenças)
    Formato: Letra seguida de 2 dígitos, opcionalmente seguido de ponto e mais dígitos
    Exemplo: A00, F32.9, Z99.8
    
    Args:
        cid: String contendo o código CID
        
    Returns:
        bool: True se o CID é válido, False caso contrário
    """
    if not cid or not isinstance(cid, str):
        return False
    
    cid_limpo = cid.strip().upper()
    
    # Padrão: Letra + 2 dígitos + opcionalmente (ponto + 1 ou mais dígitos)
    padrao = r'^[A-Z]\d{2}(\.\d+)?$'
    
    return bool(re.match(padrao, cid_limpo))

def normalizar_nome(nome: str) -> str:
    """
    Normaliza um nome próprio (primeira letra de cada palavra em maiúscula)
    
    Args:
        nome: String contendo o nome
        
    Returns:
        str: Nome normalizado
    """
    if not nome:
        return ""
    
    # Lista de palavras que devem permanecer em minúscula
    minusculas = ['da', 'de', 'do', 'das', 'dos', 'e']
    
    palavras = nome.strip().split()
    palavras_normalizadas = []
    
    for i, palavra in enumerate(palavras):
        # Primeira palavra sempre maiúscula
        if i == 0 or palavra.lower() not in minusculas:
            palavras_normalizadas.append(palavra.capitalize())
        else:
            palavras_normalizadas.append(palavra.lower())
    
    return ' '.join(palavras_normalizadas)
