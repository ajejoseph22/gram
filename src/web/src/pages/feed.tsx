import { Carousel } from "@mantine/carousel";
import { Badge, Button, Card, Container, Group, Image, Loader, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { TagsInput } from "../components/tags-input.tsx";
import { getPosts, type Post } from "../lib/api/post.ts";
import { env } from "../lib/env.ts";
import { formatPostTime } from "../lib/helpers.ts";
import { getSocket } from "../sockets/socket.ts";
import { useFeedSocket } from "../sockets/use-feed-socket.ts";

const Feed = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const tagsParam = searchParams.get("tags");
	const activeTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

	const [posts, setPosts] = useState<Post[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleTagsChange = (tags: string[]) => {
		if (tags.length) {
			setSearchParams({ tags: tags.join(",") });
		} else {
			setSearchParams({});
		}
	};

	const fetchPosts = async (cursor?: string, tags?: string[]) => {
		try {
			if (cursor) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}
			const res = await getPosts(cursor, tags?.length ? tags : undefined);
			setPosts((prev) => (cursor ? [...prev, ...res.data] : res.data));
			setNextCursor(res.nextCursor);
			setError(null);
		} catch {
			setError("Failed to load posts");
		} finally {
			setIsLoading(false);
			setIsLoadingMore(false);
		}
	};

	// Live feed: prepend new posts from websocket
	const onNewPost = useCallback(
		(post: Post) => {
			// Skip if it doesn't match the active tag filter
			if (activeTags.length && !post.tags.some((t) => activeTags.includes(t))) {
				return;
			}
			// Prepend and deduplicate by id
			setPosts((prev) => {
				if (prev.some((p) => p.id === post.id)) return prev;
				return [post, ...prev];
			});
		},
		[tagsParam],
	);

	useFeedSocket(onNewPost);

	// Refetch first page on socket reconnect to catch missed events
	const hasConnected = useRef(false);
	useEffect(() => {
		const socket = getSocket();
		const onConnect = () => {
			if (hasConnected.current) {
				fetchPosts(undefined, activeTags);
			}
			hasConnected.current = true;
		};
		socket.on("connect", onConnect);
		return () => {
			socket.off("connect", onConnect);
		};
	}, [tagsParam]);

	useEffect(() => {
		// clear posts and reset cursor when tags change
		setPosts([]);
		setNextCursor(null);

		// fetch first page [with new tags]
		fetchPosts(undefined, activeTags);
	}, [tagsParam]);

	return (
		<Container size="sm" pt="xl" pb="xl">
			<Group justify="space-between" mb="lg">
				<Title order={2}>Feed</Title>
				<Button component={Link} to="/new">
					New Post
				</Button>
			</Group>

			<TagsInput value={activeTags} onChange={handleTagsChange} mb="md" />

			{isLoading && (
				<Stack align="center" mt="xl">
					<Loader />
				</Stack>
			)}

			{error && (
				<Text c="red" ta="center" mt="xl">
					{error}
				</Text>
			)}

			{!isLoading && !error && !posts.length && (
				<Text c="dimmed" ta="center" mt="xl">
					No posts yet
				</Text>
			)}

			{posts.length > 0 && (
				<Stack gap="md">
					{posts.map((post) => (
						<Card key={post.id} shadow="sm" padding="sm" radius="md" withBorder>
							{post.images.length > 0 && (
								<Card.Section>
									{post.images.length === 1 ? (
										<Image src={`${env.VITE_API_BASE_URL}${post.images[0].url}`} height={300} alt={post.title} />
									) : (
										<Carousel withIndicators>
											{post.images.map((img, i) => (
												<Carousel.Slide key={img.url}>
													<Image
														src={`${env.VITE_API_BASE_URL}${img.url}`}
														height={300}
														alt={`${post.title} ${i + 1}`}
													/>
												</Carousel.Slide>
											))}
										</Carousel>
									)}
								</Card.Section>
							)}
							<Text fw={500} mt="sm" lineClamp={2}>
								{post.title}
							</Text>
							{post.tags.length > 0 && (
								<Group gap={4} mt="xs">
									{post.tags.map((tag) => (
										<Badge
											key={tag}
											size="xs"
											variant={activeTags.includes(tag) ? "filled" : "light"}
											style={{ cursor: "pointer" }}
											onClick={() => !activeTags.includes(tag) && handleTagsChange([...activeTags, tag])}
										>
											#{tag}
										</Badge>
									))}
								</Group>
							)}
							<Text size="xs" c="dimmed" mt="xs">
								{formatPostTime(post.createdAt)}
							</Text>
						</Card>
					))}

					{nextCursor && (
						<Group justify="center" mt="lg">
							<Button variant="light" loading={isLoadingMore} onClick={() => fetchPosts(nextCursor, activeTags)}>
								Load more
							</Button>
						</Group>
					)}
				</Stack>
			)}
		</Container>
	);
};

export default Feed;
