import { Text } from "@mantine/core";

export function Footer() {
	return (
		<Text ta="center" c="dimmed" size="sm" py="xl">
			GRAM &copy; {new Date().getFullYear()}
		</Text>
	);
}
