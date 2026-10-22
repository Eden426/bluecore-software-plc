// Icon components keyed by service slug. Kept separate from services.js (the
// same split Portfolio.jsx uses for its images, keyed by project type) so
// services.js stays plain, JSX-free data — safe to import from a plain Node
// script (scripts/prerender.mjs) without pulling in JSX it can't parse.
import {
  IconAI,
  IconCloudOps,
  IconCustomDev,
  IconDesign,
  IconDigitize,
  IconIntegration,
  IconShieldQA,
  IconTransform,
  IconWebApp,
} from "../components/icons/ServiceIcons";

export const serviceIcons = {
  "system-integration": IconIntegration,
  "web-application-development": IconWebApp,
  "ai-solutions": IconAI,
  "custom-software-development": IconCustomDev,
  "ai-digital-transformation": IconTransform,
  "cloud-and-devops": IconCloudOps,
  "digitization-support": IconDigitize,
  "software-design-and-consulting": IconDesign,
  "security-and-quality-assurance": IconShieldQA,
};
