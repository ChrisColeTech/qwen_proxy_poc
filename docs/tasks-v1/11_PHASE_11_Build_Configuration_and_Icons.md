**Goal:** Configure electron-builder for distribution and create application icons.

## Files to Create:
- `assets/icon.svg` (source icon) ✅
- `electron-builder.json` ✅
- `electron/assets/icons/win/icon.ico` ✅
- `electron/assets/icons/mac/icon.icns` ✅
- `electron/assets/icons/png/16x16.png` ✅
- `electron/assets/icons/png/32x32.png` ✅
- `electron/assets/icons/png/48x48.png` ✅
- `electron/assets/icons/png/64x64.png` ✅
- `electron/assets/icons/png/128x128.png` ✅
- `electron/assets/icons/png/256x256.png` ✅
- `electron/assets/icons/png/512x512.png` ✅
- `electron/assets/icons/png/1024x1024.png` ✅
- `frontend/public/icon-32.png` (copied from PNG assets) ✅

## Files to Modify:
- Root `package.json` (add dist scripts) ✅ Already has dist, dist:win, dist:mac, dist:linux
- `electron/src/main.ts` (update icon paths in createWindow and createTray) ✅

## Integration Points:
- electron-builder
- Platform-specific build tools
- Icon generation tools

## Tasks:

**1.) Objective:** design the application icon to be visually appealing and professional.

**2.) Icon Design & Creation:**
*   Create a new, modern SVG icon. 
*   Save the final design as `assets/icon.svg`.

**3.) Icon Conversion (Cross-Platform Approach):**
*   Convert the `assets/icon.svg` into the necessary formats for a cross-platform Electron application.
*   **Important:** Different platforms require different tools for optimal icon generation:
    *   **Windows & Linux:** Use ImageMagick for PNG and ICO generation
    *   **macOS:** Use Apple's native `sips` + `iconutil` for proper ICNS with retina support
*   **Required Formats & Locations:**
    *   **PNG (All Platforms):** Generate 8 sizes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512, 1024x1024) in `electron/assets/icons/png/`
    *   **ICO (Windows):** Create `electron/assets/icons/win/icon.ico` using ImageMagick (multi-resolution)
    *   **ICNS (macOS):** Create `electron/assets/icons/mac/icon.icns` using `sips` + `iconutil` (includes retina @2x variants)

**4.) Application Integration:**
*   **Electron Main Process:** Modify `electron/src/main.ts`. Update the `createWindow` function to use the new `.ico` or `.png` icon for the `BrowserWindow`. Also, update the `createTray` function to use platform-specific icons:
    ```typescript
    // In createWindow():
    const iconPath = process.platform === 'win32'
      ? path.join(__dirname, '../assets/icons/win/icon.ico')
      : path.join(__dirname, '../assets/icons/png/256x256.png');

    // In createTray():
    const trayIconPath = process.platform === 'darwin'
      ? path.join(__dirname, '../assets/icons/png/16x16.png')  // macOS tray is small
      : process.platform === 'win32'
      ? path.join(__dirname, '../assets/icons/win/icon.ico')
      : path.join(__dirname, '../assets/icons/png/32x32.png');
    ```
*   **Build Configuration:** Update `electron-builder.json` to point to the new icon files in `electron/assets/icons/` for the `win`, `mac`, and `linux` build targets:
    ```json
    {
      "win": { "icon": "electron/assets/icons/win/icon.ico" },
      "mac": { "icon": "electron/assets/icons/mac/icon.icns" },
      "linux": { "icon": "electron/assets/icons/png" }
    }
    ```

**5.) Verification:**
*   Run `npm run build` to ensure the code compiles without errors.


## Common Issues & Fixes:

- **Icon not embedding in Windows executable**
  - Verify icon.ico is actual ICO format (not renamed PNG)
  - Use ImageMagick to create proper ICO with multiple resolutions
  - electron-builder requires proper ICO structure with embedded sizes

- **macOS icon not showing or appearing as black dots**
  - IMPORTANT: Do NOT use ImageMagick to create ICNS files
  - Must use Apple's native `sips` + `iconutil` tools for proper ICNS generation
  - ImageMagick ICNS files may render incorrectly (black dots, wrong colors)
  - Proper ICNS requires iconset folder with specific naming (icon_16x16.png, icon_16x16@2x.png, etc.)
  - Must include retina @2x variants for high-DPI displays
  - Clear icon cache if needed: `sudo rm -rf /Library/Caches/com.apple.iconservices.store`

- **SVG not rendering correctly as PNG (black dots, wrong colors)**
  - Simplify SVG: remove complex gradients, transforms, or effects
  - Use solid colors instead of gradients for better ImageMagick compatibility
  - Test conversion: `magick icon.svg -resize 256x256 test.png && open test.png`

- **Build fails with "Cannot find main"**
  - Verify electron-builder.json extraMetadata.main points to correct path
  - Should be: "electron/dist/main.js"

- **Tray icon not found in built app**
  - Verify icon path in main.ts is relative to __dirname
  - Check that assets folder is included in electron-builder files array

## Validation:

- [x] Build succeeds for Windows (NSIS installer)
- [x] Build succeeds for macOS (DMG with x64 and arm64)
- [x] Build succeeds for Linux (AppImage and deb)
- [x] Installer installs correctly
- [x] App icon shows in taskbar/dock
- [x] Tray icon shows in system tray
- [x] All app features work in built version
- [x] electron-builder.json configured with all platforms
- [x] All icon sizes generated (8 PNG sizes)
- [x] Windows ICO created with ImageMagick (multi-resolution)
- [x] macOS ICNS created with sips + iconutil (proper retina support)
- [x] Frontend icon copied to frontend/public/icon-32.png

