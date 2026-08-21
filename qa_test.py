import json
import sys
import uuid
import time
from urllib import request, error

BASE_URL = "http://localhost:8000"

def make_request(method, url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTPError {e.code}: {body}")
        return e.code, json.loads(body) if body else {}

def get_token(email):
    status, data = make_request("POST", f"{BASE_URL}/api/auth/login", {"email": email, "password": "ChangeMe!Admin123!"})
    if status != 200:
        print(f"Login failed for {email}: {data}")
        sys.exit(1)
    return data["token"]

print("=========================================================")
print("STEP 1: Create fresh candidate via DB")
print("=========================================================")
recp_token = get_token("reception@atlas.com")
hr_token = get_token("hr.admin@atlas.com")
l1_token = get_token("l1.panel@atlas.com")
ceo_token = get_token("admin@atlas.com")

import os, sys
sys.path.insert(0, os.path.abspath("backend") if os.path.exists("backend") else ".")
from database.connection import SessionLocal
from models.applicant import Applicant
db = SessionLocal()
candidate = Applicant(
    application_number=f"QA_{uuid.uuid4().hex[:8]}",
    first_name="API",
    last_name="TestCandidate",
    email=f"api_test_{uuid.uuid4()}@atlas.com",
    phone="9999999999",
    gender="MALE",
    date_of_birth="1995-05-05",
    current_address="Test St",
    city="Mumbai",
    state="MH",
    country="India",
    pincode="400001",
    status="RECEPTION_FORWARDED"
)
db.add(candidate)
db.commit()
db.refresh(candidate)
candidate_id = str(candidate.candidate_id)
print(f"Created candidate directly: {candidate_id}")


print("=========================================================")
print("STEP 2: Login as HR. Assign Domain MM, 0-3 yrs, L1.")
print("=========================================================")

hr_payload = {
    "domain": "MM",
    "experience_bracket": "0-3 yrs",
    "number_of_tech_rounds": 1,
    "hr_status": "SELECT",
    "first_interviewer_email": "l1.panel@atlas.com",
    "evaluation_data": {}
}
status, data = make_request("POST", f"{BASE_URL}/api/workflow/hr/review/{candidate_id}", hr_payload, hr_token)
assert status == 200, f"Failed HR review: {status}"
print("HR assigned MM, 0-3 yrs to L1 successfully.")


print("=========================================================")
print("STEP 3: Login as L1. Verify GET /api/interview/questions/{candidateId}")
print("=========================================================")

status, data = make_request("GET", f"{BASE_URL}/api/interview/questions/{candidate_id}?grouped=true", None, l1_token)
assert status == 200, f"Questions failed: {status}"
assert data.get("success") == True
questions = data.get("groups", [])
print(f"L1 received {len(questions)} topic categories for MM")
assert len(questions) > 0, "No questions loaded. The JSON is empty!"
print("JSON verified.")

print("=========================================================")
print("STEP 4: Rate EVERY question. Submit Evaluation.")
print("=========================================================")

# Extract all question IDs to rate them
all_q_ids = []
for category in questions:
    for q in category["questions"]:
        all_q_ids.append(q)

print("Rating all questions...")
eval_data = []
for i, q in enumerate(all_q_ids):
    eval_data.append({
        "topic_id": q["id"],
        "rating": 0 if i == 0 else 5,  # Give 0 rating to the first question
        "comment": "Looks good"
    })

submit_payload = {
    "responses": eval_data,
    "status_selection": "COMPLETED",
    "remarks": "Great MM candidate.",
    "next_interviewer_email": None
}
status, data = make_request("POST", f"{BASE_URL}/api/interview/submit/{candidate_id}", submit_payload, l1_token)
if status != 200:
    print(f"POST /api/interview/submit/{candidate_id} -> {status}")
assert status == 200, f"Submit failed: {status}"
print("Evaluation submitted. Candidate should be in CEO queue.")

print("=========================================================")
print("STEP 7: Verify candidate appears in CEO Queue")
print("=========================================================")

# Check candidate status
status, data = make_request("GET", f"{BASE_URL}/api/applicants/{candidate_id}", None, ceo_token)
assert status == 200
status_str = data["data"]["status"]
print(f"Candidate status is: {status_str}")
assert status_str == "CEO_ROUND", f"Status is not CEO_ROUND, got {status_str}"

# Verify CEO Queue endpoint
status, data = make_request("GET", f"{BASE_URL}/api/applicants?limit=500", None, ceo_token)
ceo_queue = [c for c in data["applicants"] if c["status"] == "CEO_ROUND"]
found = any(c["candidate_id"] == candidate_id for c in ceo_queue)
print(f"Is candidate visibly returned in CEO queue API? {found}")
assert found, "Candidate missing from CEO queue list!"

print("=========================================================")
print("SUCCESS: Full API Integration Test Passed! E2E verified.")
print("=========================================================")
