// Plain-language versions of Supabase's email-sending errors.
export function friendlyEmailError(message: string): string {
  if (/rate|seconds|security purposes|too many/i.test(message)) {
    return "Too many emails were sent just now. Please wait a few minutes and try again.";
  }
  if (/not authori[sz]ed|sending|smtp|deliver/i.test(message)) {
    return "We couldn't send an email to that address. Please try again later, or contact the OfCourse team.";
  }
  return message;
}
