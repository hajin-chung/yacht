// Function to detect mobile devices
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Function to check if the browser is in fullscreen mode
function isFullscreen() {
  const d = document as any
  return d.fullscreenElement ||
    d.webkitFullscreenElement ||
    d.mozFullScreenElement ||
    d.msFullscreenElement;
}

// Function to check if the device is in landscape mode
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}

// Combine the checks
function checkMobileFullscreenLandscape() {
  if (isMobileDevice() && isFullscreen() && isLandscape()) {
    console.log("Client is on a mobile device, in fullscreen mode, and in landscape orientation.");
    // Add your logic here
  } else {
    console.log("Client is not meeting one or more conditions (mobile device, fullscreen, landscape).");
  }
}

export function checkMobile() {
  // Check immediately
  checkMobileFullscreenLandscape();

  // Optionally, you can add event listeners to check when fullscreen mode or orientation changes
  document.addEventListener('fullscreenchange', checkMobileFullscreenLandscape);
  document.addEventListener('webkitfullscreenchange', checkMobileFullscreenLandscape);
  document.addEventListener('mozfullscreenchange', checkMobileFullscreenLandscape);
  document.addEventListener('MSFullscreenChange', checkMobileFullscreenLandscape);

  window.addEventListener('orientationchange', checkMobileFullscreenLandscape);
  window.addEventListener('resize', checkMobileFullscreenLandscape);
}

