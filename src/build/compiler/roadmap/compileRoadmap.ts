import fs from "fs";
import path from "path";

// Your array data framework generated during task cycles
const roadmapItems = [
  { title: "title1", description: "description", status: "done" },
  { title: "title2", description: "description2", status: "pending" },
];

/**
 * Compiles JSON array parameters into a unified HTML file layout.
 */
function compilePipelinePage() {
  const templatePath = path.join(process.cwd(), "pipeline-template.html");
  const outputPath = path.join(process.cwd(), "dist", "pipeline.html");

  // Read the isolated structural component
  let htmlTemplate = fs.readFileSync(templatePath, "utf8");

  // Map array components into standalone static HTML fragments
  const rowsHtml = roadmapItems
    .map((item, index) => {
      const isDone = item.status === "done";
      const isLast = index === roadmapItems.length - 1;

      // Design layout state evaluation definitions
      const badgeBg = isDone ? "#065f46" : "#374151";
      const badgeColor = isDone ? "#34d399" : "#9ca3af";
      const badgeBorder = isDone ? "#059669" : "#4b5563";
      const badgeChar = isDone ? "✓" : "-";

      const titleColor = isDone ? "#ffffff" : "#9ca3af";
      const descColor = isDone ? "#9ca3af" : "#6b7280";

      // Drop tracking link strings when iterating onto the absolute final line element
      const connectorLine = isLast
        ? ""
        : '<div style="width: 2px; height: 30px; background-color: #374151; margin-top: 8px;"></div>';

      return `
    <div class="pipeline-row" style="display: flex; align-items: flex-start; gap: 16px;">
      <!-- Timeline Node Column -->
      <div style="display: flex; flex-direction: column; align-items: center; height: 100%;">
        <div 
          class="status-badge status-${item.status}"
          style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 700;
            background-color: ${badgeBg}; 
            color: ${badgeColor}; 
            border: 1px solid ${badgeBorder};
          "
        >${badgeChar}</div>
        ${connectorLine}
      </div>

      <!-- Text Content Column -->
      <div class="stage-content" style="flex: 1; padding-top: 3px;">
        <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: ${titleColor};">${item.title}</h3>
        <p style="font-size: 0.875rem; margin: 0; line-height: 1.5; color: ${descColor};">${item.description}</p>
      </div>
    </div>`;
    })
    .join("\n");

  // Inject the mapped fragments cleanly into your framework placeholder bounds
  const combinedOutput = htmlTemplate.replace(
    "<!-- PIPELINE_ROWS_PLACEHOLDER -->",
    rowsHtml,
  );

  // Output generated results safely to target workspace distribution zones
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, combinedOutput, "utf8");

  console.log(
    `🚀 Build complete! Static pipeline tracking page generated at: ${outputPath}`,
  );
}

compilePipelinePage();
