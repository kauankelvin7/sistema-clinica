"""
Módulo de geração direta de PDF
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 30/10/2025

Este módulo gera PDFs nativamente usando ReportLab (sem LibreOffice)
"""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

logger = logging.getLogger(__name__)

class PDFGenerationError(Exception):
    """Exceção personalizada para erros de geração de PDF"""
    pass


def generate_pdf_direct(data: Dict[str, Any], output_dir: Optional[str] = None) -> str:
    """
    Gera PDF diretamente dos dados (sem passar por DOCX).
    
    Args:
        data: Dicionário com os dados do documento
        output_dir: Diretório de saída (padrão: data/generated_documents)
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        PDFGenerationError: Se houver erro na geração
    """
    try:
        # Diretório de saída
        if output_dir is None:
            output_dir = Path(__file__).parent.parent / 'data' / 'generated_documents'
        else:
            output_dir = Path(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Nome do arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nome_paciente = data.get('nome_paciente', 'Paciente').replace(' ', '_')
        filename = f"Declaracao_{nome_paciente}_{timestamp}.pdf"
        filepath = output_dir / filename
        
        # Criar documento PDF
        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Estilos
        styles = getSampleStyleSheet()
        
        # Estilo para título
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.black,
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Estilo para texto normal
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            alignment=TA_JUSTIFY,
            spaceAfter=12,
            fontName='Helvetica'
        )
        
        # Estilo para assinatura
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=6,
            fontName='Helvetica'
        )
        
        # Conteúdo do documento
        story = []
        
        # Título
        story.append(Paragraph("DECLARAÇÃO DE HOMOLOGAÇÃO", title_style))
        story.append(Spacer(1, 0.5*cm))
        
        # Corpo do texto
        texto_corpo = f"""
        Declaro para os devidos fins que o(a) colaborador(a) <b>{data.get('nome_paciente', '')}</b>, 
        portador(a) do {data.get('tipo_doc_paciente', 'CPF')} nº: <b>{data.get('numero_doc_paciente', '')}</b>, 
        exercendo a função de <b>{data.get('cargo_paciente', '')}</b> na empresa 
        <b>{data.get('empresa_paciente', '')}</b>, apresentou atestado médico datado de 
        <b>{data.get('data_atestado', '')}</b>, com <b>{data.get('qtd_dias_atestado', '')} dia(s)</b> 
        de afastamento.
        """
        
        story.append(Paragraph(texto_corpo, normal_style))
        story.append(Spacer(1, 0.3*cm))
        
        # CID
        cid_texto = f"CID: <b>{data.get('codigo_cid', 'Não Informado')}</b>"
        story.append(Paragraph(cid_texto, normal_style))
        story.append(Spacer(1, 1*cm))
        
        # Data de homologação
        data_homologacao = datetime.now().strftime("%d/%m/%Y")
        story.append(Paragraph(f"Brasília-DF, {data_homologacao}", normal_style))
        story.append(Spacer(1, 2*cm))
        
        # Linha de assinatura
        story.append(Paragraph("_" * 60, signature_style))
        
        # Dados do médico
        tipo_registro = data.get('tipo_registro_medico', 'CRM')
        numero_registro = data.get('crm__medico', '')
        uf = data.get('uf_crm_medico', '')
        
        medico_completo = f"Dr.(a) {data.get('nome_medico', '')}"
        if numero_registro:
            medico_completo += f" - {tipo_registro} {numero_registro}"
            if uf:
                medico_completo += f"-{uf}"
        
        story.append(Paragraph(medico_completo, signature_style))
        
        # Construir PDF
        doc.build(story)
        
        logger.info(f"PDF gerado com sucesso: {filepath}")
        return str(filepath)
        
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {e}", exc_info=True)
        raise PDFGenerationError(f"Erro ao gerar PDF: {e}")


if __name__ == '__main__':
    # Teste
    test_data = {
        'nome_paciente': 'João da Silva',
        'tipo_doc_paciente': 'CPF',
        'numero_doc_paciente': '123.456.789-00',
        'cargo_paciente': 'Desenvolvedor',
        'empresa_paciente': 'Tech Corp',
        'data_atestado': '30/10/2025',
        'qtd_dias_atestado': '3',
        'codigo_cid': 'A00',
        'nome_medico': 'Maria Santos',
        'tipo_registro_medico': 'CRM',
        'crm__medico': '12345',
        'uf_crm_medico': 'DF'
    }
    
    try:
        pdf_path = generate_pdf_direct(test_data)
        print(f"✅ PDF de teste gerado: {pdf_path}")
    except PDFGenerationError as e:
        print(f"❌ Erro: {e}")
