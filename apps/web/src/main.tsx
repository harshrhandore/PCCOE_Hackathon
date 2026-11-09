import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "@fontsource/atkinson-hyperlegible-next/latin-400.css";
import "@fontsource/atkinson-hyperlegible-next/latin-600.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "./styles/app.css";
import "./styles/workspace.css";
import App from "./App";
const queryClient = new QueryClient({
  // All reads can reach the local server even when internet status is offline.
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, networkMode: "always" },
  },
});
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
