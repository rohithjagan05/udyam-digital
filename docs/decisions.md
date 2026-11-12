# Decisions log

## D-001: Udyam district code "00" (step 0.4)
Date: 2026-11-11
Question: The README says Udyam district code 00 does not exist, but every row in the mock Udyam registry uses it.
Decision: The format check accepts district code 00. The mock registry returns these numbers as records, and the app labels them as test records. The real Udyam adapter (step 2.2) must reject district code 00, since real numbers never use it.
Reason: Rejecting 00 would break the mock data and the specimen certificates, which are needed for the pilot tests.
