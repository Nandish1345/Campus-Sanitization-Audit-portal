import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { isSupabaseConfigured } from "@/lib/supabase";
import App from "./App.tsx";
import "./index.css";

const ErrorFallback = ({ error }: { error: Error }) => (
    <div style={{ padding: "20px", fontFamily: "system-ui", color: "#333", maxWidth: "600px", margin: "40px auto" }}>
        <h1 style={{ color: "#e11d48" }}>Something went wrong</h1>
        <p>The application crashed with the following error:</p>
        <pre style={{ background: "#f1f5f9", padding: "15px", borderRadius: "8px", overflow: "auto" }}>
            {error.message}
        </pre>
        <p style={{ marginTop: "20px", color: "#64748b" }}>
            Tip: If this is a configuration error, check your <code>.env</code> file.
        </p>
    </div>
);

// Check configuration before trying to render the App
if (!isSupabaseConfigured()) {
    const error = new Error("Supabase environment variables are missing or invalid. Please check your .env file.");
    document.body.innerHTML = "";
    createRoot(document.body).render(<ErrorFallback error={error} />);
    throw error;
}

try {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
} catch (error: any) {
    document.body.innerHTML = "";
    createRoot(document.body).render(<ErrorFallback error={error} />);
}

window.addEventListener("error", (event) => {
    document.body.innerHTML = "";
    createRoot(document.body).render(<ErrorFallback error={event.error || new Error("Unknown error")} />);
});
