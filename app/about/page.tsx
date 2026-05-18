export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">About — beta</h1>

      <p>
        Lost Pets Map is a community tool for <strong>Mechelen</strong>: post lost
        or found animals, browse the map, and submit sightings on existing
        reports. You are using an early build — expect rough edges and changes.
      </p>

      <h2 className="text-xl font-semibold">Map</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-300">
        <li>
          <strong>Lost</strong> — pin markers (by animal type color)
        </li>
        <li>
          <strong>Found</strong> — small colored dots; light area halos appear
          when zoomed in (detail mode)
        </li>
        <li>
          Clustering at lower zoom; filters for animal type and lost/found
        </li>
        <li>
          Viewport is limited to the greater Mechelen region (not a global map)
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Reports &amp; sightings</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-300">
        <li>
          Browsing the map works without signing in; <strong>submitting a
          report</strong> requires email magic-link login (no password)
        </li>
        <li>
          Report location is chosen on the map; coordinates are stored with a
          small offset for privacy
        </li>
        <li>
          <strong>Sightings</strong> (“I saw this animal”) use optional GPS
          (one-time, on button press) or manual map pick — see{" "}
          <a href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </a>
        </li>
        <li>
          Sightings are reviewed before owners are notified; only{" "}
          <strong>active</strong> reports appear on the public map
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Realtime &amp; notifications</h2>
      <p className="text-gray-300">
        New and updated reports sync over Supabase Realtime where possible, with
        resync when you return to the tab. Report owners get in-app notifications
        when a sighting is approved; optional web push if enabled in the footer
        (PWA / HTTPS).
      </p>

      <h2 className="text-xl font-semibold">Admin (testers with access)</h2>
      <p className="text-gray-300">
        <a href="/admin" className="text-blue-400 hover:underline">
          /admin
        </a>{" "}
        — moderate reports (resolve, remove, flagged queue), approve/reject
        sightings, review coordinates outside the usual Mechelen bounds
        (highlighted in the UI). Access is gated by{" "}
        <code className="text-sm text-gray-400">profiles.is_admin</code> in
        Supabase.
      </p>

      <h2 className="text-xl font-semibold">What to test &amp; report</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-300">
        <li>Map interaction — especially found dots and popups on mobile</li>
        <li>Sign-in flow and editing your own reports</li>
        <li>Sighting submission (GPS vs pick on map) and owner notifications</li>
        <li>Stale data after tab switch or long session (should self-heal)</li>
        <li>Anything that looks public but should stay private (or vice versa)</li>
      </ul>
      <p className="text-gray-400 text-sm">
        Technical setup and repo layout: see{" "}
        <code className="text-gray-500">README.md</code> in the project root.
      </p>

      <h2 className="text-xl font-semibold">Disclaimer</h2>
      <p className="text-gray-300">
        Community-driven MVP — not an official animal rescue or government
        service. Use common sense when meeting strangers or sharing location
        details. See also{" "}
        <a href="/terms" className="text-blue-400 hover:underline">
          Terms of Use
        </a>
        .
      </p>
    </main>
  );
}
