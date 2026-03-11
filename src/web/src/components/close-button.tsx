import { ActionIcon, type ActionIconProps } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router";

interface CloseButtonProps extends ActionIconProps {
	to?: string;
}

export function CloseButton({
	to = "/feed",
	variant = "subtle",
	color = "gray",
	size = "lg",
	...props
}: CloseButtonProps) {
	const navigate = useNavigate();

	return (
		<ActionIcon variant={variant} color={color} size={size} onClick={() => navigate(to)} aria-label="Close" {...props}>
			<IconX size={"2rem"} />
		</ActionIcon>
	);
}
