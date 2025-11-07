-- Backup Sistema Clinica
-- Data: 2025-11-07 14:27:08
-- Pacientes: 64 | Medicos: 61

CREATE TABLE IF NOT EXISTS pacientes (
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


-- PACIENTES (64 registros)

INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (1, 'KAUAN KELVIN SANTOS BARBOSA', 'CPF', '714.237.091-28', 'AUXILIAR ADMINISTRATIVO', 'NOVA MEDICINA E SEGURANÇA DO TRABALHO');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (2, 'LEONARDO ALVES SÁ DE SOUSA', 'CPF', '046.576.651-03', 'Auxiliar de estoque', 'JMV COMERCIO DE ALIMENTOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (3, 'DANIEL AVELINO DOS SANTOS', 'CPF', '084.140.911-05', 'Agente de portaria', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (4, 'MARCOS VINÍCIUS SOUSA SAMPAIO', 'CPF', '064.034.691-00', 'Meio oficial', 'IMPER MAIS IMPERMEABILIZACAO LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (5, 'MARIANA MATOS DE SOUSA', 'CPF', '607.730.203-14', 'AUXILIAR FINANCEIRO JUNIOR', 'TECINTEL - TECNOLOGIA INFORMACAO E TELECOMUNICACOES');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (6, 'IARA FRANCISCA DE SOUZA', 'CPF', '539.080.821-53', 'Técnico de enfermagem', 'CENTRO DE REABILITACAO PSICOSSOCIAL ESTANCIA RESILIENCIA LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (7, 'IRACELI MARTINS DE SOUSA', 'CPF', '455.081.431-49', 'COPEIRA', 'GESTOR SERVICOS');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (8, 'LUCINEIA ROSA DE SOUZA', 'CPF', '052.083.801-70', 'Auxiliar de serviços gerais', 'CENTRO DE REABILITACAO PSICOSSOCIAL ESTANCIA RESILIENCIA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (9, 'KELLY DIANE CARVALHO FARIAS', 'CPF', '725.346.721-34', 'Auxiliar de serviços gerais', 'MORHENA HOSPITALAR LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (10, 'MARIA DA GUIA PEREIRA DA COSTA', 'CPF', '443.133.221-91', 'AUXILIAR DE HIGIENE', 'MORHENA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (11, 'GUILHERME RODRIGUES DA SILVA', 'CPF', '059.112.581-10', 'AUXILIAR DE SERVIÇOS GERAIS', 'MORHENA SERVICOS ADMINISTRATIVOS');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (12, 'Kleverson Rodrigo Ramos Sousa', 'CPF', '052.231.833-98', 'Produtor(a) de Vídeos', 'ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (13, 'MARINEIDE RODRIGUES ALVES', 'CPF', '392.406.301-0', 'Auxiliar de serviços gerais', 'MORHENA HOSPITALAR');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (14, 'RENATA CARVALHO DA SILVA', 'CPF', '029.295.301-1', 'Auxiliar de serviços gerais', 'MORHENA HOSPITALAR LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (15, 'BRUNA CECILIA LOPES DOS SANTOS', 'CPF', '054.289.871-38', 'AUXILIAR DE PROJETOS', 'TECINTEL');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (16, 'BRUNO RIBEIRO DA SILVA', 'CPF', '053.223.441-36', 'AUXILIAR ADMINISTRATIVO', 'CONDOMINIO ESTANCIA QUINTAS DA ALVORADA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (17, 'ELEN CRISTIANE DE PAIVA DIAS PIRES', 'CPF', '837.836.101-25', 'RECEPCIONISTA', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (18, 'JULIO CESAR CORREA DIAS', 'CPF', '692.472.691-72', 'Carregador', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (19, 'GRASIANNI GOMES DOS SANTOS', 'CPF', '689.644.631-53', 'RECEPCIONISTA', 'GESTOR');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (20, 'EDUARDO HENRIQUE MENDES MOURA', 'CPF', '373.397.021-72', 'GARÇOM', 'GESTOR');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (21, 'Maria Rosalice Antonia da Silva', 'CPF', '794.285.251-20', 'Professor das séries iniciais', 'Adventista');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (22, 'ESTER CRISTINE ALVES PINHEIRO', 'CPF', '055.059.181-82', 'AUXILIAR DE DESENVOLVIMENTO INFANTIL', 'ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (23, 'STEFFANY DA COSTA LEITE', 'CPF', '049.253.371-73', 'Recepcionista', 'MEL BELEZA E BEM ESTAR EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (24, 'ARTHUR DA CONCEIÇÃO FERNANDES', 'CPF', '021.101.811-25', 'Carregador', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (25, 'HERBERT ALVES DE SOUSA', 'CPF', '634.760.291-15', 'ELETRICISTA', 'STARK CONSTRUCOES E SERVICOS EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (26, 'NEILA DO NASCIMENTO WERLANG', 'CPF', '015.302.941-26', 'Assistente comercial', 'MELISA RODRIGUES VALADAO DE OLIVEIRA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (27, 'RODRIGO VENCESLAU DOS SANTOS BRITO', 'CPF', '054.116.401-56', 'Porteiro', 'CONDOMINIO SOLAR DE BRASILIA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (28, 'FERNANDA FONSECA', 'CPF', '073.878.526-18', 'AUXILIAR DE SECRETARIA', 'ESCOLA ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (29, 'ANDERSON DA SILVA SANTOS', 'CPF', '946.201.211-34', 'Agente de portaria', 'GESTOR SERVICOS');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (30, 'GABRIELA GOMES DA SILVA', 'CPF', '703.950.201-15', 'Servente', 'VIVA SERVICOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (31, 'KETLYN LAYANY FERREIRA DIAS DOS SANTOS', 'CPF', '043.429.491-80', 'ATENDENTE', 'CALI COMERCIO ALIMENTICIO LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (32, 'JULIA SANTOS PEREIRA', 'CPF', '075.837.641-30', 'ATENDENTE I', 'LABORATORIO LABIN-MED LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (33, 'RAFAELA DOS SANTOS MONTEIRO', 'CPF', '059.393.601-90', 'Servente', 'VIVA SERVICOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (34, 'IARA COSTA DOS SANTOS', 'CPF', '066.219.803-45', 'ANALISTA JURIDICO', 'UNYEAD EDUCACIONAL S.A.');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (35, 'GABRIELLE MIRANDA CAMILO', 'CPF', '085.887.861-50', 'Servente de limpeza', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (36, 'LUCIANA FERREIRA CICERO', 'CPF', '030.406.021-60', 'RECEPCIONISTA', 'F. LORENZO - POLICLINICA DE FISIOTERAPIA LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (37, 'INGRYD ALICE DA SILVA CORREIA', 'CPF', '072.126.721-14', 'Auxiliar de serviços gerais', 'MORHENA HOSPITALAR LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (38, 'Giovana Fonseca Trindade', 'CPF', '075.867.531-30', 'Auxiliar de Limpeza', 'Adventista');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (39, 'MARIA EDUARDA ARÔSO VIEIRA DA SILVA', 'CPF', '018.581.801-39', 'RECEPCIONISTA', 'J&MT ACADEMIA DE EVENTOS ESPORTIVOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (40, 'ANTONIO LUCIANO PEREIRA ARAGÃO', 'CPF', '020.344.511-20', 'AUX. DE LIMPEZA', 'MARCO MARCHETTI S A HOTEIS');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (41, 'WENDSON AGUIAR BATISTA', 'CPF', '083.345.341-67', 'OPERADOR DE TELEMARKETING', 'BS APOIO ADMINISTRATIVO');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (42, 'RAFAELLA MARQUES FARIAS DOS SANTOS', 'CPF', '064.460.341-05', 'ATENDENTE I', 'LABORATORIO LABIN-MED LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (43, 'SANDRO SOUZA DA SILVA', 'CPF', '051.319.394-45', 'GARÇOM', 'GESTOR');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (44, 'JANDISLEI RODRIGUES DA SILVA OLIVEIRA', 'CPF', '005.116.481-70', 'Servente', 'VIVA SERVICOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (45, 'LUIZ HENRIQUE FIGUEIROA SANTOS', 'CPF', '103.404.794-93', 'ASSISTENTE ADMINISTRATIVO - NIVEL I', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (46, 'EDGAR DOS SANTOS TEODORO DA SILVA', 'CPF', '883.165.131-53', 'AUXILIAR DE HIGIENE', 'MORHENA HOSPITALAR');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (47, 'JESSICA MARIA DE OLIVEIRA SANTOS', 'CPF', '042.319.631-69', 'AUXILIAR DE DENSENVOLVIMENTO INFANTIL', 'COLEGIO ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (48, 'EDUARDO DE SOUZA BALDEZ', 'CPF', '709.368.051-88', 'RECEPCIONISTA', 'GESTOR SERVIÇOS');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (49, 'LUCIANA MARQUES BATISTA', 'CPF', '599.094.121-87', 'PROFESSOR DE ARTES', 'ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (50, 'LEONARDO ROSA DA SILVA', 'CPF', '715.942.501-46', 'Auxiliar de serviços gerais', 'CONDOMINIO ESTANCIA QUINTAS DA ALVORADA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (51, 'EDSON RODRIGUES DA SILVA', 'CPF', '044.258.611-67', 'ASSISTENTE ADMINISTRATIVO - NIVEL I', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (52, 'ALESSANDRA BATISTA DE LIMA MARAVALHO', 'CPF', '925.302.141-15', 'ASSISTENTE ADMINISTRATIVO - NIVEL I', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (53, 'HELEN CRISTINY VIEIRA CARVALHO', 'CPF', '059.112.781-46', 'AUXILIAR DE LIMPEZA', 'COLEGIO ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (54, 'LIGIA MARA SILVA OLIVEIRA GOMES', 'CPF', '645.115.453-91', 'PROFESSOR DAS SÉRIES INICIAIS', 'ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (55, 'Ana Beatriz Maciel Nascimento', 'CPF', '039.949.171-66', 'ANALISTA DE RECURSOS HUMANOS', 'CLINICA VERAS MEDICINA PREVENTIVA 191DF EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (56, 'ANTONIO PEDRO TOMAZ FARIAS', 'CPF', '087.248.041-00', 'Lavador', 'PREMIERE DISTRIBUIDORA DE VEICULOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (57, 'DRIELY FELIX GONÇALVES', 'CPF', '019.611.451-97', 'TEC.SECRETARIADO', 'GESTOR SERVICOS EMPRESARIAIS ESPECIALIZADOS EM MAO DE OBRA, GESTAO DE RECURSOS HUMANOS E LIMPEZA EIRELI');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (58, 'Vania Lucia Alves Feitosa', 'CPF', '308.410.971-00', 'Auxiliar administrativo', 'SINDICATO DOS EMP EM ESTAB DE SERV DE SAUDE DE BSB DF');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (59, 'MAXWELL ANDRADE DE MIRANDA', 'CPF', '065.202.171-90', 'AJUDANTE', 'LOPES ALMEIDA REIS CONSTRUCOES LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (60, 'SENASSES DE SOUSA LIRAS', 'CPF', '056.288.351-70', 'Porteiro', 'CONDOMINIO SOLAR DE BRASILIA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (61, 'WILLIAM ROBERT JESUS VEIGA AMARAL', 'CPF', '037.530.081-33', 'Servente', 'VIVA SERVICOS LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (62, 'MARIA VERINALDA DA SILVA SOUSA', 'CPF', '008.496.941-59', 'AUXILIAR DE HIGIENE', 'MORHENA HOSPITALAR LTDA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (63, 'Gabriel Modesto da Silva', 'CPF', '717.957.371-07', 'Auxiliar de Limpeza', 'ADVENTISTA');
INSERT INTO pacientes (id, nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (64, 'ANTONIO MARCOS RIBEIRO DA SILVA', 'CPF', '017.542.641-40', 'Auxiliar de serviços gerais', 'MORHENA HOSPITALAR LTDA');

-- MEDICOS (61 registros)

INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (1, 'SÁVIO RIBEIRO DA CRUZ', 'CRM', '25621', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (2, 'ANA GABRIELA BATISTA PINHEIRO DE BRITO', 'CRM', '35767', 'GO');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (3, 'SUFIA LUCIA CAZIMIRO FONTES', 'CRM', '30198', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (4, 'LINDOMI OLIVEIRA DE SOUZA JUNIOR', 'CRM', '34546', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (5, 'ESTHER OLIVEIRA', 'CRO', '11029', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (6, 'ANDRE SALES BRAGA', 'CRM', '13185', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (7, 'EDUARDO FRANCA DO VALE', 'CRM', '27053', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (8, 'ROBERTO ALBANIR', 'CRM', '28927', 'GO');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (9, 'ALEXANDER TAVARES', 'CRM', '11981', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (10, 'HEDER  RICARDO SANTOS', 'CRM', '34309', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (11, 'TAINA C. WALZBERG', 'CRM', '16369', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (12, 'LANNISSE FERNANDES', 'CRO', '9500', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (13, 'AFONSO H. FERRAO', 'CRM', '30814', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (14, 'DANIEL SAD', 'CRM', '18545', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (15, 'ITAJAI OLIVEIRA', 'CRM', '23290', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (16, 'CLAUDIO WHITAKER', 'CRM', '16117', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (17, 'DANILO VILARINHO FERNANDES', 'CRM', '20352', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (18, 'AMANDA NUNES', 'CRM', '34636', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (19, 'LUIZ BENEDITO', 'CRM', '32947', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (20, 'GABRIEL FONSECA DE BULHÕES', 'CRM', '29197', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (21, 'MÔNICA DANDARA MONTENEGRO BRAZ GOMES', 'CRM', '27921', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (22, 'THAMIRES FERREIRA', 'CRM', '22398', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (23, 'RICARDO PEREZ JANNUZZI', 'CRM', '17693', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (24, 'JOÃO VICTOR ELEUTERIO', 'CRM', '34604', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (25, 'LUCELIA MARIA', 'CRM', '14929', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (26, 'FERNANDA ROCHA', 'CRO', '12759', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (27, 'KELLY LEAL', 'CRM', '17711', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (28, 'AFONSO M. DE A. MAIA', 'CRM', '15881', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (29, 'JORGE RANGEL', 'CRM', '28692', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (30, 'YÁSMIN BOTELHO NEIVA', 'CRM', '34449', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (31, 'VINICIUS BATISTA CORREA DA SILVA', 'CRM', '34387', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (32, 'THALIA DE OLIVEIRA', 'CRM', '32058', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (33, 'THAYSA LIMA', 'CRM', '31080', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (34, 'FERNANDA RIBEIRO', 'CRM', '31226', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (35, 'CARLOS NUNES', 'CRM', '31206', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (36, 'DANILA ARAÚJO', 'CRM', '15478', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (37, 'LUÍS CARLOS MUNIZ', 'CRM', '8259', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (38, 'JULIA SOUZA GONÇALVES', 'CRM', '34389', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (39, 'RENATO SIMIONATTO E SILVA', 'CRM', '10768', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (40, 'DESYREE RAMOS', 'CRM', '29947-', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (41, 'VALDIR FAGUNDES', 'CRM', '8332', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (42, 'LUIS AUGUSTO ORTIZ', 'CRO', '13081', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (43, 'BIANCA GONTIJO ROCHA', 'CRM', '28066', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (44, 'ANDRE COSTA VELOSO', 'CRM', '16693', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (45, 'ALEXANDRE LOPES E SILVA', 'CRM', '4650', 'PI');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (46, 'MARCELO MARONI', 'CRM', '26084', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (47, 'SERGIO MURILO ROSA', 'CRM', '8647', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (48, 'IRANEIDE RODRIGUES DE SOUSA', 'CRO', '12510', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (49, 'DIOGO B PEREIRA', 'CRO', '9205', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (50, 'MARIA LUCENA CARNEIRO', 'CRM', '30616', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (51, 'MARIA EDUARDA BARROS GALVÃO', 'CRM', '37820', 'GO');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (52, 'HENRIQUE DE LACERDA PEREIRA', 'CRM', '26374', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (53, 'STEPHANIE IZABEL AGATTI', 'CRM', '27932', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (54, 'PEDRO LEOPOLDO', 'CRM', '11771', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (55, 'MEINARDO ZAYAS VINENT', 'CRM', '30429', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (56, 'ALEXANDRE FRANCO RABELO', 'CRM', '31265', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (57, 'ERYCLAUDIA CHRYSTIAN BRASILEIRO', 'CRM', '31578', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (58, 'RAFAEL DA SILVA ARAUJO', 'CRM', '14988', 'ES');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (59, 'ALEXEL GENTIL', 'CRM', '14442', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (60, 'IGOR THIAGO GOMES DE AZEVEDO', 'CRM', '34671', 'DF');
INSERT INTO medicos (id, nome_completo, tipo_crm, crm, uf_crm) VALUES (61, 'MARCO ANTONIO NERES', 'CRM', '31085', 'DF');

-- RESET SEQUENCES

SELECT setval('pacientes_id_seq', 64);
SELECT setval('medicos_id_seq', 61);
