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
          Last updated: March 2026
        </p>

        <div className="mt-8 prose prose-sm max-w-none text-[var(--foreground)]">

          <h2>1. Overview</h2>
          <p>
            This Privacy Policy describes how ContainPoint collects, uses, and protects information
            in connection with its software platform for SPCC compliance management.
          </p>
          <p>
            ContainPoint is designed for use by organizations managing facility-level compliance
            data, including inspections, corrective actions, training records, and operational logs.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>2.1 Account Information</h3>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Role within your organization</li>
            <li>Authentication credentials (securely stored)</li>
          </ul>

          <h3>2.2 Customer Data</h3>
          <p>
            We collect and process data entered into the platform by users (“Customer Data”),
            including:
          </p>
          <ul>
            <li>Facility information and operational details</li>
            <li>Asset and containment records</li>
            <li>Inspection records and evidence (including uploaded files)</li>
            <li>Corrective actions and workflows</li>
            <li>Training and personnel records</li>
            <li>Incident and discharge logs</li>
            <li>Compliance documentation and plan data</li>
          </ul>

          <h3>2.3 Usage Data</h3>
          <p>
            We may collect limited technical and usage data, such as:
          </p>
          <ul>
            <li>Log data (timestamps, actions performed)</li>
            <li>Device and browser information</li>
            <li>IP address and session data</li>
          </ul>

          <h2>3. How We Use Information</h2>
          <p>We use information to:</p>
          <ul>
            <li>Provide and operate the ContainPoint platform</li>
            <li>Store, organize, and present compliance records</li>
            <li>Enable workflows such as inspections and corrective actions</li>
            <li>Generate reports and audit-ready documentation</li>
            <li>Improve system performance and reliability</li>
            <li>Maintain security and prevent misuse</li>
          </ul>

          <h2>4. Data Ownership and Control</h2>
          <p>
            Your organization retains ownership of all Customer Data entered into ContainPoint.
          </p>
          <p>
            ContainPoint acts as a processor of this data and uses it only to provide the service.
          </p>
          <p>
            Access to Customer Data is controlled by your organization through user roles and permissions.
          </p>

          <h2>5. Data Sharing</h2>
          <p>
            We do not sell Customer Data.
          </p>
          <p>
            We may share data only:
          </p>
          <ul>
            <li>With authorized users within your organization</li>
            <li>With service providers required to operate the platform (e.g., hosting, storage)</li>
            <li>When required by law or valid legal process</li>
          </ul>

          <h2>6. Data Storage and Security</h2>
          <p>
            We implement reasonable administrative, technical, and organizational measures to protect data,
            including:
          </p>
          <ul>
            <li>Access controls and role-based permissions</li>
            <li>Encryption of data in transit</li>
            <li>Secure storage infrastructure</li>
            <li>Audit logging of key actions</li>
          </ul>
          <p>
            While we take security seriously, no system can be guaranteed to be completely secure.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            Customer Data is retained for as long as your organization maintains an account with ContainPoint,
            unless otherwise requested.
          </p>
          <p>
            Certain records may be retained longer where required for system integrity, audit logging,
            or legal compliance.
          </p>

          <h2>8. User Responsibilities</h2>
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Ensuring that data entered into the platform is accurate and appropriate</li>
            <li>Managing access permissions within your organization</li>
            <li>Complying with applicable data protection laws and regulations</li>
          </ul>

          <h2>9. Third-Party Services</h2>
          <p>
            ContainPoint may rely on third-party infrastructure providers (such as cloud hosting and storage services)
            to operate the platform. These providers process data on our behalf under appropriate safeguards.
          </p>

          <h2>10. International Data Transfers</h2>
          <p>
            If data is processed outside your jurisdiction, we take reasonable steps to ensure appropriate protections
            are in place consistent with applicable laws.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Continued use of the platform after changes
            constitutes acceptance of the updated policy.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions regarding this Privacy Policy, please contact your system administrator or the ContainPoint team.
          </p>

        </div>
      </div>
    </div>
  );
}