# Decisions log

## D-001: Udyam district code "00" (step 0.4)
Date: 2026-11-11
Question: The README says Udyam district code 00 does not exist, but every row in the mock Udyam registry uses it.
Decision: The format check accepts district code 00. The mock registry returns these numbers as records, and the app labels them as test records. The real Udyam adapter (step 2.2) must reject district code 00, since real numbers never use it.
Reason: Rejecting 00 would break the mock data and the specimen certificates, which are needed for the pilot tests.

## D-002: Check date for the pilot (steps 2.4 and 2.5)
Date: 2026-11-12
Decision: The pilot check date is 2026-07-15, as stated in the data pack README. It is used for the 90-day address-proof rule and for ID expiry.
Open: Today's date is 2026-11-12, so this may be a deliberate date for the case data or may need changing. Confirm before the pilot.

## D-003: Mismatches go to manual review (step 2.7)
Date: 2026-11-12
Decision: A mismatch between a certificate or ID and its registry never auto-approves or auto-rejects. It opens a review case. An admin approves, rejects or asks for a re-upload, with a note for the last two. The owner is asked to re-upload only the document that failed.
Reason: The case does not define a mismatch policy. A person decides, and the owner is not asked for more than needed (data minimisation).