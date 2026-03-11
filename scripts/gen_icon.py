from PIL import Image, ImageDraw
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "assets", "images")


def draw_navigation_icon(draw, size, glyph_color, bg_color=None, safe_zone=False):
    """Draw a Lucide-like navigation icon (paper-plane compass arrow).

    When safe_zone=True the glyph is drawn within the inner 66.67% of the
    canvas, which is the visible area of an Android adaptive icon.
    """
    if bg_color is not None:
        corner_radius = int(size * 0.22)
        draw.rounded_rectangle(
            [0, 0, size - 1, size - 1],
            radius=corner_radius,
            fill=bg_color,
        )

    # Android adaptive icons crop the outer ~16.7% on each side.
    # When safe_zone is True we scale and offset the glyph so it sits
    # inside the inner 66.67% of the canvas.
    if safe_zone:
        margin = size * (1 - 2 / 3) / 2          # ~17% each side
        inner = size * 2 / 3                      # visible portion
        def pt(rx, ry):
            return (int(margin + inner * rx), int(margin + inner * ry))
    else:
        def pt(rx, ry):
            return (int(size * rx), int(size * ry))

    # Main arrow triangle (pointing top-right)
    tip = pt(0.77, 0.23)
    left_base = pt(0.31, 0.46)
    right_base = pt(0.55, 0.70)
    draw.polygon([tip, left_base, right_base], fill=glyph_color)

    # Cutout center to mimic Lucide stroke style
    cutout_color = bg_color if bg_color is not None else (0, 0, 0, 0)
    inset_px = int((inner if safe_zone else size) * 0.062)
    tip_inner = (tip[0] - inset_px, tip[1] + inset_px)
    left_inner = (left_base[0] + inset_px, left_base[1] + inset_px)
    right_inner = (right_base[0] - inset_px, right_base[1] - inset_px)
    draw.polygon([tip_inner, left_inner, right_inner], fill=cutout_color)

    # Tail stem to match navigation glyph silhouette
    stem_w = int((inner if safe_zone else size) * 0.11)
    stem_h = int((inner if safe_zone else size) * 0.18)
    stem_x0 = pt(0.44, 0)[0]
    stem_y0 = pt(0, 0.56)[1]
    draw.rounded_rectangle(
        [stem_x0, stem_y0, stem_x0 + stem_w, stem_y0 + stem_h],
        radius=max(2, int(size * 0.02)),
        fill=glyph_color,
    )


def save_icons():
    # Palette aligned with current app branding/header icon
    brand_blue = (0, 122, 255, 255)
    white = (255, 255, 255, 255)
    slate = (15, 23, 42, 255)

    # 1. Main app icon (1024x1024)
    size = 1024
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_navigation_icon(ImageDraw.Draw(icon), size, glyph_color=white, bg_color=brand_blue)
    icon.save(os.path.join(BASE, "icon.png"))
    print("icon.png")

    # 2. Web favicon (256x256)
    icon.resize((256, 256), Image.LANCZOS).save(os.path.join(BASE, "favicon.png"))
    print("favicon.png")

    # 3. Splash icon (transparent background, blue glyph)
    splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_navigation_icon(
        ImageDraw.Draw(splash),
        1024,
        glyph_color=brand_blue,
        bg_color=None,
    )
    splash.save(os.path.join(BASE, "splash-icon.png"))
    print("splash-icon.png")

    # 4. Android adaptive foreground (white glyph, within safe zone)
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_navigation_icon(ImageDraw.Draw(fg), 1024, glyph_color=white, bg_color=None, safe_zone=True)
    fg.save(os.path.join(BASE, "android-icon-foreground.png"))
    print("android-icon-foreground.png")

    # 5. Android adaptive background
    Image.new("RGBA", (1024, 1024), brand_blue).save(
        os.path.join(BASE, "android-icon-background.png")
    )
    print("android-icon-background.png")

    # 6. Android monochrome (within safe zone)
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_navigation_icon(ImageDraw.Draw(mono), 1024, glyph_color=slate, bg_color=None, safe_zone=True)
    mono.save(os.path.join(BASE, "android-icon-monochrome.png"))
    print("android-icon-monochrome.png")

    print("\nDone!")

if __name__ == "__main__":
    save_icons()
