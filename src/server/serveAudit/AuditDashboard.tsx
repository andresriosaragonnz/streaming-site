export function AuditDashboard({ data }: any) {
  const { summary, auditResults, missingSegments } = data;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>R2 Folder Audit | iknowthatband</title>
        <link rel="stylesheet" href="/css/main.css" />
        <style>{`
          .audit-container { padding: 2rem; max-width: 1200px; margin: 0 auto; font-family: monospace; }
          .grid-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .card { background: #1e293b; padding: 1.25rem; border-radius: 8px; border: 1px solid #334155; }
          .card-title { font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.5rem; }
          .card-val { font-size: 1.8rem; font-weight: bold; }
          .text-ok { color: #4ade80; }
          .text-err { color: #f87171; }
          .audit-table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
          .audit-table th, .audit-table td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid #334155; }
          .audit-table th { background: #0f172a; color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; }
          .status-badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
          .badge-ok { background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
          .badge-err { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
          code { background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; color: #38bdf8; }
        `}</style>
      </head>
      <body style="background: #0f172a; color: #f8fafc; margin: 0;">
        <div class="audit-container">
          <header style="margin-bottom: 2rem;">
            <h1 style="margin: 0 0 0.5rem 0;">D1 vs R2 Segment Folder Audit</h1>
            <p style="color: #94a3b8; margin: 0;">
              Cross-referencing D1 segment hashes against Remote R2 bucket
              folder prefixes.
            </p>
          </header>

          <div class="grid-summary">
            <div class="card">
              <div class="card-title">D1 Records</div>
              <div class="card-val">{summary.totalSegments}</div>
            </div>
            <div class="card">
              <div class="card-title">Verified in R2</div>
              <div class="card-val text-ok">{summary.totalVerified}</div>
            </div>
            <div class="card">
              <div class="card-title">Missing Folders</div>
              <div class="card-val text-err">{summary.totalMissing}</div>
            </div>
            <div class="card">
              <div class="card-title">Remote R2 Folders</div>
              <div class="card-val">{summary.totalR2Folders}</div>
            </div>
          </div>

          <section>
            <h2 style="font-size: 1.2rem; margin-bottom: 1rem;">
              Segment Verification Detail
            </h2>
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Artist</th>
                  <th>Title</th>
                  <th>Expected Folder Prefix</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {auditResults.map((item) => (
                  <tr>
                    <td>
                      <code>{item.status}</code>
                    </td>
                    <td>{item.artistName}</td>
                    <td>{item.title}</td>
                    <td>
                      <code>{item.expectedFolder}</code>
                    </td>
                    <td>
                      {item.existsInR2 ? (
                        <span class="status-badge badge-ok">✓ PRESENT</span>
                      ) : (
                        <span class="status-badge badge-err">✗ MISSING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </body>
    </html>
  );
}
