import { BrowserRouter, Route, Routes } from "react-router";
import { Footer } from "./components/footer.tsx";
import Feed from "./pages/feed.tsx";
import { NewPost } from "./pages/new-post.tsx";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Feed />} />
				<Route path="/feed" element={<Feed />} />
				<Route path="/new" element={<NewPost />} />
			</Routes>
			<Footer />
		</BrowserRouter>
	);
}

export default App;
