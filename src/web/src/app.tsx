import { Container, Title } from "@mantine/core";
import { BrowserRouter, Route, Routes } from "react-router";
import Feed from "./pages/feed.tsx";
import { NewPost } from "./pages/new-post.tsx";

function Home() {
	return (
		<Container size="sm" py="xl">
			<Title order={1} mb="lg">
				gram
			</Title>
		</Container>
	);
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/new" element={<NewPost />} />
				<Route path="/feed" element={<Feed />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
