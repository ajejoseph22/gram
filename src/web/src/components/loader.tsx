import { Loader as MantineLoader, type LoaderProps as MantineLoaderProps, Stack, type StackProps } from "@mantine/core";

interface LoaderProps extends MantineLoaderProps {
	wrapperProps?: StackProps;
}

export function Loader({ wrapperProps, ...props }: LoaderProps) {
	return (
		<Stack align="center" {...wrapperProps}>
			<MantineLoader {...props} />
		</Stack>
	);
}
