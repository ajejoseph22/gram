import { Container, Stack, Title } from "@mantine/core";
import { CloseButton } from "../components/close-button.tsx";
import { UploadForm } from "../features/upload/upload-form.tsx";

export function NewPost() {
	return (
		<Container size="sm" pt="xl">
			<CloseButton
				to="/feed"
				style={{
					position: "absolute",
					top: "var(--mantine-spacing-lg)",
					left: "var(--mantine-spacing-sm)",
				}}
			/>
			<Stack mt="15vh" justify="space-between">
				<Title order={2}>New Post</Title>
				<UploadForm />
			</Stack>
		</Container>
	);
}
