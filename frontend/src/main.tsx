import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Aplica el tema guardado antes de mostrar nada, también en el inicio de sesión.
try {
  document.documentElement.dataset.tema = localStorage.getItem("casaRuiz.tema") === "claro" ? "claro" : "oscuro";
} catch {
  document.documentElement.dataset.tema = "oscuro";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
