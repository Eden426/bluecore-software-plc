// `photo` renders a real headshot when present; entries without one fall
// back to an initials avatar (same pattern as the client cards in
// Testimonials.jsx).
import amentiPhoto from "../assets/team/amenti.webp";
import daniPhoto from "../assets/team/dani.webp";
import amanPhoto from "../assets/team/aman.webp";
import edenPhoto from "../assets/team/eden.webp";
import groupAvatar from "../assets/team-placeholders/group-avatar.svg";
import groupAvatarSupport from "../assets/team-placeholders/group-avatar-support.svg";

export const team = [
  {
    name: "Dani",
    role: "Founder & Managing Director",
    bio: "Mechanical Engineering graduate with years of experience managing manufacturing industries and business development specialist.",
    photo: daniPhoto,
    initial: "D",
    accent: "#8B5E3C",
  },
  {
    name: "Amenti",
    role: "General Manager",
    bio: "Leads Bluecore's operations and client delivery, from initial scoping through long-term support.",
    photo: amentiPhoto,
    initial: "AE",
    accent: "#103759",
  },
  {
    name: "Amanuel",
    role: "Lead Architect",
    bio: "An Enterprise Data Engineer with 6+ years of experience and a 2x MCF Scholarship winner, with an honors degree in Computer Science from Michigan State University, US and a Master's degree from the University of Edinburgh, UK.",
    photo: amanPhoto,
    initial: "A",
    accent: "#0B3B63",
  },
  {
    name: "Eden",
    role: "AI and Machine Learning Engineer",
    bio: "Affiliated with the AI/ML team at INSA, working on machine learning models and data-driven systems. [Placeholder — add specific projects, specializations, or research focus here.]",
    photo: edenPhoto,
    initial: "E",
    accent: "#5B3A29",
  },
  {
    name: "Extended Engineering Pool",
    role: "On-Demand & Part-Time Engineers",
    bio: "A flexible bench of engineers who scale in on short notice for urgent or high-volume work that goes beyond our core team's bandwidth — covering front-end and back-end development, databases, cloud engineering, DevOps, security, and QA as each project requires.",
    photo: groupAvatar,
    initial: "PT",
    accent: "#334155",
    wide: true,
  },
  {
    name: "Marketing & Support Pool",
    role: "On-Demand Marketing & Customer Success",
    bio: "A flexible team of marketers and support specialists who promote our products, onboard new users, and provide ongoing customer support — scaling up for launches, campaigns, and periods of high demand.",
    photo: groupAvatarSupport,
    initial: "MS",
    accent: "#3F2D1F",
    wide: true,
  },
];
