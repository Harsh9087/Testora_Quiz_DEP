import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("=== Starting End-to-End Test for Forms & Features ===")
    
    # 1. Login as teacher
    print("\n1. Logging in as Teacher...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "teacher@aegeus.edu",
        "password": "securepassword"
    })
    if login_res.status_code != 200:
        print(f"FAILED: Login failed: {login_res.status_code} {login_res.text}")
        sys.exit(1)
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Logged in as teacher.")

    # 2. Create Student Data Collection Form
    print("\n2. Creating Student Data Collection Form...")
    form_res = requests.post(f"{BASE_URL}/registration-forms", json={
        "title": "AIML 2026 Batch Test",
        "description": "Student Data Collection Form for AIML Division A"
    }, headers=headers)
    if form_res.status_code not in (200, 201):
        print(f"FAILED: Create form: {form_res.status_code} {form_res.text}")
        sys.exit(1)
    
    form_data = form_res.json()
    form_id = form_data["id"]
    share_slug = form_data["share_slug"]
    print(f"SUCCESS: Form created: ID={form_id}, Slug={share_slug}")

    # 3. Public fetch of the form (no auth)
    print("\n3. Testing Public Form Endpoint (No Auth)...")
    pub_res = requests.get(f"{BASE_URL}/registration-forms/public/{share_slug}")
    if pub_res.status_code != 200:
        print(f"FAILED: Public fetch: {pub_res.status_code} {pub_res.text}")
        sys.exit(1)
    pub_data = pub_res.json()
    assert pub_data["title"] == "AIML 2026 Batch Test"
    assert pub_data["is_active"] == True
    print(f"SUCCESS: Public metadata fetched for slug '{share_slug}'. Title='{pub_data['title']}'")

    # 4. Public Student Submission
    print("\n4. Testing Public Student Submission (No Auth)...")
    sub_payload = {
        "full_name": "Aarav Sharma",
        "email": f"aarav.{share_slug}@aegeus.edu",
        "roll_number": f"AIML-2026-{share_slug[:4]}",
        "contact_number": "+91 9876543210",
        "section": "A",
        "branch": "Artificial Intelligence & Data Science"
    }
    sub_res = requests.post(f"{BASE_URL}/registration-forms/public/{share_slug}/submit", json=sub_payload)
    if sub_res.status_code not in (200, 201):
        print(f"FAILED: Student submission: {sub_res.status_code} {sub_res.text}")
        sys.exit(1)
    sub_data = sub_res.json()
    print(f"SUCCESS: Submission received! ID={sub_data['id']}, Candidate={sub_data['full_name']}")

    # 5. Duplicate Check Test
    print("\n5. Testing Duplicate Submission Prevention...")
    dup_res = requests.post(f"{BASE_URL}/registration-forms/public/{share_slug}/submit", json=sub_payload)
    if dup_res.status_code in (400, 409):
        print(f"SUCCESS: Duplicate correctly blocked with {dup_res.status_code}: {dup_res.json()['detail']}")
    else:
        print(f"FAILED: Expected 400 or 409 for duplicate, got {dup_res.status_code}")
        sys.exit(1)

    # 6. Faculty Form Submissions List
    print("\n6. Fetching Faculty Submissions List...")
    list_res = requests.get(f"{BASE_URL}/registration-forms/{form_id}/submissions", headers=headers)
    if list_res.status_code != 200:
        print(f"FAILED: Get submissions: {list_res.status_code}")
        sys.exit(1)
    submissions = list_res.json()
    assert len(submissions) >= 1
    sub_id = submissions[0]["id"]
    print(f"SUCCESS: Found {len(submissions)} submission(s) for form.")

    # 7. Import to Directory Test
    print("\n7. Testing Import Submissions to Student Directory...")
    import_payload = {
        "submission_ids": [sub_id],
        "create_new_directory": True,
        "new_directory_name": f"AIML Batch {share_slug}"
    }
    import_res = requests.post(f"{BASE_URL}/registration-forms/{form_id}/import-to-directory", json=import_payload, headers=headers)
    if import_res.status_code != 200:
        print(f"FAILED: Import to directory: {import_res.status_code} {import_res.text}")
        sys.exit(1)
    import_data = import_res.json()
    print(f"SUCCESS: Import completed: {import_data['imported_count']} imported, {import_data['skipped_duplicate_count']} skipped.")

    # 8. Export to Excel (.xlsx) Test
    print("\n8. Testing Export to Excel (.xlsx)...")
    excel_res = requests.get(f"{BASE_URL}/registration-forms/{form_id}/export-excel", headers=headers)
    if excel_res.status_code != 200 or len(excel_res.content) < 100:
        print(f"FAILED: Excel export: {excel_res.status_code}, length={len(excel_res.content)}")
        sys.exit(1)
    print(f"SUCCESS: Excel file generated, size={len(excel_res.content)} bytes, Content-Type={excel_res.headers.get('content-type')}")

    # 9. AI Form Builder: Generate Custom Form from Prompt
    print("\n9. Testing AI Form Builder Prompt Generation...")
    ai_gen_res = requests.post(f"{BASE_URL}/custom-forms/generate", json={
        "prompt": "Create an AI Workshop feedback form with overall rating, what you liked, and topics for next session",
        "title": "AI Workshop Feedback"
    }, headers=headers)
    if ai_gen_res.status_code != 200:
        print(f"FAILED: AI Form Generation: {ai_gen_res.status_code} {ai_gen_res.text}")
        sys.exit(1)
    ai_form_data = ai_gen_res.json()
    print(f"SUCCESS: AI Form synthesized: Title='{ai_form_data['title']}', Fields Count={len(ai_form_data['fields'])}")

    # 10. Save and Publish Custom Form
    print("\n10. Saving and Publishing Custom Form...")
    save_res = requests.post(f"{BASE_URL}/custom-forms", json={
        "title": ai_form_data["title"],
        "description": ai_form_data.get("description", "Workshop Feedback"),
        "category": "feedback",
        "fields": ai_form_data["fields"],
        "is_published": True
    }, headers=headers)
    if save_res.status_code not in (200, 201):
        print(f"FAILED: Custom form save: {save_res.status_code} {save_res.text}")
        sys.exit(1)
    cform = save_res.json()
    cform_id = cform["id"]
    cform_slug = cform["share_slug"]
    print(f"SUCCESS: Custom Form published: ID={cform_id}, Slug={cform_slug}")

    # 11. Public Custom Form Fetch
    print("\n11. Testing Public Custom Form Fetch (No Auth)...")
    cpub_res = requests.get(f"{BASE_URL}/custom-forms/public/{cform_slug}")
    if cpub_res.status_code != 200:
        print(f"FAILED: Custom form public fetch: {cpub_res.status_code} {cpub_res.text}")
        sys.exit(1)
    cpub_data = cpub_res.json()
    print(f"SUCCESS: Public Custom Form loaded: '{cpub_data['title']}', {len(cpub_data['fields'])} fields.")

    # 12. Public Custom Form Submission
    print("\n12. Testing Public Custom Form Submission (No Auth)...")
    sample_answers = {}
    for f in cpub_data["fields"]:
        if f["field_type"] == "rating":
            sample_answers[f["id"]] = 5
        elif f["field_type"] == "number":
            sample_answers[f["id"]] = 10
        elif f["field_type"] in ["select", "radio"] and f.get("options"):
            sample_answers[f["id"]] = f["options"][0]
        else:
            sample_answers[f["id"]] = f"Sample answer for {f['label']}"
    
    csub_res = requests.post(f"{BASE_URL}/custom-forms/public/{cform_slug}/submit", json={
        "responses": sample_answers
    })
    if csub_res.status_code not in (200, 201):
        print(f"FAILED: Custom form submission: {csub_res.status_code} {csub_res.text}")
        sys.exit(1)
    print(f"SUCCESS: Custom form submitted! ID={csub_res.json()['id']}")

    # 13. Custom Form Submissions & Excel Export
    print("\n13. Testing Custom Form Submissions List & Excel Export...")
    csubs_res = requests.get(f"{BASE_URL}/custom-forms/{cform_id}/submissions", headers=headers)
    assert csubs_res.status_code == 200
    assert len(csubs_res.json()) >= 1

    cexcel_res = requests.get(f"{BASE_URL}/custom-forms/{cform_id}/export-excel", headers=headers)
    assert cexcel_res.status_code == 200
    assert len(cexcel_res.content) > 100
    print(f"SUCCESS: Custom form Excel export succeeded ({len(cexcel_res.content)} bytes).")

    print("\n=======================================================")
    print("ALL 13 END-TO-END FEATURE AND API TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
