import sys
import os
import re
import sqlite3
import xml.etree.ElementTree as ET
from pathlib import Path

# Fix stdout encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Load .env if present
env_path = ROOT_DIR / '.env'
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip().strip("'\""))

from core.crypto import encrypt, generate_hash
from core.database import sanitizar_entrada

xml_data = """<XML>
<dados>
<nome_do_medico>
<![CDATA[ Nome ]]>
</nome_do_medico>
<CRM>
<![CDATA[ CRM ]]>
</CRM>
<situacao>
<![CDATA[ Situação ]]>
</situacao>
<chaves>
<CRM>CRM</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ DIEGO RODOVALHO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 17559-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>17559-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ALLAN FREITAS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 21072-PE ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>21072-PE</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JULIA PIMENTA GOMES ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 94420-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>94420-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ RODRIGO ANDRADE DE SOUSA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 52574-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>52574-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ FELIPE G BOTTON ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 14896-MT ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>14896-MT</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Dr. GUILHERME LUIZ BUZATTO LAGO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 118.789-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>118.789-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LILIAN RIBEIRO ARAUJO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 16059-GO ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>16059-GO</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARIA CLAUDIA DE CARVALHO P. G. ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 46344-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>46344-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Murdem José Machado ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 2997 CRM-GO ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>2997 CRM-GO</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LEONARDO CÉSAR SILVA E SOUSA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 9860-GO ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>9860-GO</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ TEREZA CRISTINA LEAL4820 ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 4820-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>4820-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ José Carlos Francisco Alves ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 31106-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>31106-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ DR. GUSTAVO TEIXEIRA DE OLIVEIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 50364-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>50364-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Claudio Alves Ponte ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 3311-CE ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>3311-CE</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Rendreson Damasceno ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 6411-AL ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>6411-AL</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ VICTOR MESQUITA RIOS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 13127-df ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>13127-df</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ IGOR ALENCAR FERRER ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 34521-PE ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>34521-PE</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Raymundo Maltez Filho ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 7484-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>7484-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ NEWDSON CARLOS DE MORAIS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 6946-CE ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>6946-CE</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LETICIA DE CARVALHO BRITO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 94378-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>94378-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ANDRESSA SOARES RITTER ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 10200-MT ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>10200-MT</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARILIA MAGALHAES WANDERLEI ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 32904-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>32904-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ FELIPE G. BOTTON ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 14696-MT ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>14696-MT</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JULIANA RAMOS DEDONI ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 94603-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>94603-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ RAFAEL NEVES ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 79013-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>79013-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ RODRIGO MOREIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 31013-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>31013-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ALDO MOACIR GRANDE FILHO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 7909 CRM-MS ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>7909 CRM-MS</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LUANDA SANTOS OLIVEIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 42937-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>42937-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ISABELA COUTO CAMPOS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 88186-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>88186-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ FRANKLIN WILLIAM ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 12093-RN ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>12093-RN</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ DIEGO ICLI ANELLO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 521105-RJ ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>521105-RJ</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ TUANE CANEDO COSTA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 4825-PI ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>4825-PI</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Eduardo alves cruzeiro ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 93107-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>93107-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ franklin firmino ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 1312-RN ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>1312-RN</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LUANA RODRIGUES CARVALHO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 259369-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>259369-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ DIONES P BRITO E SILVA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 10.624-PI ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>10.624-PI</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Edson Jandrey Cota Queiroz ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 17720-PA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>17720-PA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ DJUNIOR DA SILVA MOTA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 11251-PA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>11251-PA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ BERNARDO MIRANDA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 33141-PE ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>33141-PE</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ NATHALIA TEIS SOUZA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 93342-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>93342-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Flavio Dos Santos Novais ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 0004165378-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>0004165378-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ GIANFRANCO ZAMPIERI ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 43268-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>43268-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MIRLAINE CARVALHO MUNIZ DE SOUZA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 030328-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>030328-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JOYCE GONÇALVES CRUZEIRO LOPES DE CASTRO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 99470-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>99470-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ALISSON CÉSAR DE FIGUEREDO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 99539-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>99539-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Josafa Teixeira Cavalcante ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 003508-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>003508-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Andressa Benedetti Martins ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 43251-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>43251-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Bianca de Souza Bomfim Fraga ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 41047-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>41047-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ADEMAR BARBOSA DA SILVA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 8023-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>8023-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Giovanna Soares Penteado ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 33186-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>33186-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ROGÉRIO SILVA ARANTES ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 13354-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>13354-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MOURO P. F. DE CARVALHO JR ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 4868-RN ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>4868-RN</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Janderson Viana Oliveira ]]>
</nome_do_medico>
<CRM>
<![CDATA[ CRM 20152-PA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>CRM 20152-PA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ CAROLINA J. PANSEIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 201190-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>201190-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JOAQUIM SANTIAGO NETO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 97301-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>97301-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ PAULO CESAR BARBUDO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ RQE1552798-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>RQE1552798-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ PAULO CESAR BARBUDO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ RQE15527/98-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>RQE15527/98-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ HUGO RANGEL MIRANDA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 33243-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>33243-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ AILANA ALMEIDA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 6315-PA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>6315-PA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARCEL DE OLIVEIRA LOPES ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 1775-AL ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>1775-AL</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ELICENE BAMBAREM DE YABAR ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 3306-MT ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>3306-MT</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ RODRIGO BARBOSA CARNEIRO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 1726 -TO ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>1726 -TO</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JOSEFA TEIXEIRA CAVALCANTE ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 4008-GO ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>4008-GO</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ELANO FREDERICK SOARES ARRUDA ANDRADE ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 10384-BA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>10384-BA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ DANIELLA ARBORE ABREU ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 224384-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>224384-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JOÃO REMO SARAIVA DE ALMEIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 7970-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>7970-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARIANA MORANDUZZO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 262.757-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>262.757-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ROBERTO TRAVIA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 21883-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>21883-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ BRENDA DIAS NASCIMENTO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 38.577-SC ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>38.577-SC</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Tatiane L Tanahara ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 10806-MS ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>10806-MS</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LEONEL ROSSETTI CALVANO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 19936-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>19936-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARCELLA BARRETO CAMPOS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 33650-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>33650-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ALEXANDRE A. CHIANCON ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 93975-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>93975-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARCO ANTONIO CORDEIRO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 2449-GO ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>2449-GO</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ANTONIO M. SELEME ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 419-SC ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>419-SC</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Paulo Sergio Sousa Curvelo ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 7178-sp ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>7178-sp</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ THAYS REZE ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 101259-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>101259-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ VALTER PAULO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 29494-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>29494-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ IVANILDO MACIEL ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 6917-PE ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>6917-PE</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JORGE AURÉLIO BARROS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 2780-PA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>2780-PA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ALEXANDRA FONSECA DE ANUNCIAÇÃO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 14029-MT ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>14029-MT</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Flavia piaulino pinheiro ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 9662-PI ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>9662-PI</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ THAIS HELEN COSTA TEIXEIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 99039-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>99039-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ELISA TACIANA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 78463-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>78463-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MAURO REBOLI DE VARGAS ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 1894-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>1894-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Camila Y a Shimabukuro ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 1421-MT ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>1421-MT</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Eduardo Madrid Finck ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 252916-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>252916-SP</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ELBER SAMPAIO VILANOVA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 20773-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>20773-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ LUIZ PINTO FERNANDES ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 6080-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>6080-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Kauane Moura de Bastos Correia ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 33417-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>33417-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ ANNA CAROLINNA F. CARVALHO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 27764-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>27764-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Raphael Palomares Jacobs ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 8926-PA ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>8926-PA</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Hugo Neto ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 11093-PI ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>11093-PI</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ CESAR YOSHIO KAWAKAMI ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 21499-PR ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>21499-PR</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ JOSE CLAUDIO RANGEL TAVARES ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 25371-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>25371-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Alcineu Nunes A. Filho ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 1221-ES ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>1221-ES</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Maycon Lemos ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 29406-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>29406-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ MARCIA ALVES DE OLIVEIRA ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 10613-DF ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>10613-DF</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ Haroldo Gomes Nascimento ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 16375-MG ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>16375-MG</CRM>
</chaves>
<botoes/>
</dados>
<dados>
<nome_do_medico>
<![CDATA[ WANDERLEY RONDINI FILHO ]]>
</nome_do_medico>
<CRM>
<![CDATA[ 74849-SP ]]>
</CRM>
<situacao>
<![CDATA[ Ativo ]]>
</situacao>
<chaves>
<CRM>74849-SP</CRM>
</chaves>
<botoes/>
</dados>
</XML>"""

