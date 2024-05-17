// Function to detect mobile devices
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

// Function to check if the browser is in fullscreen mode
function isFullscreen() {
  const d = document as any;
  return (
    d.fullscreenElement ||
    d.webkitFullscreenElement ||
    d.mozFullScreenElement ||
    d.msFullscreenElement
  );
}

// Function to check if the device is in landscape mode
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}

// Combine the checks
export function checkMobileFullscreenLandscape() {
  if (!isMobileDevice()) return;
  if (!isFullscreen()) document.body.requestFullscreen();
  if (!isLandscape()) return;

  const s = screen as any;
  s.orientation.lock("landscape");
}
