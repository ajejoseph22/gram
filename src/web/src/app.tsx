import { BrowserRouter, Route, Routes } from "react-router";
import Feed from "./pages/feed.tsx";
import { NewPost } from "./pages/new-post.tsx";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Feed />} />
				<Route path="/new" element={<NewPost />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
