import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    define: {
      "import.meta.env.VITE_AUTH0_DOMAIN": JSON.stringify(
        env.VITE_AUTH0_DOMAIN
      ),
      "import.meta.env.VITE_AUTH0_CLIENT_ID": JSON.stringify(
        env.VITE_AUTH0_CLIENT_ID
      ),
      "import.meta.env.VITE_AUTH0_REDIRECT_URI": JSON.stringify(
        env.VITE_AUTH0_REDIRECT_URI
      ),
      "import.meta.env.VITE_AUTH0_AUDIENCE": JSON.stringify(
        env.VITE_AUTH0_AUDIENCE
      ),
    },
  };
});
