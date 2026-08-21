import urllib.request
import json

payload = {
    "personal_details": {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@test.com",
        "phone": "1234567890",
        "gender": "MALE",
        "date_of_birth": "2000-01-01",
        "current_address": "Test Address",
        "city": "Test",
        "state": "Test",
        "country": "Test",
        "pincode": "123456",
        "domain": "PP"
    }
}

try:
    with open("test.pdf", "wb") as f:
        f.write(b"%PDF-1.4 test")

    import mimetypes
    import uuid

    boundary = uuid.uuid4().hex
    body = bytearray()
    
    # Payload
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(b'Content-Disposition: form-data; name="payload"\r\n\r\n')
    body.extend(json.dumps(payload).encode('utf-8'))
    body.extend(b'\r\n')
    
    # Signature
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(b'Content-Disposition: form-data; name="signature"; filename="test.pdf"\r\n')
    body.extend(b'Content-Type: application/pdf\r\n\r\n')
    body.extend(b'%PDF-1.4 test')
    body.extend(b'\r\n')
    
    body.extend(f'--{boundary}--\r\n'.encode('utf-8'))
    
    req = urllib.request.Request("http://localhost:8000/api/applicant", data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    
    response = urllib.request.urlopen(req)
    print(response.getcode())
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print(e)
