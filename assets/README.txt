ICON INSTRUCTIONS
=================

Place your app icon here as:  icon.ico

Requirements:
- File name:  icon.ico
- Format:     Windows ICO
- Size:       Must contain a 256x256 pixel image inside it
               (most ICO files contain multiple sizes: 16, 32, 48, 64, 128, 256)

HOW TO CREATE A FREE ICON
--------------------------

Option A — Use an online converter (easiest):
  1. Find or create a square PNG image (at least 256x256 pixels)
  2. Go to:  https://convertico.com  or  https://icoconvert.com
  3. Upload your PNG
  4. Select sizes: 16, 32, 48, 64, 128, 256
  5. Download the .ico file
  6. Rename it to  icon.ico
  7. Place it in this assets/ folder

Option B — Use a free tool:
  - GIMP (free): File → Export As → save as .ico
  - Paint.NET with the ICO plugin

If you skip this step:
  electron-builder will use the default Electron icon.
  The app will still build and install correctly — it just won't have your custom icon.
