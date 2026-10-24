import zipfile, re, xml.etree.ElementTree as ET

z = zipfile.ZipFile('documents/FORM01 - Ders Kayıt Formu_04062026120421.docx')
docXml = z.read('word/document.xml').decode('utf-8')

# Test replacement for student no, name, etc.
docXml = docXml.replace('20…-20…', '2025-2026')
docXml = re.sub(r'(Öğrenci No[\s\S]*?<w:t>:<\/w:t><\/w:r>)', r'\1<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve"> 231202099</w:t></w:r>', docXml, count=1)
docXml = re.sub(r'(Adı Soyadı[\s\S]*?<w:t>:<\/w:t><\/w:r>)', r'\1<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve"> Ali Demir</w:t></w:r>', docXml, count=1)

def inject_cell(tc_xml, text, bold=False, center=False):
    bold_tag = "<w:b/>" if bold else ""
    run_xml = f'<w:r><w:rPr>{bold_tag}<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">{text}</w:t></w:r>'
    
    # Check if there is an existing self-closing <w:p .../>
    p_self = re.search(r'(<w:p\b[^>]*?)\/>', tc_xml)
    if p_self:
        jc_xml = '<w:pPr><w:jc w:val="center"/></w:pPr>' if center else ''
        return tc_xml[:p_self.start()] + p_self.group(1) + '>' + jc_xml + run_xml + '</w:p>' + tc_xml[p_self.end():]
    
    # Check if there is an existing <w:p>...</w:p>
    p_open = re.search(r'<\/w:p>', tc_xml)
    if p_open:
        return tc_xml[:p_open.start()] + run_xml + tc_xml[p_open.start():]
        
    return tc_xml

rows = re.findall(r'<w:tr[\s>][\s\S]*?<\/w:tr>', docXml)
row5 = rows[5]
cells = re.findall(r'<w:tc[\s>][\s\S]*?<\/w:tc>', row5)
c1 = inject_cell(cells[0], '3301156', bold=True)
c2 = inject_cell(cells[1], '4', center=True)
c3 = inject_cell(cells[2], 'BİLGİSAYAR MÜHENDİSLİĞİNE GİRİŞ')
new_row = row5.replace(cells[0], c1).replace(cells[1], c2).replace(cells[2], c3)
docXml = docXml.replace(row5, new_row)

try:
    ET.fromstring(docXml)
    print('SUCCESS: XML IS 100% VALID!')
except Exception as e:
    print('ERROR:', e)
