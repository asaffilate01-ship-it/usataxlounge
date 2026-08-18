import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Check for saved theme preference or default to dark
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
  if (!savedTheme) localStorage.setItem("theme", "dark");
}

createRoot(document.getElementById("root")!).render(<App />);

// Fade out the pre-render splash once React has mounted
requestAnimationFrame(() => {
  const splash = document.getElementById("app-splash");
  if (!splash) return;
  splash.style.opacity = "0";
  window.setTimeout(() => splash.remove(), 400);
});
