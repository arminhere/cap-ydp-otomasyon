import sqlite3
from generate_pdf import create_valid_pdf

conn = sqlite3.connect('prisma/dev.db')
cursor = conn.cursor()

# 1. Update mock PDF with valid PDF
valid_pdf = create_valid_pdf('SELCUK UNIVERSITESI - RESMI CAP TRANSKRIPT BELGESI', 'Ali Demir', '231202099')
cursor.execute("UPDATE Document SET contentBytes = ?, sizeBytes = ? WHERE documentType = 'TRANSCRIPT'", (valid_pdf, len(valid_pdf)))

# 2. Update DOCX with the valid FORM01_PERFECT.docx
with open('FORM01_PERFECT.docx', 'rb') as f:
    perfect_docx = f.read()

cursor.execute("UPDATE Document SET contentBytes = ?, sizeBytes = ? WHERE originalName LIKE '%.docx'", (perfect_docx, len(perfect_docx)))

conn.commit()
print("Successfully updated broken documents in prisma/dev.db with 100% valid files!")
