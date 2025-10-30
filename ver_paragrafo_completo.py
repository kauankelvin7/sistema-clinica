"""Script para verificar o parágrafo completo da declaração"""
from docx import Document

doc = Document('data/generated_documents/Declaracao_TESTE_JOÃO_SILVA_20251030_082021.docx')

print("=" * 80)
print("PARÁGRAFO COMPLETO DA DECLARAÇÃO")
print("=" * 80)

for i, p in enumerate(doc.paragraphs):
    if 'Declaro' in p.text:
        print(f"\nParágrafo {i}:")
        print(p.text)
        print("\n" + "=" * 80)
        break
