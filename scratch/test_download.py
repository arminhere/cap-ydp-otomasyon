import urllib.request, sqlite3, json, hmac, hashlib, base64

conn = sqlite3.connect('prisma/dev.db')
cursor = conn.cursor()
cursor.execute("SELECT id, email, role FROM User WHERE role='COORDINATOR' LIMIT 1")
u_id, email, role = cursor.fetchone()

# Construct session token
secret = 'selcuk-cap-management-system-secret-key-2026-phase1'.encode('utf-8')
payload = json.dumps({'id': u_id, 'email': email, 'role': role, 'exp': 2000000000}).encode('utf-8')
encoded = base64.urlsafe_b64encode(payload).rstrip(b'=').decode('utf-8')
sig = base64.urlsafe_b64encode(hmac.new(secret, encoded.encode('utf-8'), hashlib.sha256).digest()).rstrip(b'=').decode('utf-8')
cookie_val = f'{encoded}.{sig}'

cursor.execute("SELECT id, originalName, mimeType FROM Document LIMIT 1")
doc_id, orig_name, mime = cursor.fetchone()

req = urllib.request.Request(f'http://localhost:3000/api/documents/{doc_id}/download')
req.add_header('Cookie', f'bmu2_session={cookie_val}')
try:
    res = urllib.request.urlopen(req)
    body = res.read()
    print('Status:', res.status)
    print('Content-Type:', res.headers.get('Content-Type'))
    print('Content-Disposition:', res.headers.get('Content-Disposition'))
    print('Body len:', len(body))

    with open('test_http.docx', 'wb') as f:
        f.write(body)

    import zipfile
    try:
        z = zipfile.ZipFile('test_http.docx')
        print('HTTP Zip test passed! Names:', z.namelist()[:5])
    except Exception as e:
        print('HTTP Zip test failed!', e)
except Exception as e:
    print('Request error:', e)
