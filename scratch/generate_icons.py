import os
from PIL import Image
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QPainter, QImage, QColor, QPen, QBrush, QLinearGradient
from PyQt5.QtCore import Qt, QRectF
from PyQt5.QtSvg import QSvgRenderer

# Iniciar QApplication em modo headless/gui para usar QSvgRenderer e QPainter
app = QApplication([])

# SVG do Estetoscópio em tom Garnet/Burgundy (#a6544d / #6e2d29 / #3d0407 / #0d0000)
STETHOSCOPE_SVG_RAW = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="{stroke_color}" stroke-width="{stroke_width}" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
  <circle cx="20" cy="10" r="2.5" fill="{fill_color}"/>
</svg>"""

# SVG do Logo Completo NOVA Medicina em tom Garnet Burgundy
LOGO_SVG_RAW = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="garnetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a6544d;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#6e2d29;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3d0407;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#6e2d29;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#230503;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="strongGlow">
      <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Shield Background -->
  <path d="M 100 20 L 160 45 L 160 100 Q 160 140, 100 170 Q 40 140, 40 100 L 40 45 Z" 
        fill="url(#shieldGrad)" opacity="0.35" filter="url(#glow)"/>
  
  <!-- Medical Cross (Modern) -->
  <g filter="url(#strongGlow)">
    <rect x="90" y="60" width="20" height="80" rx="6" fill="url(#garnetGrad)"/>
    <rect x="70" y="90" width="60" height="20" rx="6" fill="url(#garnetGrad)"/>
  </g>
  
  <!-- Certificate Document -->
  <g filter="url(#glow)">
    <rect x="125" y="50" width="45" height="60" rx="4" fill="none" stroke="url(#garnetGrad)" stroke-width="3"/>
    <line x1="132" y1="65" x2="163" y2="65" stroke="url(#garnetGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="132" y1="75" x2="163" y2="75" stroke="url(#garnetGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="132" y1="85" x2="155" y2="85" stroke="url(#garnetGrad)" stroke-width="2" stroke-linecap="round"/>
  </g>
  
  <!-- Stethoscope (Elegant) -->
  <g filter="url(#glow)" stroke="url(#garnetGrad)" stroke-width="4" fill="none" stroke-linecap="round">
    <path d="M 35 75 Q 25 60, 40 48"/>
    <circle cx="40" cy="42" r="6" fill="url(#garnetGrad)"/>
    <path d="M 40 48 L 40 90 Q 40 100, 50 100 L 70 100"/>
  </g>
  
  <!-- Health Monitor Pulse -->
  <g filter="url(#glow)" stroke="url(#garnetGrad)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 30 150 L 50 150 L 58 135 L 66 165 L 74 150 L 170 150"/>
  </g>
  
  <!-- Accent Elements -->
  <circle cx="100" cy="100" r="92" stroke="url(#garnetGrad)" stroke-width="2" fill="none" opacity="0.3"/>
  <circle cx="100" cy="100" r="85" stroke="url(#garnetGrad)" stroke-width="1" fill="none" opacity="0.2"/>
  
  <!-- Glow Dots -->
  <circle cx="145" cy="115" r="3" fill="url(#garnetGrad)" opacity="0.8" filter="url(#glow)"/>
  <circle cx="55" cy="115" r="3" fill="url(#garnetGrad)" opacity="0.8" filter="url(#glow)"/>
</svg>"""

def render_svg_to_pil(svg_string, width, height):
    """Renders any SVG string into a transparent PIL Image of given size."""
    qimg = QImage(width, height, QImage.Format_ARGB32)
    qimg.fill(Qt.transparent)
    
    painter = QPainter(qimg)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setRenderHint(QPainter.SmoothPixmapTransform)
    
    renderer = QSvgRenderer(svg_string.encode('utf-8'))
    renderer.render(painter, QRectF(0, 0, width, height))
    painter.end()
    
    qimg_bytes = qimg.bits().asstring(width * height * 4)
    return Image.frombytes("RGBA", (width, height), qimg_bytes, "raw", "BGRA")

