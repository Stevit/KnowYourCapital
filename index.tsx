import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler to diagnose blank page issues
window.addEventListener("error", (event) => {
  console.error("Global Error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("React render error:", error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">Error loading application: ${
    error instanceof Error ? error.message : String(error)
  }</div>`;
}
