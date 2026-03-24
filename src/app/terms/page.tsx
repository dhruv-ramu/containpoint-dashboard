import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--bone)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="mb-6">
          <Link href="/login" className="text-sm text-[var(--muted)] hover:underline">
            ← Back to login
          </Link>
        </p>

        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Terms of Service
        </h1>

        <p className="text-[var(--muted)] mt-2 text-sm">
          Last updated: March 2026
        </p>

        <div className="mt-8 prose prose-sm max-w-none text-[var(--foreground)]">

          <h2>1. Overview</h2>
          <p>
            These Terms of Service (“Terms”) govern your access to and use of ContainPoint,
            a software platform for managing SPCC (Spill Prevention, Control, and Countermeasure)
            compliance workflows, documentation, and operational records.
          </p>
          <p>
            By accessing or using ContainPoint, you agree to be bound by these Terms. If you do not agree,
            you may not use the platform.
          </p>

          <h2>2. Nature of the Service</h2>
          <p>
            ContainPoint provides tools to help organizations track, manage, and document compliance-related
            activities, including inspections, corrective actions, training, and plan records.
          </p>
          <p>
            ContainPoint does not provide legal, regulatory, or engineering certification. The platform is intended
            to assist operational compliance but does not guarantee regulatory compliance or legal sufficiency.
          </p>

          <h2>3. User Accounts and Access</h2>
          <p>
            Access to ContainPoint is restricted to authorized users. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities conducted under your account.
          </p>
          <p>
            You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Use the platform only for legitimate business purposes</li>
            <li>Ensure appropriate access control within your organization</li>
          </ul>

          <h2>4. Data and Records</h2>
          <p>
            You retain ownership of all data entered into ContainPoint, including facility records, inspections,
            corrective actions, and documents (“Customer Data”).
          </p>
          <p>
            You are solely responsible for:
          </p>
          <ul>
            <li>The accuracy and completeness of Customer Data</li>
            <li>Ensuring records meet applicable regulatory requirements</li>
            <li>Maintaining independent backups where required by your organization or regulators</li>
          </ul>
          <p>
            ContainPoint may store, process, and organize Customer Data to provide the service.
          </p>

          <h2>5. Compliance Disclaimer</h2>
          <p>
            ContainPoint is a compliance management tool, not a substitute for regulatory expertise.
          </p>
          <p>
            You acknowledge that:
          </p>
          <ul>
            <li>Regulatory requirements may vary by jurisdiction and facility</li>
            <li>ContainPoint does not guarantee compliance with EPA or other regulations</li>
            <li>Final responsibility for compliance rests with the facility owner/operator</li>
          </ul>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the platform for unlawful or unauthorized purposes</li>
            <li>Attempt to gain unauthorized access to systems or data</li>
            <li>Interfere with platform performance or integrity</li>
            <li>Reverse engineer or copy the platform</li>
          </ul>

          <h2>7. Availability and Reliability</h2>
          <p>
            ContainPoint is provided on an “as is” and “as available” basis. While we aim for high availability,
            we do not guarantee uninterrupted service.
          </p>
          <p>
            Maintenance, updates, or unexpected issues may temporarily affect access.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, ContainPoint shall not be liable for:
          </p>
          <ul>
            <li>Regulatory penalties, fines, or enforcement actions</li>
            <li>Loss of data, business interruption, or operational errors</li>
            <li>Decisions made based on information within the platform</li>
          </ul>
          <p>
            Your use of the platform is at your own risk.
          </p>

          <h2>9. Intellectual Property</h2>
          <p>
            ContainPoint, including its software, design, and underlying technology, is owned by its operators
            and protected by applicable intellectual property laws.
          </p>
          <p>
            You are granted a limited, non-exclusive, non-transferable license to use the platform in accordance
            with these Terms.
          </p>

          <h2>10. Termination</h2>
          <p>
            Access to ContainPoint may be suspended or terminated if:
          </p>
          <ul>
            <li>You violate these Terms</li>
            <li>There is misuse of the platform</li>
            <li>Required payments (if applicable) are not made</li>
          </ul>

          <h2>11. Modifications</h2>
          <p>
            We may update these Terms from time to time. Continued use of the platform after changes constitutes
            acceptance of the updated Terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by applicable laws in the jurisdiction in which ContainPoint operates,
            without regard to conflict-of-law principles.
          </p>

          <h2>13. Contact</h2>
          <p>
            For questions regarding these Terms, please contact your system administrator or the ContainPoint team.
          </p>

        </div>
      </div>
    </div>
  );
}