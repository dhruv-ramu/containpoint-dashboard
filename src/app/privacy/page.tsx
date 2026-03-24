import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bone)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="mb-6">
          <Link href="/login" className="text-sm text-[var(--muted)] hover:underline">
            ← Back to login
          </Link>
        </p>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-[var(--muted)] mt-2 text-sm">
          Last updated: [Date]
        </p>
        <div className="mt-8 prose prose-sm max-w-none text-[var(--foreground)]">
          <p className="text-[var(--muted)]">
            [Your privacy policy content goes here.]
          </p>
          <p className="text-[var(--muted)] mt-4">
            Please contact your administrator to obtain the full privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
