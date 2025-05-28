
window.isVite = window.location.port === "5173";

window.BASE_URL = window.isVite
  ? "http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai"
  : window.location.origin;

window.INACTIVITY_TIMEOUT = 30000;
window.DEBUG = true;
