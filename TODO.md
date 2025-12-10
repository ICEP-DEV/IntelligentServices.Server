# Profile Change OTP Implementation

## Tasks
- [ ] Modify `routes/UserProfile.js` PUT `/user/update` to generate and send OTP instead of directly updating the profile. Store pending changes temporarily.
- [ ] Add `generateProfileChangeOTP` and `verifyProfileChangeOTP` functions in `controllers/VerificationController.js`.
- [ ] Implement `routes/verifyProfileChange.js` with POST `/verify-profile-change` route.
- [ ] Update `server.js` to include the new verifyProfileChange route.
- [ ] Test the OTP generation and verification flow.
- [ ] Ensure proper error handling and OTP expiration (10 minutes like existing system).
