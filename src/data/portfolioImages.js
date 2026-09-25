// Preview images keyed by portfolio project type. Kept separate from
// portfolio.js (which stays plain, asset-import-free data — see CLAUDE.md)
// so scripts/prerender.mjs and scripts/generate-sitemap.mjs can import
// portfolio.js directly from plain Node without pulling in Vite-only asset
// imports it can't resolve.
import business from "../assets/business.webp";
import mobile from "../assets/mobile.webp";
import computer from "../assets/computer.webp";
import erpSolutions from "../assets/portfolio/erp-solutions.svg";
import garageOs from "../assets/portfolio/garage-os.svg";
import hardwareIot from "../assets/portfolio/hardware-iot.svg";
import queueManagement from "../assets/portfolio/queue-management.svg";
import appointmentScheduling from "../assets/portfolio/appointment-scheduling.svg";
import ecommerce from "../assets/portfolio/ecommerce.svg";
import paymentGateway from "../assets/portfolio/payment-gateway.svg";

export const portfolioImages = {
  "Web App": business,
  "Mobile App": mobile,
  Digitization: computer,
  "ERP Platform": erpSolutions,
  "Garage Management": garageOs,
  "IoT / Hardware": hardwareIot,
  "Queue Management": queueManagement,
  "Appointment Scheduling": appointmentScheduling,
  "E-Commerce": ecommerce,
  "Payment Integration": paymentGateway,
};
