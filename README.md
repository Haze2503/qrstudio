# Proper QR Studio

Proper QR Studio is a polished QR code generator with live preview, export tools, and multiple payload modes.

## Features

- Link, plain text, Wi-Fi, contact card, and image payload modes
- Live QR preview with color, size, and error-correction controls
- Center logo overlay support
- Save as PNG or SVG
- Copy QR image or raw payload to clipboard
- Recent payload history
- Installable PWA shell with offline caching

## Run it

Open `index.html` directly in a browser, or serve the folder locally for the PWA features:

```powershell
python -m http.server 8000 -d "d:\Documents (D)\CODE PROJECTS\proper qr"
```

Then open `http://127.0.0.1:8000/index.html`.

## Windows build

A packaged Windows executable is produced at `dist/ProperQRStudio.exe`.

You can rebuild it with:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "d:\Documents (D)\CODE PROJECTS\proper qr\build_exe.ps1"
```

## Files

- `index.html` - app shell and UI
- `app.js` - QR generation logic and interactions
- `styles.css` - layout and visual design
- `manifest.webmanifest` - installable app metadata
- `sw.js` - offline cache service worker
- `icon.svg` - app icon

## Notes

- Image payloads work best as small images or short data URLs because QR capacity is limited.
- Contact cards use vCard formatting.
- The app was built to run without a bundler.