## Structure After Phase 11:

```bash
electron/
├── assets/
│   └── icons/
│       ├── win/
│       │   └── icon.ico
│       ├── mac/
│       │   └── icon.icns
│       └── png/
│           ├── 16x16.png
│           ├── 32x32.png
│           ├── 48x48.png
│           ├── 64x64.png
│           ├── 128x128.png
│           ├── 256x256.png
│           ├── 512x512.png
│           └── 1024x1024.png
frontend/
├── public/
│   └── icon-32.png
electron-builder.json
dist/ (build output)
```

```bash
#!/bin/bash

# Cross-Platform Icon Generation Script
# Generates all required icon formats from SVG source
#
# Requirements:
#   - ImageMagick (for PNG & Windows ICO generation)
#   - sips + iconutil (macOS only, for proper ICNS generation)
#
# Usage: Run from project root
#   bash docs/tasks/icon-generation.sh

set -e  # Exit on error

SVG_SOURCE="assets/icon.svg"
ICONS_BASE="electron/assets/icons"
PNG_DIR="${ICONS_BASE}/png"
WIN_DIR="${ICONS_BASE}/win"
MAC_DIR="${ICONS_BASE}/mac"
ICONSET_DIR="${MAC_DIR}/icon.iconset"

echo "Starting cross-platform icon generation..."
echo "Source: $SVG_SOURCE"

# Create directory structure
mkdir -p "$PNG_DIR" "$WIN_DIR" "$MAC_DIR"

# Generate PNG files at various sizes using ImageMagick
echo ""
echo "=== Generating PNG icons with ImageMagick ==="
magick "$SVG_SOURCE" -resize 16x16 "$PNG_DIR/16x16.png"
magick "$SVG_SOURCE" -resize 32x32 "$PNG_DIR/32x32.png"
magick "$SVG_SOURCE" -resize 48x48 "$PNG_DIR/48x48.png"
magick "$SVG_SOURCE" -resize 64x64 "$PNG_DIR/64x64.png"
magick "$SVG_SOURCE" -resize 128x128 "$PNG_DIR/128x128.png"
magick "$SVG_SOURCE" -resize 256x256 "$PNG_DIR/256x256.png"
magick "$SVG_SOURCE" -resize 512x512 "$PNG_DIR/512x512.png"
magick "$SVG_SOURCE" -resize 1024x1024 "$PNG_DIR/1024x1024.png"
echo "✓ PNG icons generated"

# Generate Windows ICO file (contains multiple sizes)
echo ""
echo "=== Generating Windows ICO with ImageMagick ==="
magick "$PNG_DIR/16x16.png" "$PNG_DIR/32x32.png" "$PNG_DIR/48x48.png" \
       "$PNG_DIR/64x64.png" "$PNG_DIR/128x128.png" "$PNG_DIR/256x256.png" \
       "$WIN_DIR/icon.ico"
echo "✓ Windows ICO created: $WIN_DIR/icon.ico"

# Generate macOS ICNS file using Apple's native tools
echo ""
echo "=== Generating macOS ICNS with sips + iconutil ==="
if command -v sips &> /dev/null && command -v iconutil &> /dev/null; then
    # Create iconset directory
    mkdir -p "$ICONSET_DIR"

    # Use sips to generate all required sizes with retina variants
    # Apple requires specific naming: icon_SIZExSIZE.png and icon_SIZExSIZE@2x.png
    sips -z 16 16 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_16x16.png"
    sips -z 32 32 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_16x16@2x.png"
    sips -z 32 32 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_32x32.png"
    sips -z 64 64 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_32x32@2x.png"
    sips -z 128 128 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_128x128.png"
    sips -z 256 256 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_128x128@2x.png"
    sips -z 256 256 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_256x256.png"
    sips -z 512 512 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_256x256@2x.png"
    sips -z 512 512 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_512x512.png"
    sips -z 1024 1024 "$PNG_DIR/1024x1024.png" --out "$ICONSET_DIR/icon_512x512@2x.png"

    # Convert iconset to ICNS using iconutil (proper Apple format)
    iconutil -c icns "$ICONSET_DIR" -o "$MAC_DIR/icon.icns"

    # Clean up iconset directory (optional - keep for debugging)
    # rm -rf "$ICONSET_DIR"

    echo "✓ macOS ICNS created: $MAC_DIR/icon.icns"
    echo "  (Includes retina @2x variants for high-DPI displays)"
else
    echo "⚠ sips/iconutil not found (macOS only)"
    echo "  Skipping ICNS generation - run this script on macOS to generate proper ICNS"
fi

# Copy icon for frontend title bar
echo ""
echo "=== Copying icon for frontend ==="
mkdir -p "frontend/public"
cp "$PNG_DIR/32x32.png" "frontend/public/icon-32.png"
echo "✓ Frontend icon: frontend/public/icon-32.png"

# Summary
echo ""
echo "==================================="
echo "Icon generation complete!"
echo "==================================="
echo "Generated files:"
echo "  • PNG icons (8 sizes):     $PNG_DIR/"
echo "  • Windows ICO:             $WIN_DIR/icon.ico"
if [ -f "$MAC_DIR/icon.icns" ]; then
    echo "  • macOS ICNS (proper):     $MAC_DIR/icon.icns"
else
    echo "  • macOS ICNS:              (not generated - run on macOS)"
fi
echo "  • Frontend icon:           frontend/public/icon-32.png"
echo ""
echo "Platform-specific notes:"
echo "  • Windows: Uses ImageMagick ICO (multi-resolution)"
echo "  • macOS: Uses Apple iconutil (proper ICNS with retina support)"
echo "  • Linux: Uses PNG files directly"
```