def parse_crm(crm_str):
    crm_str = crm_str.strip()
    uf_match = re.search(r'([A-Za-z]{2})\s*$', crm_str)
    if uf_match:
        uf = uf_match.group(1).upper()
        crm_num = crm_str[:uf_match.start()].strip()
    else:
        uf = "UF"
        crm_num = crm_str
        
    crm_num = re.sub(r'^(?:CRM|CRO|RMS)\s*', '', crm_num, flags=re.IGNORECASE).strip()
    crm_num = re.sub(r'\s*(?:CRM|CRO|RMS)\s*', '', crm_num, flags=re.IGNORECASE).strip()
    crm_num = re.sub(r'-+$', '', crm_num).strip()
    return crm_num, uf

def parse_nome(nome_str):
    nome = nome_str.strip()
    nome = re.sub(r'(\D+)\d{4,}', r'\1', nome).strip()
    return nome

def parse_xml():
    root = ET.fromstring(xml_data)
    parsed = []
    for item in root.findall('dados'):
        nome_elem = item.find('nome_do_medico')
        crm_elem = item.find('CRM')
        
        if nome_elem is None or crm_elem is None:
            continue
            
        nome_raw = (nome_elem.text or "").strip()
        crm_raw = (crm_elem.text or "").strip()
        
        if not nome_raw or not crm_raw or nome_raw.lower() == "nome" or crm_raw.lower() == "crm":
            continue
            
        nome = parse_nome(nome_raw)
        crm, uf = parse_crm(crm_raw)
        
        parsed.append({
            "nome": nome,
            "crm": crm,
            "uf": uf,
            "tipo_crm": "CRM"
        })
    return parsed

