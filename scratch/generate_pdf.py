def create_valid_pdf(title, student_name, student_no):
    content_stream = f"""BT
/F1 16 Tf
50 740 Td
({title}) Tj
0 -30 Td
/F1 12 Tf
(Ogrenci No: {student_no}) Tj
0 -20 Td
(Ad Soyad: {student_name}) Tj
0 -20 Td
(Bolum: Bilgisayar Muhendisligi - CAP) Tj
0 -20 Td
(Donem: 2025-2026 Guz) Tj
0 -30 Td
/F1 11 Tf
(Dersler ve Notlar:) Tj
0 -20 Td
(3301156 Bilgisayar Muhendisligine Giris - 4 AKTS - Not: AA) Tj
0 -20 Td
(3301351 Nesneye Yonelik Prog. Dili - 4 AKTS - Not: BA) Tj
0 -20 Td
(3301352 Isletim Sistemleri - 4 AKTS - Not: BB) Tj
0 -20 Td
(3301354 Veri Yapilari ve Uygulamalari - 4 AKTS - Not: AA) Tj
0 -40 Td
(Belge Durumu: Resmi Onayli Transkript Belgesi) Tj
ET"""
    
    stream_bytes = content_stream.encode('ascii')
    stream_len = len(stream_bytes)
    
    body = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
{content_stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
"""
    # Calculate xref
    lines = body.split('\n')
    # Better: compute byte offsets
    pdf_parts = [
        b"%PDF-1.4\n",
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode('ascii') + stream_bytes + b"\nendstream\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    ]
    
    offsets = [0]
    total = 0
    for p in pdf_parts:
        total += len(p)
        offsets.append(total)
    
    xref_offset = total
    xref = b"xref\n0 6\n0000000000 65535 f \n"
    for i in range(1, 6):
        xref += f"{offsets[i-1]:010d} 00000 n \n".encode('ascii')
        
    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('ascii')
    
    pdf_bytes = b"".join(pdf_parts) + xref + trailer
    return pdf_bytes

if __name__ == '__main__':
    data = create_valid_pdf("SELCUK UNIVERSITESI - CAP TRANSKRIPT BELGESI", "Ali Demir", "231202099")
    with open('test_valid_transcript.pdf', 'wb') as f:
        f.write(data)
    print("Generated valid PDF! Length:", len(data))
