export default function AboutPage() {
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h1>About This App</h1>

      <p style={{ marginTop: "12px" }}>
        This is a simple community tool for reporting and finding lost or found pets
        in your area.
      </p>

      <h2 style={{ marginTop: "20px" }}>How it works</h2>
      <ul>
        <li>Submit a report for a lost or found animal</li>
        <li>The report appears instantly on the map</li>
        <li>Other users can click pins to view details</li>
      </ul>

      <h2 style={{ marginTop: "20px" }}>Real-time updates</h2>
      <p>
        The map updates automatically when new reports are added or removed.
      </p>

      <h2 style={{ marginTop: "20px" }}>Disclaimer</h2>
      <p>
        This is a community-driven MVP and is not affiliated with any official
        animal rescue organization.
      </p>
    </div>
  );
}