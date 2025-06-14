from PIL import Image, ImageDraw
import os

def create_icon(size):
    # Create a new image with a white background
    image = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(image)
    
    # Draw a blue circle
    margin = size // 8
    draw.ellipse([margin, margin, size - margin, size - margin], fill='#2563eb')
    
    # Draw a white rectangle for the form
    form_margin = size // 4
    draw.rectangle([form_margin, form_margin, size - form_margin, size - form_margin], 
                  fill='white', outline='#2563eb', width=max(1, size // 32))
    
    # Draw form lines
    line_spacing = (size - 2 * form_margin) // 4
    for i in range(3):
        y = form_margin + line_spacing * (i + 1)
        draw.line([form_margin + size // 8, y, size - form_margin - size // 8, y], 
                 fill='#2563eb', width=max(1, size // 32))
    
    return image

# Generate icons of different sizes
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'icon{size}.png')

print("Icon files generated successfully!") 