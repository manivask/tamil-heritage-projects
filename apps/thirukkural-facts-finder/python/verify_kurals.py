#!/usr/bin/env python3
# Script Designer / AI Prompt Engineer : Manivasagam Karunakaran
"""
Verify Thirukkural dataset integrity.
Asserts that there are exactly 1330 kurals, 133 chapters (grouped by number),
10 kurals per chapter, and that all required translation/explanation keys are populated.
Safe for Windows consoles.
"""

import json
import os
import sys

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.abspath(os.path.join(script_dir, "..", "data", "thirukkural.json"))
    
    print(f"[*] Verifying dataset file: {json_path}")
    if not os.path.exists(json_path):
        print(f"[!] Error: File does not exist at {json_path}", file=sys.stderr)
        sys.exit(1)
        
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        kurals = data.get("kurals", [])
        total_count = len(kurals)
        print(f"[+] Loaded {total_count} kurals.")
        
        # Assertion 1: Total count must be 1330
        assert total_count == 1330, f"Expected 1330 kurals, found {total_count}"
        print("[+] PASS: Total Kural count is exactly 1330.")
        
        # Assertion 2: Check required fields in each kural
        required_fields = ['number', 'kural', 'chapter', 'section', 'meaning']
        required_meaning_keys = ['ta_mu_va', 'ta_salamon', 'ta_kalaignar', 'en']
        
        chapters = {}
        sections = set()
        chapter_names = set()
        
        for k in kurals:
            num = k.get("number")
            # Verify fields
            for field in required_fields:
                assert field in k, f"Kural {num} is missing required field '{field}'"
            
            meaning = k.get("meaning", {})
            for m_key in required_meaning_keys:
                assert m_key in meaning, f"Kural {num} meaning is missing key '{m_key}'"
                assert meaning[m_key], f"Kural {num} meaning key '{m_key}' is empty or null"
            
            # Compute chapter number (1 to 133)
            chap_num = (num - 1) // 10 + 1
            sections.add(k["section"])
            chapter_names.add(k["chapter"])
            
            if chap_num not in chapters:
                chapters[chap_num] = {
                    "name": k["chapter"],
                    "section": k["section"],
                    "kurals": []
                }
            chapters[chap_num]["kurals"].append(k)
            
        print("[+] PASS: All Kurals contain required fields and explanation keys.")
        print(f"[+] Total distinct sections: {len(sections)}")
        print(f"[+] Total distinct chapter names: {len(chapter_names)} (expected 132 due to 'Kuripparithal' duplicate)")
        
        # Assertion 3: Exactly 133 chapters
        chap_count = len(chapters)
        assert chap_count == 133, f"Expected 133 chapters, found {chap_count}"
        print("[+] PASS: Total chapter count (by number) is exactly 133.")
        
        # Assertion 4: Exactly 10 kurals per chapter
        for chap_id, chap_info in chapters.items():
            k_len = len(chap_info["kurals"])
            assert k_len == 10, f"Chapter {chap_id} contains {k_len} kurals instead of 10"
            
        print("[+] PASS: Each chapter contains exactly 10 kurals.")
        
        # Validate that "குறிப்பறிதல்" is indeed the duplicate
        dup_names = {}
        for k in kurals:
            chap_num = (k["number"] - 1) // 10 + 1
            dup_names[k["chapter"]] = dup_names.get(k["chapter"], set())
            dup_names[k["chapter"]].add(chap_num)
            
        duplicates = {name: nums for name, nums in dup_names.items() if len(nums) > 1}
        print(f"[+] Verified Duplicate chapters count: {len(duplicates)}")
        assert len(duplicates) == 1, "Expected exactly 1 duplicate chapter name"
        
        print("\n[+] ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
        
    except AssertionError as ae:
        print(f"[!] Assertion failed: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[!] Unexpected error during verification: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
