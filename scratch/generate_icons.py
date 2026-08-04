import os
from PIL import Image
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QPainter, QImage, QColor, QPen, QBrush, QLinearGradient
from PyQt5.QtCore import Qt, QRectF
from PyQt5.QtSvg import QSvgRenderer

# Iniciar QApplication em modo headless/gui para usar QSvgRenderer e QPainter
app = QApplication([])

# SVG do Estetoscópio em tom Garnet/Burgundy (#cb7169 / #8f3d38 / #56070c)
STETHOSCOPE_SVG_RAW = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="{stroke_color}" stroke-width="{stroke_width}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
  <circle cx="20" cy="10" r="2.5" fill="{fill_color}"/>
</svg>"""

def render_stethoscope_icon(size, stroke_color="#cb7169", stroke_width=2.2, fill_color="#cb7169", bg_style="dark", padding_ratio=0.18):
    """
    Renders a stethoscope icon with high antialiasing in Garnet/Burgundy palette:
    #170000 -> #350a06 -> #56070c -> #8f3d38 -> #cb7169
    """
    qimg = QImage(size, size, QImage.Format_ARGB32)
    qimg.fill(Qt.transparent)
    
    painter = QPainter(qimg)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setRenderHint(QPainter.SmoothPixmapTransform)
    
    if bg_style == "dark":
        # Fundo escuro premium (#170000 para #350a06) com borda em #8f3d38
        rect = QRectF(0, 0, size, size)
        grad = QLinearGradient(0, 0, size, size)
        grad.setColorAt(0.0, QColor(53, 10, 6))    # #350a06
        grad.setColorAt(1.0, QColor(23, 0, 0))     # #170000
        
        painter.setBrush(QBrush(grad))
        pen = QPen(QColor(143, 61, 56, 180))       # Borda em #8f3d38
        pen.setWidthF(max(1.5, size * 0.03))
        painter.setPen(pen)
        
        radius = size * 0.22  # Cantos arredondados suavizados
        margin = size * 0.02
        painter.drawRoundedRect(rect.adjusted(margin, margin, -margin, -margin), radius, radius)
        
    elif bg_style == "maskable":
        # Fundo totalmente preenchido sem cantos arredondados (#170000 para #350a06)
        rect = QRectF(0, 0, size, size)
        grad = QLinearGradient(0, 0, size, size)
        grad.setColorAt(0.0, QColor(53, 10, 6))
        grad.setColorAt(1.0, QColor(23, 0, 0))
        painter.setBrush(QBrush(grad))
        painter.setPen(Qt.NoPen)
        painter.drawRect(rect)
        padding_ratio = 0.25  # Mais padding para maskable safe zone
        
    # Renderizar SVG do Estetoscópio
    padding = size * padding_ratio
    svg_rect = QRectF(padding, padding, size - 2*padding, size - 2*padding)
    
    svg_data = STETHOSCOPE_SVG_RAW.format(
        stroke_color=stroke_color,
        stroke_width=stroke_width,
        fill_color=fill_color
    ).encode('utf-8')
    
    renderer = QSvgRenderer(svg_data)
    renderer.render(painter, svg_rect)
    
    painter.end()
    
    # Converter QImage para PIL Image
    qimg_bytes = qimg.bits().asstring(size * size * 4)
    pil_img = Image.frombytes("RGBA", (size, size), qimg_bytes, "raw", "BGRA")
    return pil_img

def generate_all_icons():
    print("[+] Gerando icones do Estetoscopio no tom Burgundy / Garnet (#170000, #350a06, #56070c, #8f3d38, #cb7169)...")
    
    # 1. Salvar SVG limpo do Estetoscópio
    svg_content = STETHOSCOPE_SVG_RAW.format(
        stroke_color="#cb7169",
        stroke_width="2.2",
        fill_color="#cb7169"
    )
    
    os.makedirs("frontend/public", exist_ok=True)
    os.makedirs("frontend/public/icons", exist_ok=True)
    os.makedirs("assets", exist_ok=True)
    
    with open("frontend/public/stethoscope.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("  - frontend/public/stethoscope.svg atualizado")
    
    if os.path.exists("frontend/dist"):
        with open("frontend/dist/stethoscope.svg", "w", encoding="utf-8") as f:
            f.write(svg_content)
        print("  - frontend/dist/stethoscope.svg atualizado")
        
    # 2. Gerar PNGs de alta qualidade para PWA e Frontend
    img_512 = render_stethoscope_icon(512, bg_style="dark")
    img_512.save("frontend/public/icons/icon-512x512.png")
    print("  - frontend/public/icons/icon-512x512.png gerado")
    
    img_192 = render_stethoscope_icon(192, bg_style="dark")
    img_192.save("frontend/public/icons/icon-192x192.png")
    print("  - frontend/public/icons/icon-192x192.png gerado")

    img_apple = render_stethoscope_icon(180, bg_style="dark")
    img_apple.save("frontend/public/icons/apple-touch-icon.png")
    print("  - frontend/public/icons/apple-touch-icon.png gerado")

    img_maskable = render_stethoscope_icon(512, bg_style="maskable")
    img_maskable.save("frontend/public/icons/maskable-icon-512x512.png")
    print("  - frontend/public/icons/maskable-icon-512x512.png gerado")

    # copiar para dist se dist existir
    if os.path.exists("frontend/dist/icons"):
        img_512.save("frontend/dist/icons/icon-512x512.png")
        img_192.save("frontend/dist/icons/icon-192x192.png")
        img_apple.save("frontend/dist/icons/apple-touch-icon.png")
        img_maskable.save("frontend/dist/icons/maskable-icon-512x512.png")
        print("  - Copiado para frontend/dist/icons")

    # 3. Gerar arquivos .ico multi-resolução para favicon e executável do Windows
    sizes = [16, 32, 48, 64, 128, 256]
    ico_frames = [render_stethoscope_icon(s, bg_style="dark") for s in sizes]
    
    # Salvar favicon.ico
    ico_frames[0].save(
        "frontend/public/favicon.ico",
        format="ICO",
        append_images=ico_frames[1:],
        sizes=[(s, s) for s in sizes]
    )
    print("  - frontend/public/favicon.ico gerado")

    if os.path.exists("frontend/dist"):
        ico_frames[0].save(
            "frontend/dist/favicon.ico",
            format="ICO",
            append_images=ico_frames[1:],
            sizes=[(s, s) for s in sizes]
        )

    # Salvar assets/app_icon.ico e assets/app_icon.png para PyQt / PyInstaller
    ico_frames[0].save(
        "assets/app_icon.ico",
        format="ICO",
        append_images=ico_frames[1:],
        sizes=[(s, s) for s in sizes]
    )
    print("  - assets/app_icon.ico gerado")

    img_512.save("assets/app_icon.png")
    print("  - assets/app_icon.png gerado")

    img_512.save("assets/app_logo.png")
    print("  - assets/app_logo.png gerado")

    print("[+] Todos os icones do estetoscopio foram atualizados com o tom Burgundy / Garnet!")

if __name__ == "__main__":
    generate_all_icons()
