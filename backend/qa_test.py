import requests
import json
import sys
import uuid
import time

BASE_URL = "http://localhost:8000"

def get_token(email):
    # Depending on how auth works in testing, let's login
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "password"})
    if resp.status_code != 200:
        print(f"Login failed for {email}: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=========================================================")
print("STEP 1: Create fresh candidate")
print("=========================================================")
recp_token = get_token("reception@atlas.com")
hr_token = get_token("hr@atlas.com")
l1_token = get_token("l1.panel@atlas.com")
ceo_token = get_token("admin@atlas.com")

candidate_payload = {
    "first_name": "API",
    "last_name": "TestCandidate",
    "email": f"api_test_{uuid.uuid4()}@atlas.com",
    "phone": "9999999999",
    "gender": "MALE",
    "date_of_birth": "1995-05-05",
    "current_address": "Test St",
    "city": "Mumbai",
    "state": "MH",
    "country": "India",
    "pincode": "400001"
}
resp = requests.post(f"{BASE_URL}/api/applicants", json=candidate_payload)
assert resp.status_code == 201, f"Failed to create candidate: {resp.text}"
candidate_id = resp.json()["data"]["candidate_id"]
print(f"Created candidate: {candidate_id}")

# Forward to HR
resp = requests.post(f"{BASE_URL}/api/workflow/reception/forward/{candidate_id}", json={"remarks": "Go ahead"}, headers=auth_headers(recp_token))
assert resp.status_code == 200, f"Failed to forward to HR: {resp.text}"
print("Candidate forwarded to HR")

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
resp = requests.post(f"{BASE_URL}/api/workflow/hr/review/{candidate_id}", json=hr_payload, headers=auth_headers(hr_token))
assert resp.status_code == 200, f"Failed HR review: {resp.text}"

# The frontend code also explicitly hits /api/interview/assign
assign_payload = {
    "candidate_id": candidate_id,
    "domain_code": "MM",
    "experience_bracket_code": "0-3 yrs",
    "assigned_interviewer": "l1.panel@atlas.com",
    "interview_round": 1
}
resp = requests.post(f"{BASE_URL}/api/interview/assign", json=assign_payload, headers=auth_headers(hr_token))
assert resp.status_code == 200, f"Failed interview assign: {resp.text}"
print("HR assigned MM, 0-3 yrs to L1 successfully.")


print("=========================================================")
print("STEP 3: Login as L1. Verify GET /api/interview/questions/{candidateId}")
print("=========================================================")

resp = requests.get(f"{BASE_URL}/api/interview/questions/{candidate_id}?grouped=true", headers=auth_headers(l1_token))
assert resp.status_code == 200, f"Questions failed: {resp.text}"
data = resp.json()
assert data.get("success") == True
questions = data.get("data", [])
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
        all_q_ids.append(q["id"])

print(f"Total questions to rate: {len(all_q_ids)}")

eval_data = {"ratings": {}}
for qid in all_q_ids:
    eval_data["ratings"][str(qid)] = {"rating": 5, "comment": "Excellent answer."}

submit_payload = {
    "status_selection": "COMPLETED",
    "remarks": "Great MM candidate.",
    "evaluation_data": eval_data,
    "next_interviewer_email": None
}

resp = requests.post(f"{BASE_URL}/api/interview/submit/{candidate_id}", json=submit_payload, headers=auth_headers(l1_token))
print(f"POST /api/interview/submit/{candidate_id} -> {resp.status_code}")
assert resp.status_code == 200, f"Submit failed: {resp.text}"
res_json = resp.json()
print("Success:", res_json)
assert res_json.get("success") == True

print("=========================================================")
print("STEP 7: Verify candidate appears in CEO Queue")
print("=========================================================")

# Check candidate status
resp = requests.get(f"{BASE_URL}/api/applicants/{candidate_id}", headers=auth_headers(ceo_token))
assert resp.status_code == 200
status = resp.json()["data"]["status"]
print(f"Candidate status is: {status}")
assert status == "CEO_ROUND", "Status is not CEO_ROUND"

# Verify CEO Queue endpoint
resp = requests.get(f"{BASE_URL}/api/applicants?limit=500", headers=auth_headers(ceo_token))
ceo_queue = [c for c in resp.json()["applicants"] if c["status"] == "CEO_ROUND"]
found = any(c["candidate_id"] == candidate_id for c in ceo_queue)
print(f"Is candidate visibly returned in CEO queue API? {found}")
assert found, "Candidate missing from CEO queue list!"

print("=========================================================")
print("SUCCESS: Full API Integration Test Passed! E2E verified.")
print("=========================================================")
