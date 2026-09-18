export const ConstellationBtn = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    {/* Constellation Nodes & Connecting Lines */}
    <circle cx="12" cy="5" r="2" fill="currentColor" />
    <circle cx="5" cy="12" r="2" fill="currentColor" />
    <circle cx="19" cy="10" r="2" fill="currentColor" />
    <circle cx="9" cy="19" r="2" fill="currentColor" />
    <circle cx="17" cy="18" r="2" fill="currentColor" />
    <line x1="12" y1="5" x2="5" y2="12" />
    <line x1="12" y1="5" x2="19" y2="10" />
    <line x1="5" y1="12" x2="9" y2="19" />
    <line x1="19" y1="10" x2="17" y2="18" />
    <line x1="9" y1="19" x2="17" y2="18" />
  </svg>
);
