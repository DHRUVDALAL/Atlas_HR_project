import requests
import json
import uuid
import sys
import time

BASE_URL = "http://localhost:8001"
PASSWORD = "password123"

# Real seeded user emails
RECEPTION_EMAIL = "amsadmin@abhiyantatech.com"
HR_EMAIL = "Faisal.k@abhiyantatech.com"
L1_EMAIL = "Amol.S@abhiyantatech.com"
CEO_EMAIL = "umesh@abhiyantatech.com"

def get_token(email):
    print(f"Logging in as {email}...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"[FAILED] Login failed for {email}: {resp.text}")
        sys.exit(1)
    return resp.json()["token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def print_step(step_num, desc):
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {desc}")
    print(f"{'='*60}")

def main():
    print("Testing the entire Atlas HR System Locally...")
    
    # 1. Login
    recp_token = get_token(RECEPTION_EMAIL)
    hr_token = get_token(HR_EMAIL)
    l1_token = get_token(L1_EMAIL)
    ceo_token = get_token(CEO_EMAIL)

    print_step(1, "Receptionist creates a new applicant")
    candidate_payload = {
        "first_name": "John",
        "last_name": "Doe",
        "email": f"john.doe_{uuid.uuid4().hex[:6]}@example.com",
        "phone": "9876543210",
        "gender": "MALE",
        "date_of_birth": "1995-05-05",
        "current_address": "123 Tech Park",
        "city": "Pune",
        "state": "MH",
        "country": "India",
        "pincode": "411001"
    }
    
    # Send as multipart/form-data
    files = {
        "signature": ("signature.pdf", b"%PDF-1.4\n%EOF\n", "application/pdf")
    }
    data = {
        "payload": json.dumps({
            "personal_details": candidate_payload,
            "professional_details": {
                "total_experience": 2.5,
                "relevant_experience": 2.0,
                "employment_type": "FULL_TIME"
            },
            "declaration": {
                "declaration_accepted": True,
                "consent_accepted": True,
                "signed_date": "2026-08-06"
            }
        })
    }
    
    # Do not use auth_headers for multipart, requests sets the boundary automatically
    headers = {"Authorization": f"Bearer {recp_token}"}
    resp = requests.post(f"{BASE_URL}/api/applicants", data=data, files=files, headers=headers)
    
    if resp.status_code != 201:
        print(f"[FAILED] Creation failed: {resp.text}")
        sys.exit(1)
    
    candidate_id = resp.json()["data"]["candidate_id"]
    print(f"[SUCCESS] Created Applicant successfully. ID: {candidate_id}")

    print_step(2, "Receptionist forwards applicant to HR")
    resp = requests.post(f"{BASE_URL}/api/workflow/receptionist/forward/{candidate_id}", json={"remarks": "Ready for review"}, headers=auth_headers(recp_token))
    if resp.status_code != 200:
        print(f"[FAILED] Forward failed: {resp.text}")
        sys.exit(1)
    print("[SUCCESS] Applicant forwarded to HR.")

    print_step(3, "HR reviews and assigns Technical Round to L1 Panel")
    # Using SAP domain MM and 0-3 yrs experience bracket from seed data
    hr_payload = {
        "domain": "MM",
        "experience_bracket": "0-3 yrs",
        "number_of_tech_rounds": 1,
        "hr_status": "SELECT",
        "first_interviewer_email": L1_EMAIL,
        "evaluation_data": {"notes": "Looks promising"}
    }
    resp = requests.post(f"{BASE_URL}/api/workflow/hr/review/{candidate_id}", json=hr_payload, headers=auth_headers(hr_token))
    if resp.status_code != 200:
        print(f"[FAILED] HR Review failed: {resp.text}")
        sys.exit(1)
        
    assign_payload = {
        "candidate_id": candidate_id,
        "domain_code": "MM",
        "experience_bracket_code": "0-3 yrs",
        "assigned_interviewer": L1_EMAIL,
        "interview_round": 1
    }
    resp = requests.post(f"{BASE_URL}/api/interview/assign", json=assign_payload, headers=auth_headers(hr_token))
    if resp.status_code != 200:
        print(f"[FAILED] Interview Assignment failed: {resp.text}")
        sys.exit(1)
    print("[SUCCESS] HR successfully assigned candidate to L1 panel (MM, 0-3 yrs).")

    print_step(4, "L1 Panel fetches interview questions")
    resp = requests.get(f"{BASE_URL}/api/interview/questions/{candidate_id}?grouped=true", headers=auth_headers(l1_token))
    if resp.status_code != 200:
        print(f"[FAILED] Failed to get questions: {resp.text}")
        sys.exit(1)
        
    questions_data = resp.json().get("data", [])
    print(f"[SUCCESS] L1 loaded {len(questions_data)} topic categories of questions.")
    
    print_step(5, "L1 Panel submits technical evaluation and completes round")
    all_q_ids = []
    for category in questions_data:
        for q in category["questions"]:
            all_q_ids.append(q["id"])

    eval_data = {"ratings": {}}
    for qid in all_q_ids:
        eval_data["ratings"][str(qid)] = {"rating": 4, "comment": "Good knowledge."}

    submit_payload = {
        "status_selection": "COMPLETED",
        "remarks": "Candidate cleared technical round successfully.",
        "evaluation_data": eval_data,
        "next_interviewer_email": None # No more tech rounds, goes to CEO
    }

    # Technical round evaluate requires /api/workflow/technical/evaluate/{candidate_id}/{round_number}
    resp = requests.post(f"{BASE_URL}/api/workflow/technical/evaluate/{candidate_id}/1", json=submit_payload, headers=auth_headers(l1_token))
    if resp.status_code != 200:
        print(f"[FAILED] L1 Submission failed: {resp.text}")
        sys.exit(1)
    print("[SUCCESS] L1 Technical evaluation submitted.")

    print_step(6, "CEO verifies candidate in queue and submits final decision")
    resp = requests.get(f"{BASE_URL}/api/applicants/{candidate_id}", headers=auth_headers(ceo_token))
    status = resp.json()["data"]["status"]
    if status != "CEO_ROUND":
        print(f"[FAILED] Candidate is in {status}, expected CEO_ROUND")
        sys.exit(1)
    
    decision_payload = {
        "save_draft": False,
        "evaluation_data": {"ratings": {}},
        "remarks": "Approved for hire."
    }
    resp = requests.post(f"{BASE_URL}/api/workflow/ceo/evaluate/{candidate_id}", json=decision_payload, headers=auth_headers(ceo_token))
    if resp.status_code != 200:
        print(f"[FAILED] CEO Evaluate failed: {resp.text}")
        sys.exit(1)
    
    final_decision_payload = {
        "final_status": "SELECTED",
        "offered_ctc": 500000,
        "joining_date": "2026-09-01",
        "final_remarks": "Approved",
        "hr_discussion_notes": "Good fit",
        "approved_by": "CEO",
        "save_draft": False
    }
    resp = requests.post(f"{BASE_URL}/api/workflow/final-decision/{candidate_id}", json=final_decision_payload, headers=auth_headers(hr_token))
    if resp.status_code != 200:
        print(f"[FAILED] Final Decision failed: {resp.text}")
        sys.exit(1)
        
    print("[SUCCESS] CEO approved candidate and final decision recorded.")

    print_step(7, "HR generates and sends Offer Letter")
    offer_payload = {
        "candidate_id": candidate_id,
        "offered_ctc": 500000.0,
        "joining_date": "2026-09-01",
        "notes": "Generated by test script"
    }
    resp = requests.post(f"{BASE_URL}/api/offers", json=offer_payload, headers=auth_headers(hr_token))
    if resp.status_code != 200:
        print(f"[FAILED] Offer generation failed: {resp.text}")
        sys.exit(1)
        
    offer_id = resp.json()["data"]["offer_id"]
    
    resp = requests.post(f"{BASE_URL}/api/offers/{offer_id}/send", json={}, headers=auth_headers(hr_token))
    if resp.status_code != 200:
        print(f"[FAILED] Offer send failed: {resp.text}")
        sys.exit(1)
        
    print("[SUCCESS] Offer letter successfully generated and sent by HR!")
    
    print("\n*** ALL TESTS PASSED SUCCESSFULLY! THE ENTIRE WORKFLOW IS FUNCTIONAL! ***")

if __name__ == "__main__":
    main()
