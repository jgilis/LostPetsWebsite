export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        This page explains what information the Lost Pets Map collects, why we
        store it, and how the app works. We aim to be straightforward — no
        account system, no hidden tracking beyond what is needed to run the
        service safely.
      </p>

      <h2 className="text-xl font-semibold">1. No traditional accounts</h2>
      <p>
        You do not need to create an account, choose a password, or sign in to
        use the map. When you first use the app in your browser, we generate a
        random <strong>owner token</strong> and save it in your browser&apos;s{" "}
        <strong>localStorage</strong>. That token stays on your device unless
        you clear your browser data.
      </p>
      <p>
        If you submit a lost-pet report, we link that report to your owner
        token so you can edit it later and receive notifications about
        sightings. The token is not a password — anyone with access to your
        browser could act as you on this device.
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
          <strong>Notification events</strong> — linked to your owner token when
          a sighting on your lost report is approved, so we can show you alerts
          in the app
        </li>
        <li>
          <strong>Hashed IP addresses</strong> — when you submit certain
          content, we store a one-way hash of your IP address for abuse
          prevention (see section 4). We do not store or display your raw IP
          address in the public app.
        </li>
        <li>
          <strong>Your owner token (on your device)</strong> — stored in
          localStorage in your browser, not on our servers as a login session
        </li>
      </ul>

      <h2 className="text-xl font-semibold">3. Why we store it</h2>
      <p>We use this information to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Show reports and sightings on the map</strong> so the
          community can help lost pets
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
        removed by moderation, or deleted using your edit link. We may remove
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
          Use the <strong>edit link</strong> you receive when creating a report
          to update or remove it
        </li>
        <li>
          Clear your browser&apos;s site data to remove the owner token from
          localStorage — note that you may lose the ability to edit reports or
          see owner-only notifications on that device unless you still have your
          edit link
        </li>
        <li>
          Open the <strong>Notifications</strong> page to view and clear unread
          alerts linked to your owner token
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