def render_stethoscope_icon(size, stroke_color="#a6544d", stroke_width=2.2, fill_color="#a6544d", bg_style="dark", padding_ratio=0.18):
    """
    Renders a stethoscope icon in Garnet/Burgundy:
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
        pen = QPen(QColor(110, 45, 41, 200))       # Borda em #6e2d29
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
    
    qimg_bytes = qimg.bits().asstring(size * size * 4)
    return Image.frombytes("RGBA", (size, size), qimg_bytes, "raw", "BGRA")

def generate_all_icons():
    print("[+] Atualizando TODOS os icones, marcas d'agua e logos no tom Garnet Burgundy...")
    
    stethoscope_svg = STETHOSCOPE_SVG_RAW.format(
        stroke_color="#a6544d",
        stroke_width="2.2",
        fill_color="#a6544d"
    )
    
    os.makedirs("frontend/public", exist_ok=True)
    os.makedirs("frontend/public/icons", exist_ok=True)
    os.makedirs("assets", exist_ok=True)
    
    # 1. Salvar SVGs
    with open("frontend/public/stethoscope.svg", "w", encoding="utf-8") as f:
        f.write(stethoscope_svg)
    with open("frontend/public/logo.svg", "w", encoding="utf-8") as f:
        f.write(LOGO_SVG_RAW)
        
    print("  - SVGs (stethoscope.svg, logo.svg) salvos em frontend/public")

    # 2. Gerar PNGs das Logos (logo_light.png e logo_dark.png)
    logo_img_light = render_svg_to_pil(LOGO_SVG_RAW, 512, 512)
    logo_img_light.save("frontend/public/logo_light.png")
    
    logo_img_dark = render_svg_to_pil(LOGO_SVG_RAW, 512, 512)
    logo_img_dark.save("frontend/public/logo_dark.png")
    print("  - logo_light.png e logo_dark.png atualizados com nova paleta Garnet Burgundy")

    # 3. Gerar Ícones PWA
    img_512 = render_stethoscope_icon(512, bg_style="dark")
    img_512.save("frontend/public/icons/icon-512x512.png")
    
    img_192 = render_stethoscope_icon(192, bg_style="dark")
    img_192.save("frontend/public/icons/icon-192x192.png")

    img_apple = render_stethoscope_icon(180, bg_style="dark")
    img_apple.save("frontend/public/icons/apple-touch-icon.png")

    img_maskable = render_stethoscope_icon(512, bg_style="maskable")
    img_maskable.save("frontend/public/icons/maskable-icon-512x512.png")
    print("  - Icones PWA (192, 512, maskable, apple-touch) gerados com sucesso")

    # 4. Copiar para dist se existir
    if os.path.exists("frontend/dist"):
        os.makedirs("frontend/dist/icons", exist_ok=True)
        with open("frontend/dist/stethoscope.svg", "w", encoding="utf-8") as f:
            f.write(stethoscope_svg)
        with open("frontend/dist/logo.svg", "w", encoding="utf-8") as f:
            f.write(LOGO_SVG_RAW)
        logo_img_light.save("frontend/dist/logo_light.png")
        logo_img_dark.save("frontend/dist/logo_dark.png")
        img_512.save("frontend/dist/icons/icon-512x512.png")
        img_192.save("frontend/dist/icons/icon-192x192.png")
        img_apple.save("frontend/dist/icons/apple-touch-icon.png")
        img_maskable.save("frontend/dist/icons/maskable-icon-512x512.png")

    # 5. Favicon e Ícones da App Desktop/Assets
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
    logo_img_dark.save("assets/app_logo.png")

    print("[+] Sucesso! Todos os icones, favicons e logos PWA/Desktop foram atualizados!")

if __name__ == "__main__":
    generate_all_icons()
