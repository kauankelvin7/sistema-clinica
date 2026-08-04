import os
from PIL import Image
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QPainter, QImage, QColor, QPen, QBrush, QLinearGradient
from PyQt5.QtCore import Qt, QRectF
from PyQt5.QtSvg import QSvgRenderer

# Iniciar QApplication em modo headless/gui para usar QSvgRenderer e QPainter
app = QApplication([])

# SVG do Estetoscópio em tom Garnet/Burgundy Escurecido (#a6544d / #6e2d29 / #3d0407)
STETHOSCOPE_SVG_RAW = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="{stroke_color}" stroke-width="{stroke_width}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
  <circle cx="20" cy="10" r="2.5" fill="{fill_color}"/>
</svg>"""

def render_stethoscope_icon(size, stroke_color="#a6544d", stroke_width=2.2, fill_color="#a6544d", bg_style="dark", padding_ratio=0.18):
    """
    Renders a stethoscope icon in Garnet/Burgundy 1 shade darker:
    #0d0000 -> #230503 -> #3d0407 -> #6e2d29 -> #a6544d
    """
    qimg = QImage(size, size, QImage.Format_ARGB32)
    qimg.fill(Qt.transparent)
    
    painter = QPainter(qimg)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setRenderHint(QPainter.SmoothPixmapTransform)
    
    if bg_style == "dark":
        # Fundo escuro (#0d0000 para #230503) com borda em #6e2d29
        rect = QRectF(0, 0, size, size)
        grad = QLinearGradient(0, 0, size, size)
        grad.setColorAt(0.0, QColor(35, 5, 3))     # #230503
        grad.setColorAt(1.0, QColor(13, 0, 0))     # #0d0000
        
        painter.setBrush(QBrush(grad))
        pen = QPen(QColor(110, 45, 41, 180))       # Borda em #6e2d29
        pen.setWidthF(max(1.5, size * 0.03))
        painter.setPen(pen)
        
        radius = size * 0.22  # Cantos arredondados suavizados
        margin = size * 0.02
        painter.drawRoundedRect(rect.adjusted(margin, margin, -margin, -margin), radius, radius)
        
    elif bg_style == "maskable":
        # Fundo totalmente preenchido sem cantos arredondados (#0d0000 para #230503)
        rect = QRectF(0, 0, size, size)
        grad = QLinearGradient(0, 0, size, size)
        grad.setColorAt(0.0, QColor(35, 5, 3))
        grad.setColorAt(1.0, QColor(13, 0, 0))
        painter.setBrush(QBrush(grad))
        painter.setPen(Qt.NoPen)
        painter.drawRect(rect)
        padding_ratio = 0.25
        
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
    print("[+] Gerando icones do Estetoscopio 1 tom mais escuro (#0d0000, #230503, #3d0407, #6e2d29, #a6544d)...")
    
    svg_content = STETHOSCOPE_SVG_RAW.format(
        stroke_color="#a6544d",
        stroke_width="2.2",
        fill_color="#a6544d"
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
        
    img_512 = render_stethoscope_icon(512, bg_style="dark")
    img_512.save("frontend/public/icons/icon-512x512.png")
    
    img_192 = render_stethoscope_icon(192, bg_style="dark")
    img_192.save("frontend/public/icons/icon-192x192.png")

    img_apple = render_stethoscope_icon(180, bg_style="dark")
    img_apple.save("frontend/public/icons/apple-touch-icon.png")

    img_maskable = render_stethoscope_icon(512, bg_style="maskable")
    img_maskable.save("frontend/public/icons/maskable-icon-512x512.png")

    if os.path.exists("frontend/dist/icons"):
        img_512.save("frontend/dist/icons/icon-512x512.png")
        img_192.save("frontend/dist/icons/icon-192x192.png")
        img_apple.save("frontend/dist/icons/apple-touch-icon.png")
        img_maskable.save("frontend/dist/icons/maskable-icon-512x512.png")

    sizes = [16, 32, 48, 64, 128, 256]
    ico_frames = [render_stethoscope_icon(s, bg_style="dark") for s in sizes]
    
    ico_frames[0].save(
        "frontend/public/favicon.ico",
        format="ICO",
        append_images=ico_frames[1:],
        sizes=[(s, s) for s in sizes]
    )

    if os.path.exists("frontend/dist"):
        ico_frames[0].save(
            "frontend/dist/favicon.ico",
            format="ICO",
            append_images=ico_frames[1:],
            sizes=[(s, s) for s in sizes]
        )

    ico_frames[0].save(
        "assets/app_icon.ico",
        format="ICO",
        append_images=ico_frames[1:],
        sizes=[(s, s) for s in sizes]
    )

    img_512.save("assets/app_icon.png")
    img_512.save("assets/app_logo.png")

    print("[+] Todos os icones foram atualizados no tom Burgundy 1 tom mais escuro!")

if __name__ == "__main__":
    generate_all_icons()
