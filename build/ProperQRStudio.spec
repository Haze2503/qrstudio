# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path

ROOT = Path(r"D:\Documents (D)\CODE PROJECTS\proper qr")

block_cipher = None

a = Analysis(
    [str(ROOT / "launcher.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        (str(ROOT / "index.html"), "."),
        (str(ROOT / "app.js"), "."),
        (str(ROOT / "styles.css"), "."),
        (str(ROOT / "manifest.webmanifest"), "."),
        (str(ROOT / "sw.js"), "."),
        (str(ROOT / "icon.svg"), "."),
        (str(ROOT / "README.md"), "."),
        (str(ROOT / "RELEASE_NOTES.md"), "."),
        (str(ROOT / "qrcode-generator.min.js"), "."),
    ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="ProperQRStudio",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
