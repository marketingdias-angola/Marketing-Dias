# Security Specification — Marketing Dias

## 1. Data Invariants
1. **No Seller Phone Numbers**: A listing MUST NEVER contain `phone`, `telefone`, `whatsapp`, or any contact fields (`hasOnly` enforces exact schema). All buyer inquiries route strictly to the single Admin WhatsApp (`943194189`).
2. **Single Administrator Authority**: Only the verified administrator (`domingosmeiodiajoao@gmail.com` with `email_verified == true`) can approve listings (`status: 'approved'`), modify any listing, or delete any listing.
3. **Identity & Ownership**: Non-admin sellers can only create listings with `authorId == request.auth.uid` and `status == 'pending'`. Sellers cannot self-approve their own listings.
4. **Immutable Audit Fields**: `authorId` and `createdAt` cannot change after creation. Timestamps `createdAt` and `updatedAt` must equal `request.time`.
5. **Terminal State Locking**: Once a listing reaches `status: 'sold'`, non-admin sellers cannot reopen or edit it.
6. **Bounded Resource Sizes**: Every string field has strict `.size()` limits, `province` must be one of the 21 provinces of Angola, and `imageData` is capped at 450,000 bytes.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Phone Field Injection**: Creating a listing with extra field `phone: "923000000"` or `whatsapp: "943000000"`.
2. **Self-Approval Escalation**: Non-admin seller creating a listing with `status: "approved"`.
3. **Admin Email Spoofing (Unverified)**: Request with `token.email == "domingosmeiodiajoao@gmail.com"` and `token.email_verified == false` attempting to approve a listing.
4. **Author Spoofing**: Seller creating a listing with `authorId` set to another user's UID.
5. **Unauthenticated Write**: Anonymous user attempting to create, update, or delete a listing.
6. **Blanket List Scraping of Pending Ads**: Unauthenticated user listing `/listings` without `where('status', '==', 'approved')`.
7. **Timestamp Forgery**: Client passing a custom past/future timestamp instead of `serverTimestamp()` (`request.time`).
8. **ID Poisoning**: Attempting to write to `/listings/` with an invalid or 1.5KB document ID containing special characters.
9. **Value Poisoning (Oversized Description / Image)**: Submitting a 2000-character description or 1MB `imageData` payload.
10. **Invalid Province Injection**: Submitting a listing with a non-Angolan or invented province string.
11. **Terminal State Bypass**: Non-admin seller attempting to update a listing whose existing `status` is `'sold'` back to `'approved'` or `'pending'`.
12. **Cross-Owner Deletion**: Non-admin seller attempting to delete another seller's listing.
