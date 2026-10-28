// pages/ArchStage.tsx
import { AppHeader, ControlBar, SidePanel } from "./components/Layout";
import scenesConfig from "./components/scenes.json";

export function ArchStagePage() {
  const jsonPayload = JSON.stringify(scenesConfig);

  const scriptContent = `
    window.ARCHFLOW_SCENES = ${jsonPayload};
    window.CURRENT_SCENE_KEY = 'fragmentation';

    window.loadScene = function(key) {
      window.CURRENT_SCENE_KEY = key;
      if (window.archEngine && window.ARCHFLOW_SCENES && window.ARCHFLOW_SCENES[key]) {
        window.archEngine.loadSceneConfig(window.ARCHFLOW_SCENES[key]);
        
        document.querySelectorAll('.nav-btn').forEach(function(btn) {
          btn.classList.remove('active');
        });
        if (window.event && window.event.target) {
          window.event.target.classList.add('active');
        }
      } else {
        window.PENDING_SCENE = key;
      }
    };
  `;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ArchFlow Engine</title>
        <link rel="stylesheet" href="/css/archflow.css" />

        <script is:inline>{scriptContent}</script>
        <script src="/js/engine.js" defer></script>
      </head>
      <body class="grid-bg">
        <AppHeader />

        <div class="workspace">
          <div class="canvas-container">
            <div id="stage" class="stage">
              <svg id="svgLayer" class="svg-layer"></svg>
            </div>

            <ControlBar />
          </div>

          <SidePanel />
        </div>
      </body>
    </html>
  );
}
