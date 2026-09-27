// Length of the codes Supabase emails (Authentication → Sign In / Providers →
// Email → "Email OTP Length"). Used for hints and placeholders; checks accept
// 6 to 10 digits so changing the Supabase setting never breaks sign-in.
export const EMAIL_CODE_LENGTH = 8;

export const EMAIL_CODE_PATTERN = /^\d{6,10}$/;

// e.g. "12345678"
export const EMAIL_CODE_PLACEHOLDER = "1234567890".slice(0, EMAIL_CODE_LENGTH);
