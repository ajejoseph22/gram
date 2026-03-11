import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import App from "./app.tsx";

// biome-ignore lint: div#root is guaranteed to exist in the HTML template
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider>
			<Notifications position="top-right" />
			<App />
		</MantineProvider>
	</StrictMode>,
);
