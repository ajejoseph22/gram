import { zodResolver } from "@hookform/resolvers/zod";
import { ActionIcon, Button, Image, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { createPost } from "../../lib/api";
import { env } from "../../lib/env";

const uploadSchema = z.object({
	title: z.string().min(1, "Title is required").max(120),
	tags: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadForm() {
	const navigate = useNavigate();
	const [files, setFiles] = useState<File[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [fileWarning, setFileWarning] = useState<string | null>(null);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);

	useEffect(() => {
		const urls = files.map((f) => URL.createObjectURL(f));
		setPreviewUrls(urls);
		// Clean up blob URLs from memory on unmount
		return () => urls.forEach((url) => URL.revokeObjectURL(url));
	}, [files]);

	const {
		register,
		handleSubmit,
		reset: resetForm,
		formState: { errors },
	} = useForm<UploadFormValues>({
		resolver: zodResolver(uploadSchema),
	});

	async function onSubmit(values: UploadFormValues) {
		if (!files.length) {
			setSubmitError("Select at least one image");
			return;
		}

		setIsSubmitting(true);
		setSubmitError(null);

		const formData = new FormData();

		formData.set("title", values.title.trim());
		if (values.tags) formData.set("tags", values.tags.trim());

		for (const file of files) {
			formData.append("images", file);
		}

		try {
			await createPost(formData);
			resetForm();
			setFiles([]);
			notifications.show({ title: "Posted!", message: "Your post has been sent!", color: "green" });
			navigate("/feed");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Upload failed");
			notifications.show({ title: "Error", message: "An error occured", color: "red" });
		} finally {
			setIsSubmitting(false);
		}
	}

	const maxFileCount = env.VITE_MAX_UPLOAD_FILE_COUNT;

	const previews = previewUrls.map((url, i) => {
		return (
			<div key={url} style={{ position: "relative" }}>
				<Image src={url} radius="sm" h={120} fit="cover" onLoad={() => URL.revokeObjectURL(url)} />
				<ActionIcon
					size="xs"
					color="red"
					variant="filled"
					radius="xl"
					style={{ position: "absolute", top: 4, right: 4 }}
					onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
				>
					<IconX size={"1rem"} />
				</ActionIcon>
			</div>
		);
	});

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Stack gap="sm">
				<Dropzone
					onDrop={(dropped) => {
						setFileWarning(null);
						setFiles((prev) => {
							const combined = [...prev, ...dropped];
							if (combined.length > maxFileCount) {
								setFileWarning(
									`Only ${maxFileCount} images allowed. ${combined.length - maxFileCount} file(s) were not added.`,
								);
								return combined.slice(0, maxFileCount);
							}

							return combined;
						});
					}}
					onReject={() => {
						setFileWarning(`You can select up to ${maxFileCount} images at a time.`);
					}}
					accept={IMAGE_MIME_TYPE}
					maxFiles={maxFileCount}
					maxSize={env.VITE_MAX_UPLOAD_SIZE_MB * 1024 * 1024}
				>
					<Text ta="center" c="dimmed" py="lg">
						Drop images here or click to select (max {maxFileCount})
					</Text>
				</Dropzone>

				{fileWarning && (
					<Text c="orange" size="sm">
						{fileWarning}
					</Text>
				)}

				{!!previews.length && (
					<SimpleGrid cols={{ base: 3, sm: 5 }} spacing="xs">
						{previews}
					</SimpleGrid>
				)}

				<TextInput placeholder="Title" {...register("title")} error={errors.title?.message} />

				<TextInput placeholder="Tags (comma-separated)" {...register("tags")} />

				{submitError && (
					<Text c="red" size="sm">
						{submitError}
					</Text>
				)}

				<Button type="submit" loading={isSubmitting} fullWidth>
					Post
				</Button>
			</Stack>
		</form>
	);
}