def import_to_sqlite(db_path: Path, doctors: list):
    print(f"--- Importando para SQLite: {db_path.name} ---", flush=True)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_completo TEXT NOT NULL,
            tipo_crm TEXT NOT NULL DEFAULT 'CRM',
            crm TEXT NOT NULL,
            crm_hash TEXT UNIQUE,
            uf_crm TEXT NOT NULL,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tipo_crm, crm_hash)
        )
    ''')
    
    cursor.execute("PRAGMA table_info(medicos)")
    cols = [col[1] for col in cursor.fetchall()]
    if 'crm_hash' not in cols:
        cursor.execute("ALTER TABLE medicos ADD COLUMN crm_hash TEXT")
    
    inserted = 0
    updated = 0
    
    for doc in doctors:
        nome_sanitizado = sanitizar_entrada(doc["nome"])
        crm_sanitizado = sanitizar_entrada(doc["crm"])
        uf_sanitizado = sanitizar_entrada(doc["uf"])
        tipo_crm = doc["tipo_crm"]
        
        enc_nome = encrypt(nome_sanitizado)
        crm_hash = generate_hash(crm_sanitizado)
        
        cursor.execute("SELECT id FROM medicos WHERE crm_hash = ? AND tipo_crm = ?", (crm_hash, tipo_crm))
        row = cursor.fetchone()
        
        if not row:
            cursor.execute("SELECT id FROM medicos WHERE crm = ? AND tipo_crm = ? AND uf_crm = ?", (crm_sanitizado, tipo_crm, uf_sanitizado))
            row = cursor.fetchone()
            
        if row:
            cursor.execute("""
                UPDATE medicos 
                SET nome_completo = ?, crm = ?, crm_hash = ?, uf_crm = ?, data_atualizacao = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (enc_nome, crm_sanitizado, crm_hash, uf_sanitizado, row[0]))
            updated += 1
        else:
            cursor.execute("""
                INSERT INTO medicos (nome_completo, tipo_crm, crm, crm_hash, uf_crm)
                VALUES (?, ?, ?, ?, ?)
            """, (enc_nome, tipo_crm, crm_sanitizado, crm_hash, uf_sanitizado))
            inserted += 1
            
    conn.commit()
    conn.close()
    print(f"DONE {db_path.name}: {inserted} inseridos, {updated} atualizados.", flush=True)

def import_to_postgres(doctors: list):
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL nao encontrada em .env, pulando importacao PostgreSQL.", flush=True)
        return
        
    print("--- Importando para PostgreSQL (Supabase) ---", flush=True)
    try:
        from sqlalchemy import create_engine, text
        from sqlalchemy.orm import sessionmaker
        
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
            
        engine = create_engine(db_url, connect_args={"connect_timeout": 15})
        Session = sessionmaker(bind=engine)
        session = Session()
        
        session.execute(text('''
            CREATE TABLE IF NOT EXISTS medicos (
                id SERIAL PRIMARY KEY,
                nome_completo TEXT NOT NULL,
                tipo_crm TEXT NOT NULL DEFAULT 'CRM',
                crm TEXT NOT NULL,
                crm_hash TEXT UNIQUE,
                uf_crm TEXT NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tipo_crm, crm_hash)
            )
        '''))
        session.commit()
        
        inserted = 0
        updated = 0
        
        for doc in doctors:
            nome_sanitizado = sanitizar_entrada(doc["nome"])
            crm_sanitizado = sanitizar_entrada(doc["crm"])
            uf_sanitizado = sanitizar_entrada(doc["uf"])
            tipo_crm = doc["tipo_crm"]
            
            enc_nome = encrypt(nome_sanitizado)
            crm_hash = generate_hash(crm_sanitizado)
            
            res = session.execute(
                text("SELECT id FROM medicos WHERE (crm_hash = :h OR crm = :crm) AND tipo_crm = :t"),
                {"h": crm_hash, "crm": crm_sanitizado, "t": tipo_crm}
            ).fetchone()
            
            if res:
                session.execute(
                    text("""
                        UPDATE medicos 
                        SET nome_completo = :nome, crm = :crm, crm_hash = :hash, uf_crm = :uf, data_atualizacao = CURRENT_TIMESTAMP
                        WHERE id = :id
                    """),
                    {"nome": enc_nome, "crm": crm_sanitizado, "hash": crm_hash, "uf": uf_sanitizado, "id": res[0]}
                )
                updated += 1
            else:
                session.execute(
                    text("""
                        INSERT INTO medicos (nome_completo, tipo_crm, crm, crm_hash, uf_crm)
                        VALUES (:nome, :tipo_crm, :crm, :crm_hash, :uf)
                    """),
                    {"nome": enc_nome, "tipo_crm": tipo_crm, "crm": crm_sanitizado, "crm_hash": crm_hash, "uf": uf_sanitizado}
                )
                inserted += 1
                
        session.commit()
        session.close()
        print(f"DONE PostgreSQL (Supabase): {inserted} inseridos, {updated} atualizados.", flush=True)
    except Exception as e:
        print(f"Erro ao importar no PostgreSQL: {e}", flush=True)

if __name__ == '__main__':
    doctors = parse_xml()
    print(f"Total de medicos extraidos do XML: {len(doctors)}", flush=True)
    
    clinica_db = ROOT_DIR / 'data' / 'clinica.db'
    import_to_sqlite(clinica_db, doctors)
    
    homologacao_db = ROOT_DIR / 'data' / 'homologacao.db'
    import_to_sqlite(homologacao_db, doctors)
    
    import_to_postgres(doctors)
    
    print("Importacao concluida com sucesso!", flush=True)
