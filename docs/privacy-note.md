# Data privacy and security note (Project Udyam Digital, pilot)

Version: 1.0 · Status: draft for review
Legal references to be checked against the official text of the Digital Personal Data Protection Act, 2023 before submission.

## 1. What we collect and why
We collect only what each step needs:
- Business name, GSTIN and Udyam number: to confirm the business is registered.
- Name and ID of the authorised signatory: to confirm the person acting for the business is authorised.
- Address proof: to confirm where the business operates. It must be dated within 90 days of the check.
- Photos of GST and Udyam certificates: to read the details and cross-check them against the registries.

We do not collect data we do not need for the service, such as personal bank details or the owner's personal address beyond the business address.

## 2. Consent and purpose
- The consent screen appears before any KYC step. No registry lookup or document upload happens before consent is recorded.
- Each consent is recorded with its version, language and time. The record cannot be edited.
- We use the data only for the purposes on the consent screen: verification and setting up the service.

## 3. Minimisation and sharing
- Verified details are stored once. Documents are not kept after the check.
- The owner decides, field by field, what each provider can see, and can revoke any field.
- Verification providers receive only the fields their check needs.

## 4. Security
- Data is encrypted in transit (TLS 1.2 or higher) and at rest for identifiers and documents.
- GSTIN and Udyam numbers show only the last 4 characters on screens and in logs.
- Access is by role. Admin views show masked identifiers by default.
- Documents are stored in a private bucket and deleted within 24 hours of the decision.
- Consent, KYC decisions and sharing changes are written to an audit log.
- No personal data is written to application logs.

## 5. Retention
- Certificate and address-proof images: deleted within 24 hours of the check decision.
- Verified details: kept for [RETENTION PERIOD, to be decided by the team].
- Consent records: kept as proof of consent for [PERIOD, to be decided by the team].
- The retention period is stated on the consent screen.

## 6. Your rights
You can withdraw consent, see your details, ask us to correct them, and ask us to delete them. Requests and complaints go to [GRIEVANCE CONTACT].

## 7. Test data in this pilot
- All businesses, people and identifiers in the pilot are fictional, from the Accel YTL Hackathon data pack.
- The registries are mocks. Udyam numbers with district code 00 are test records. Real Udyam numbers never use this code.
- No real customer data is processed in the prototype.

## 8. Not yet verified
- Live GST portal and Udyam API terms.
- DigiLocker and e-sign provider terms.
- The final retention periods and grievance contact.
