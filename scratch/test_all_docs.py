import sqlite3, zipfile, xml.etree.ElementTree as ET

conn = sqlite3.connect('prisma/dev.db')
cursor = conn.cursor()
cursor.execute("SELECT id, originalName, contentBytes FROM Document")
rows = cursor.fetchall()
for doc_id, name, content in rows:
    print(f"\n--- Testing document: {name} ({len(content)} bytes) ---")
    if name.endswith('.docx'):
        try:
            z = zipfile.ZipFile('test_tmp.docx', 'w')
            with open('test_tmp.docx', 'wb') as f:
                f.write(content)
            z = zipfile.ZipFile('test_tmp.docx')
            print("Zip valid: YES")
            xml_data = z.read('word/document.xml')
            try:
                ET.fromstring(xml_data)
                print("XML parse: VALID XML")
            except Exception as xe:
                print("XML parse: INVALID XML!", xe)
                # print error context
                pos = str(xe)
                print("Snippet around error:", xml_data[:1000])
        except Exception as e:
            print("Zip failed:", e)
    elif name.endswith('.pdf'):
        print("PDF header:", content[:20])
        if not content.startswith(b'%PDF'):
            print("INVALID PDF HEADER!")
