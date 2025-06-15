# Landing Page Media Assets

This directory contains placeholder media assets for the CarHub landing page. Replace these files with actual content to complete the landing page design.

## Required Assets

### Hero Section

- **`hero-video.mp4`** - Full-screen background video
  - Recommended: Rolling night-time car meets, smooth panning shots
  - Format: MP4, optimized for web (H.264 codec)
  - Duration: 30-60 seconds (should loop seamlessly)
  - Resolution: 1920x1080 minimum, 4K preferred
  - File size: Keep under 20MB for performance

### Event Banner

- **`event-bg.jpg`** - Parallax background image
  - Content: Lit-up parking lot car meet scene
  - Format: JPEG, high quality
  - Resolution: 2560x1440 minimum for parallax effect
  - Aspect ratio: 16:9 or wider
  - File size: Under 2MB optimized

### 3D Model Demo

- **`/demo/r34.glb`** - Placeholder 3D car model (currently in fallback mode)
  - Content: Any premium car model (Nissan R34 GT-R recommended)
  - Format: GLB (optimized GLTF)
  - Polygon count: 50k-100k triangles max
  - Textures: PBR materials, 2K textures max
  - File size: Under 10MB
  - **Note**: Currently shows a professional placeholder until a real GLB file is uploaded

## Optimization Guidelines

### Video Optimization

```bash
# Use ffmpeg to optimize video for web
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart hero-video.mp4
```

### Image Optimization

- Use tools like `tinypng.com` or `squoosh.app`
- Maintain high quality for hero images
- Consider WebP format for better compression

### 3D Model Optimization

- Use Blender or similar tools to reduce polygon count
- Compress textures without losing quality
- Remove unnecessary materials or objects
- Use glTF-Transform for additional optimization

## File Structure

```
public/landing/
├── README.md           # This file
├── hero-video.mp4      # Hero background video (optional - fallback shows black)
├── event-bg.jpg        # Event banner background (optional - fallback shows gradient)
└── demo/
    └── r34.glb         # 3D car model demo (optional - shows professional placeholder)
```

## TODO: Additional Assets

- Social media icons for footer
- Additional car model variants
- Event photography gallery
- Brand assets and logos
- Testimonial profile photos
