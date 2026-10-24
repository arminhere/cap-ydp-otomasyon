import zipfile, re, io, xml.etree.ElementTree as ET

z = zipfile.ZipFile('documents/FORM01 - Ders Kayıt Formu_04062026120421.docx')
docXml = z.read('word/document.xml').decode('utf-8')

# Apply all replacements as in docx.ts
docXml = docXml.replace(
    '20…-20…', '2025-2026'
)

# Insert Student No after its colon
docXml = re.sub(
    r'(Öğrenci No[\s\S]*?<w:t>:<\/w:t><\/w:r>)',
    r'\1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> 231202099</w:t></w:r>',
    docXml, count=1
)

docXml = re.sub(
    r'(Adı Soyadı[\s\S]*?<w:t>:<\/w:t><\/w:r>)',
    r'\1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> Ali Demir</w:t></w:r>',
    docXml, count=1
)

docXml = re.sub(
    r'(ANADAL[\s\S]*?Fakültesi:<\/w:t><\/w:r>)',
    r'\1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> Teknoloji Fakültesi</w:t></w:r>',
    docXml, count=1
)

docXml = re.sub(
    r'(Bölümü\/Anabilim Dalı:<\/w:t><\/w:r>)',
    r'\1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> Elektrik-Elektronik Mühendisliği</w:t></w:r>',
    docXml, count=1
)

docXml = re.sub(
    r'(Tarih[\s\S]*?<w:t>:<\/w:t><\/w:r>)',
    r'\1<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve"> 25.10.2026</w:t></w:r>',
    docXml, count=1
)

docXml = re.sub(
    r'(Güz\s*:\s*<\/w:t>[\s\S]*?<w:t>)☐(<\/w:t>)',
    r'\1☑\2',
    docXml, count=1
)

def inject_cell(tc_xml, text, bold=False, center=False):
    bold_tag = "<w:b/>" if bold else ""
    run_xml = f'<w:r><w:rPr>{bold_tag}<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">{text}</w:t></w:r>'
    
    p_self = re.search(r'(<w:p\b[^>]*?)\/>', tc_xml)
    if p_self:
        jc_xml = '<w:pPr><w:jc w:val="center"/></w:pPr>' if center else ''
        return tc_xml[:p_self.start()] + p_self.group(1) + '>' + jc_xml + run_xml + '</w:p>' + tc_xml[p_self.end():]
    
    p_open = re.search(r'<\/w:p>', tc_xml)
    if p_open:
        return tc_xml[:p_open.start()] + run_xml + tc_xml[p_open.start():]
        
    return tc_xml

courses = [
    ("3301156", 4, "BİLGİSAYAR MÜHENDİSLİĞİNE GİRİŞ"),
    ("3301351", 4, "NESNEYE YÖNELİK PROG. DİLİ"),
    ("3301352", 4, "İŞLETİM SİSTEMLERİ"),
    ("3301354", 4, "VERİ YAPILARI VE UYGULAMALARI"),
]

rows = re.findall(r'<w:tr[\s>][\s\S]*?<\/w:tr>', docXml)
for i in range(len(courses)):
    rowIndex = 5 + i
    course = courses[i]
    oldRow = rows[rowIndex]
    cells = re.findall(r'<w:tc[\s>][\s\S]*?<\/w:tc>', oldRow)
    c1 = inject_cell(cells[0], course[0], bold=True)
    c2 = inject_cell(cells[1], str(course[1]), center=True)
    c3 = inject_cell(cells[2], course[2])
    new_row = oldRow.replace(cells[0], c1).replace(cells[1], c2).replace(cells[2], c3)
    docXml = docXml.replace(oldRow, new_row)

try:
    tree = ET.fromstring(docXml)
    print("ALL 4 COURSES + METADATA: 100% VALID XML!")
    # Save as a real test docx file
    import zipfile
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as out_z:
        for item in z.infolist():
            if item.filename == 'word/document.xml':
                out_z.writestr(item, docXml.encode('utf-8'))
            else:
                out_z.writestr(item, z.read(item.filename))
    with open('FORM01_PERFECT.docx', 'wb') as f:
        f.write(buf.getvalue())
    print("Successfully wrote FORM01_PERFECT.docx! Size:", len(buf.getvalue()))
except Exception as e:
    print("XML ERROR:", e)
