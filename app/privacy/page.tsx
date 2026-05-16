export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        This page explains what information the Lost Pets Map collects, why we
        store it, and how the app works. We aim to be straightforward — sign-in
        uses a magic link (no passwords), and we do not sell your data.
      </p>

      <h2 className="text-xl font-semibold">1. Sign-in and ownership</h2>
      <p>
        You can browse the map without signing in. To <strong>submit a report</strong>,
        you must log in with your email. We send a one-time magic link — there is
        no password. Reports you create are linked to your account so you can
        edit or delete them while logged in and receive notifications about
        approved sightings on your reports.
      </p>
      <p>
        Use the same email address whenever you sign in to return to your reports
        and notifications.
      </p>

      <h2 className="text-xl font-semibold">2. What we store</h2>
      <p>When you use the app, we may store:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Reports</strong> — lost or found animals, including approximate
          location (map coordinates), animal type, optional name, and status
        </li>
        <li>
          <strong>Sightings</strong> — reports from others who think they saw a
          lost animal, including location and optional notes
        </li>
        <li>
          <strong>Device geolocation (optional)</strong> — when you choose
          &quot;Use my location&quot; for a sighting, we collect latitude and
          longitude from your device. This is optional; we do not use it for any
          purpose other than placing that sighting on the map.
        </li>
        <li>
          <strong>Uploaded images</strong> — photos you attach to a report or
          sighting
        </li>
        <li>
          <strong>Optional contact information</strong> — only if you choose to
          provide it on a report
        </li>
        <li>
          <strong>Descriptions</strong> — text you write about an animal or
          sighting
        </li>
        <li>
          <strong>Notification events</strong> — linked to your account when a
          sighting on your lost report is approved, so we can show you alerts
          in the app
        </li>
        <li>
          <strong>Hashed IP addresses</strong> — when you submit certain
          content, we store a one-way hash of your IP address for abuse
          prevention (see section 4). We do not store or display your raw IP
          address in the public app.
        </li>
        <li>
          <strong>Your sign-in session</strong> — managed by our auth provider
          when you use the magic link; we do not store passwords
        </li>
      </ul>
      <p>
        <strong>Geolocation (how it works):</strong> We only store map coordinates
        that you actively choose and submit with a report or sighting — not a
        continuous record of where your device is. If you tap{" "}
        <strong>Use my location</strong> for a sighting, your browser reads your
        position once at that moment to fill in the form; we do not track your
        GPS in the background or tie live location to your sign-in session. After
        you submit, those coordinates are kept only as part of that one report or
        sighting record.
      </p>

      <h2 className="text-xl font-semibold">3. Why we store it</h2>
      <p>We use this information to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Show reports and sightings on the map</strong> so the
          community can help lost pets
        </li>
        <li>
          <strong>Place reports and sightings accurately</strong> — including
          device geolocation when you choose to share it, so locations on the
          map reflect where the animal was reported or seen
        </li>
        <li>
          <strong>Run moderation</strong> — admins review sightings and
          flagged reports before or after they appear, to reduce spam and abuse
        </li>
        <li>
          <strong>Send in-app notifications</strong> to report owners when a
          sighting is approved
        </li>
        <li>
          <strong>Prevent abuse</strong> — rate limiting and duplicate or
          suspicious submissions
        </li>
        <li>
          <strong>Restore ownership context</strong> — so you can edit your own
          reports and see details meant for you (not the general public)
        </li>
      </ul>

      <h2 className="text-xl font-semibold">4. Abuse prevention and IP addresses</h2>
      <p>
        To limit spam and misuse, we store a <strong>hashed</strong> version of
        your IP address when you submit reports, sightings, or flags — not your
        exact IP in plain text. The hash is used for rate limiting and abuse
        detection on our side. It cannot reasonably be reversed to reveal your
        IP, and it is not shown publicly on the map or in popups.
      </p>

      <h2 className="text-xl font-semibold">5. What others can see</h2>
      <p>
        Reports on the map are visible to anyone using the site. Depending on
        the situation, sighting details may be limited for the public (for
        example, a generic message instead of exact coordinates) while report
        owners and moderators may see more. Contact details you add to a report
        are shown to people who open that report&apos;s details — only share
        what you are comfortable with.
      </p>

      <h2 className="text-xl font-semibold">6. Data retention</h2>
      <p>
        Reports and sightings stay available until they expire, are resolved,
        removed by moderation, or deleted by you while logged in. We may remove
        outdated or inactive content to keep the map useful. Security-related
        data such as hashed IPs may be kept for a limited time for abuse
        prevention.
      </p>

      <h2 className="text-xl font-semibold">7. Data sharing</h2>
      <p>
        We do not sell your data. We use Supabase and hosting providers to run
        the app; they process data on our behalf to store reports, images, and
        related records. We do not share your information with advertisers.
      </p>

      <h2 className="text-xl font-semibold">8. Your choices</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          While logged in, open <strong>Manage this report</strong> (or visit
          the edit page for your report) to update or remove it
        </li>
        <li>
          Sign out or clear site data on a device if you do not want that browser
          to stay signed in — sign in again with the same email to access your
          reports and notifications
        </li>
        <li>
          Open the <strong>Notifications</strong> page while logged in to view
          and clear unread alerts for your account
        </li>
        <li>
          When submitting a sighting, choose <strong>Pick on map</strong>{" "}
          instead of <strong>Use my location</strong> if you prefer not to share
          your device&apos;s geolocation
        </li>
      </ul>

      <h2 className="text-xl font-semibold">9. Contact</h2>
      <p>
        Questions about privacy or your data? Email us at{" "}
        <a
          href="mailto:lostpetsbelgium@gmail.com"
          className="text-blue-400 hover:underline"
        >
          lostpetsbelgium@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
