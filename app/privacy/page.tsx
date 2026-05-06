export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        This Privacy Policy explains how we collect, use, and protect your data
        when you use the Lost Pets Map service.
      </p>

      <h2 className="text-xl font-semibold">1. Data We Collect</h2>
      <p>
        We collect only the information you voluntarily submit when creating a report:
      </p>
      <ul className="list-disc pl-6">
        <li>Location (approximate coordinates)</li>
        <li>Animal type and status (lost or found)</li>
        <li>Optional contact information</li>
        <li>Optional description and photo uploads</li>
      </ul>

      <p>
        Additionally, we collect a <strong>hashed version of your IP address </strong> 
        when you submit a report or flag content. This is used solely for security 
        and abuse prevention (e.g., rate limiting and spam protection). The hash 
        cannot be used to directly identify you.
      </p>

      <h2 className="text-xl font-semibold">2. How We Use Data</h2>
      <p>
        Data is used exclusively to display reports on the map and to enable
        communication between users regarding lost or found animals.
      </p>
      <p>
        Hashed IP data is used only for abuse prevention, such as limiting
        excessive submissions or detecting suspicious activity.
      </p>

      <h2 className="text-xl font-semibold">3. Data Retention</h2>
      <p>
        Reports are stored until they are deleted by the user or removed by
        the system. We may periodically remove outdated reports to keep the
        platform relevant and clean.
      </p>
      <p>
        Security-related data (such as hashed IPs) may be retained for a limited
        time for abuse prevention and system integrity.
      </p>

      <h2 className="text-xl font-semibold">4. Data Sharing</h2>
      <p>
        We do not sell, rent, or share your personal data with third parties.
      </p>

      <h2 className="text-xl font-semibold">5. Your Rights (GDPR)</h2>
      <p>
        Under GDPR, you have the right to request access, correction, or deletion
        of your data. You may also request removal of a report using its edit link.
      </p>

      <h2 className="text-xl font-semibold">6. Data Deletion</h2>
      <p>
        You can delete your report at any time using the unique edit/delete link
        provided when submitting a report.
      </p>

      <h2 className="text-xl font-semibold">7. Contact</h2>
      <p>
        For any privacy-related questions, contact: lostpetsbelgium@gmail.com
      </p>
    </main>
  );
}