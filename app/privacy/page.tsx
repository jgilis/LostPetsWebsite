export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        This page explains what information the Lost Pets Map collects, why we
        store it, and how the app works. Sign-in uses a magic link (no
        passwords). We do not sell your data.
      </p>

      <h2 className="text-xl font-semibold">1. Sign-in and ownership</h2>
      <p>
        You can browse the map without signing in. To{" "}
        <strong>submit a report</strong>, you must log in with your email. We
        send a one-time magic link. Reports you create are linked to your
        account so you can edit the name and description, mark a report as
        reunited, or delete it while logged in, and so you can receive
        notifications about approved sightings on your lost reports.
      </p>
      <p>
        Use the same email address whenever you sign in. Authentication email
        addresses are managed through our authentication provider and are not
        shown to other users.
      </p>

      <h2 className="text-xl font-semibold">2. What we store</h2>
      <p>When you use the app, we may store:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Reports</strong> — lost or found, including an approximate
          map location, animal type, optional name, description, status, and
          expiry date (about 120 days after submit)
        </li>
        <li>
          <strong>Sightings</strong> — reports from others who think they saw a
          lost animal, including location and optional notes. Sightings stay
          pending until a moderator approves them
        </li>
        <li>
          <strong>Device geolocation (optional)</strong> — only if you tap
          &quot;Use my location&quot; for a sighting. We read your position
          once for that form. We do not track you in the background
        </li>
        <li>
          <strong>Photos</strong> — optional images on a report. Report photos
          are re-encoded (which removes typical camera metadata such as EXIF)
          and then stored in a public image bucket. Anyone who has the image
          URL can open the file. The public app only shows those URLs on
          active or reunited reports
        </li>
        <li>
          <strong>Descriptions</strong> — text you write about an animal or
          sighting
        </li>
        <li>
          <strong>Notification events</strong> — linked to your account when a
          sighting on your lost report is approved
        </li>
        <li>
          <strong>Hashed IP addresses</strong> — for <em>sightings</em> and{" "}
          <em>flags</em> only, used for abuse prevention. Report submit does
          not store an IP hash
        </li>
        <li>
          <strong>Your sign-in session</strong> — managed by our auth provider.
          We do not store passwords
        </li>
      </ul>
      <p>
        The report form does not collect a public contact field. Do not put
        phone numbers or email addresses in the description unless you are
        comfortable with that text being public.
      </p>
      <p>
        <strong>Report location:</strong> you pick a point on the map. We store
        that point with a small random offset (on the order of tens of metres)
        so the public map is approximate, not the exact pin you chose.
        Sightings can store a more precise point for the report owner and
        moderators; other visitors see only that the animal was sighted nearby.
      </p>

      <h2 className="text-xl font-semibold">3. Why we store it</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Show lost and found reports on the public map and feed</li>
        <li>Let owners manage their own reports while logged in</li>
        <li>
          Let moderators review sightings and hide or resolve abusive reports
        </li>
        <li>
          Notify report owners in the app (and optionally by web push) when a
          sighting is approved
        </li>
        <li>Limit spam on sightings and flags</li>
      </ul>

      <h2 className="text-xl font-semibold">4. What others can see</h2>
      <p>
        Anyone using the site can see <strong>active</strong> reports on the
        map and <strong>active</strong> or <strong>reunited</strong> reports in
        the feed, including the approximate location, description, and photo if
        one was attached. Hidden, flagged, or expired reports are not listed
        there.
      </p>
      <p>
        Sighting pins and exact sighting coordinates are not shown to the
        public. Report owners and moderators can see more detail after a
        sighting is approved.
      </p>

      <h2 className="text-xl font-semibold">5. Retention and deletion</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>You delete a report</strong> — the listing is removed, and
          the stored photo file is deleted with it
        </li>
        <li>
          <strong>A moderator hides a report</strong> — it leaves the public
          map and feed, but the record and photo are kept for audit. That is
          not the same as deletion
        </li>
        <li>
          <strong>Reunited</strong> — the report leaves the map but can still
          appear in the reunited feed
        </li>
        <li>
          Reports also carry an expiry timestamp (about 120 days). Expired
          reports are not shown publicly
        </li>
      </ul>
      <p>
        Hashed IPs on sightings and flags may be kept for a limited time for
        abuse prevention.
      </p>

      <h2 className="text-xl font-semibold">6. Data sharing</h2>
      <p>
        We do not sell your data. We use Supabase and hosting providers to run
        the app. They store reports, images, and related records on our behalf.
        We do not share your information with advertisers.
      </p>

      <h2 className="text-xl font-semibold">7. Your choices</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          While logged in, open your report to edit the name or description,
          mark it reunited, or delete it permanently
        </li>
        <li>
          Sign out or clear site data if you do not want that browser to stay
          signed in
        </li>
        <li>
          Open <strong>Notifications</strong> while logged in to view alerts
          for your account
        </li>
        <li>
          For a sighting, choose <strong>Pick on map</strong> instead of{" "}
          <strong>Use my location</strong> if you do not want to share device
          GPS
        </li>
      </ul>

      <h2 className="text-xl font-semibold">8. Contact</h2>
      <p>
        Questions about privacy or your data? Email{" "}
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
