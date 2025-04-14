
const isVite = window.location.port === "5173";

const BASE_URL = isVite
  ? "http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai"
  : window.location.origin;
const INACTIVITY_TIMEOUT = 30000;
const DEBUG = true;