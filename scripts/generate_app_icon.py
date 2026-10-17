import os
from PIL import Image, ImageDraw

def generate_zortex_icon(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = 20
    oct_pts = [
        (140, margin),
        (size - 140, margin),
        (size - margin, 140),
        (size - margin, size - 140),
        (size - 140, size - margin),
        (140, size - margin),
        (margin, size - 140),
        (margin, 140),
    ]
    draw.polygon(oct_pts, fill=(6, 10, 22, 255), outline=(0, 243, 255, 255))

    for offset in range(1, 10):
        pts = []
        for x, y in oct_pts:
            nx = x + (offset if x < size // 2 else -offset)
            ny = y + (offset if y < size // 2 else -offset)
            pts.append((nx, ny))
        col = (0, 243, 255, 255) if offset < 6 else (255, 0, 85, 220)
        draw.polygon(pts, outline=col)

    inner_m = 48
    inner_pts = [
        (155, inner_m),
        (size - 155, inner_m),
        (size - inner_m, 155),
        (size - inner_m, size - 155),
        (size - 155, size - inner_m),
        (155, size - inner_m),
        (inner_m, size - 155),
        (inner_m, 155),
    ]
    draw.polygon(inner_pts, fill=(10, 16, 34, 255), outline=(30, 64, 110, 255))

    wing_left = [(256, 95), (95, 355), (185, 330), (256, 210)]
    wing_right = [(256, 95), (417, 355), (327, 330), (256, 210)]
    draw.polygon(wing_left, fill=(255, 0, 85, 255), outline=(255, 180, 200, 255))
    draw.polygon(wing_right, fill=(210, 0, 70, 255), outline=(255, 180, 200, 255))

    blade_left = [(256, 70), (135, 315), (210, 295), (256, 155)]
    blade_right = [(256, 70), (377, 315), (302, 295), (256, 155)]
    draw.polygon(blade_left, fill=(0, 243, 255, 255))
    draw.polygon(blade_right, fill=(0, 195, 225, 255))

    fuselage = [(256, 56), (222, 280), (256, 395), (290, 280)]
    draw.polygon(fuselage, fill=(235, 245, 255, 255), outline=(0, 243, 255, 255))

    cockpit = [(256, 130), (238, 245), (256, 295), (274, 245)]
    draw.polygon(cockpit, fill=(12, 28, 48, 255), outline=(0, 243, 255, 255))

    plume_l = [(210, 330), (185, 430), (235, 375)]
    plume_r = [(302, 330), (327, 430), (277, 375)]
    plume_c = [(240, 360), (256, 455), (272, 360)]
    draw.polygon(plume_l, fill=(255, 180, 0, 255))
    draw.polygon(plume_r, fill=(255, 180, 0, 255))
    draw.polygon(plume_c, fill=(255, 235, 80, 255))

    png_path = os.path.join(output_dir, "icon.png")
    ico_path = os.path.join(output_dir, "icon.ico")
    img.save(png_path, format="PNG")
    img.save(
        ico_path,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    print(f"Generated icons: {png_path}, {ico_path}")

if __name__ == "__main__":
    generate_zortex_icon(os.path.join("desktop", "icons"))
