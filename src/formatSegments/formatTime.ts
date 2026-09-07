const formatTime = (totalSeconds: number): string => {
  // Handle edge cases like negative numbers or non-integers safely
  const seconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Pad single digits with a leading zero
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(remainingSeconds).padStart(2, "0");

  return hh != "00" ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
};

export { formatTime };
