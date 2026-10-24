import zipfile, xml.etree.ElementTree as ET

# We will test the generated buffer
z = zipfile.ZipFile('test_direct.docx')
xml_data = z.read('word/document.xml')
try:
    ET.fromstring(xml_data)
    print("VALID XML!")
except Exception as e:
    print("INVALID XML:", e)
