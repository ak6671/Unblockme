# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# msg91
- Use MSG91 REST API approach (not client-side widget) for OTP integration. Confidence: 0.70
- MSG91 v5 OTP endpoints require template_id, mobile, and authkey as URL query parameters, not JSON body. Confidence: 0.65
- 24-character hex IDs (e.g., 6a103c145169a9af5d04f6c2) are Flow IDs — use the /flow endpoint with authkey as header and flow_id in JSON body, not the /otp endpoint. Confidence: 0.70
- For India: the DLT template ID must be approved on the MSG91 DLT platform and the flow's SMS content must match the registered DLT template exactly, or SMS delivery will fail with error 211. Confidence: 0.85

# firebase
See [firebase/taste.md](firebase/taste.md)
# workflow
- When running dev servers (e.g., nodemon) for debugging, use a persistent foreground process so the user can see live logs — avoid backgrounding with `&` and `sleep`. Confidence: 0.65

