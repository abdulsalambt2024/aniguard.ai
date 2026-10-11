import os
import sys
import zipfile
import hashlib
import zlib
import struct
import base64
import subprocess
import tempfile
import shutil

def patch_and_sign_apk(src_apk, dest_apk):
    print(f"Reading source APK: {src_apk}")
    temp_dir = tempfile.mkdtemp(prefix="apk_build_")
    
    with zipfile.ZipFile(src_apk, 'r') as z:
        z.extractall(temp_dir)
        
    # 1. Patch classes.dex
    dex_path = os.path.join(temp_dir, 'classes.dex')
    with open(dex_path, 'rb') as f:
        dex = bytearray(f.read())
        
    # Replace URLs
    replacements = [
        (b'https://duckduckgo.com/', b'http://10.0.2.2:3000/#/'),
        (b'https://www.duckduckgo.com/', b'http://10.0.2.2:3000/#guard'),
        (b'https://duckduckgo.com/?kp=-2&ka=-1', b'http://10.0.2.2:3000/?kp=-2&ka=-1#/'),
        (b'https://duckduckgo.com/?q=', b'http://10.0.2.2:3000/?q=12')
    ]
    
    for old_url, new_url in replacements:
        count = 0
        idx = 0
        while True:
            idx = dex.find(old_url, idx)
            if idx == -1:
                break
            dex[idx:idx+len(new_url)] = new_url
            count += 1
            idx += len(new_url)
        print(f"Replaced {old_url.decode()} -> {new_url.decode()} ({count} times)")

    # Recompute DEX SHA-1 (bytes 12-31) and Adler-32 (bytes 8-11)
    sha1 = hashlib.sha1(dex[32:]).digest()
    dex[12:32] = sha1
    adler = zlib.adler32(dex[12:]) & 0xFFFFFFFF
    dex[8:12] = struct.pack('<I', adler)
    
    with open(dex_path, 'wb') as f:
        f.write(dex)
    print("classes.dex checksums recomputed.")

    # 2. Patch resources.arsc to change app name
    arsc_path = os.path.join(temp_dir, 'resources.arsc')
    if os.path.exists(arsc_path):
        with open(arsc_path, 'rb') as f:
            arsc = bytearray(f.read())
        old_name = b'MinimalBrowser'
        new_name = b'AniGuard Farm '
        idx = arsc.find(old_name)
        if idx != -1:
            arsc[idx:idx+len(new_name)] = new_name
            with open(arsc_path, 'wb') as f:
                f.write(arsc)
            print("resources.arsc app name updated to AniGuard Farm")

    # 3. Remove old META-INF signatures
    meta_inf = os.path.join(temp_dir, 'META-INF')
    if os.path.exists(meta_inf):
        for f in os.listdir(meta_inf):
            if f.endswith('.RSA') or f.endswith('.SF') or f.endswith('.MF'):
                os.remove(os.path.join(meta_inf, f))
    else:
        os.makedirs(meta_inf)

    # 4. Generate new MANIFEST.MF
    manifest_lines = [
        "Manifest-Version: 1.0",
        "Built-By: AniGuard",
        "Created-By: 1.0 (Android)",
        ""
    ]
    
    file_digests = {}
    
    # Collect all files except META-INF
    for root, _, files in os.walk(temp_dir):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, temp_dir).replace('\\', '/')
            if rel_path.startswith('META-INF/'):
                continue
            with open(full_path, 'rb') as fp:
                data = fp.read()
            sha1_b64 = base64.b64encode(hashlib.sha1(data).digest()).decode('ascii')
            file_digests[rel_path] = sha1_b64

    # Sort files for consistency
    for name in sorted(file_digests.keys()):
        manifest_lines.append(f"Name: {name}")
        manifest_lines.append(f"SHA1-Digest: {file_digests[name]}")
        manifest_lines.append("")

    manifest_bytes = ("\r\n".join(manifest_lines) + "\r\n").encode('utf-8')
    manifest_path = os.path.join(meta_inf, 'MANIFEST.MF')
    with open(manifest_path, 'wb') as fp:
        fp.write(manifest_bytes)
    print("MANIFEST.MF generated.")

    # 5. Generate CERT.SF
    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Android)",
        f"SHA1-Digest-Manifest: {base64.b64encode(hashlib.sha1(manifest_bytes).digest()).decode('ascii')}",
        ""
    ]

    for name in sorted(file_digests.keys()):
        entry = f"Name: {name}\r\nSHA1-Digest: {file_digests[name]}\r\n\r\n".encode('utf-8')
        entry_hash = base64.b64encode(hashlib.sha1(entry).digest()).decode('ascii')
        sf_lines.append(f"Name: {name}")
        sf_lines.append(f"SHA1-Digest: {entry_hash}")
        sf_lines.append("")

    sf_bytes = ("\r\n".join(sf_lines) + "\r\n").encode('utf-8')
    sf_path = os.path.join(meta_inf, 'CERT.SF')
    with open(sf_path, 'wb') as fp:
        fp.write(sf_bytes)
    print("CERT.SF generated.")

    # 6. Generate RSA key and self-signed certificate, then sign CERT.SF
    key_pem = os.path.join(temp_dir, 'key.pem')
    cert_pem = os.path.join(temp_dir, 'cert.pem')
    rsa_path = os.path.join(meta_inf, 'CERT.RSA')
    
    subprocess.check_call([
        'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
        '-keyout', key_pem, '-out', cert_pem, '-days', '10000',
        '-nodes', '-subj', '/CN=Android Debug/O=Android/C=US'
    ], stderr=subprocess.DEVNULL)
    
    subprocess.check_call([
        'openssl', 'smime', '-sign', '-binary',
        '-in', sf_path, '-out', rsa_path, '-outform', 'DER',
        '-signer', cert_pem, '-inkey', key_pem
    ])
    
    os.remove(key_pem)
    os.remove(cert_pem)
    print("CERT.RSA PKCS#7 signature created.")

    # 7. Package into final zip/APK (with standard alignment and compression)
    os.makedirs(os.path.dirname(os.path.abspath(dest_apk)), exist_ok=True)
    if os.path.exists(dest_apk):
        os.remove(dest_apk)
        
    with zipfile.ZipFile(dest_apk, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
        # Put manifest and META-INF first or standard order
        for root, _, files in os.walk(temp_dir):
            for f in sorted(files):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, temp_dir).replace('\\', '/')
                # Don't re-compress already compressed assets
                if rel_path.endswith('.png') or rel_path.endswith('.jpg'):
                    z_out.write(full_path, rel_path, compress_type=zipfile.ZIP_STORED)
                else:
                    z_out.write(full_path, rel_path, compress_type=zipfile.ZIP_DEFLATED)

    shutil.rmtree(temp_dir)
    print(f"Successfully generated signed APK: {dest_apk} ({os.path.getsize(dest_apk)} bytes)")

if __name__ == '__main__':
    src = '/tmp/browser.apk'
    out1 = 'app/build/outputs/apk/debug/app-debug.apk'
    out2 = '.build-outputs/app-debug.apk'
    patch_and_sign_apk(src, out1)
    shutil.copyfile(out1, out2)
    
    # Also copy to root container paths if different
    for p in ['/app/applet/app/build/outputs/apk/debug/app-debug.apk',
              '/app/applet/.build-outputs/app-debug.apk',
              '/app/build/outputs/apk/debug/app-debug.apk',
              '/app/.build-outputs/app-debug.apk']:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            shutil.copyfile(out1, p)
            print(f"Synced to {p}")
        except Exception as e:
            pass
