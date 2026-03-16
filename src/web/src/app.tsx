import { Box, Stack } from "@mantine/core";
import { BrowserRouter, Route, Routes } from "react-router";
import { Footer } from "./components/footer.tsx";
import Feed from "./pages/feed.tsx";
import { NewPost } from "./pages/new-post.tsx";

function App() {
	return (
		<BrowserRouter>
			<Stack mih="100vh" gap={0}>
				<Box style={{ flex: 1 }}>
					<Routes>
						<Route path="/" element={<Feed />} />
						<Route path="/feed" element={<Feed />} />
						<Route path="/new" element={<NewPost />} />
					</Routes>
				</Box>
				<Footer />
			</Stack>
		</BrowserRouter>
	);
}

export default App;
