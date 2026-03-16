import { Pill, PillsInput, type PillsInputProps } from "@mantine/core";
import { type KeyboardEvent, useState } from "react";

interface TagsInputProps extends Omit<PillsInputProps, "value" | "onChange"> {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
}

export function TagsInput({ value, onChange, placeholder = "#filter by tags", ...props }: TagsInputProps) {
	const [input, setInput] = useState("");

	const addTag = (raw: string) => {
		const tag = raw.replace(/^#/, "").trim();
		if (tag && !value.includes(tag)) {
			onChange([...value, tag]);
		}
		setInput("");
	};

	const removeTag = (tag: string) => {
		onChange(value.filter((t) => t !== tag));
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if ((e.key === "Enter" || e.key === " ") && input.trim()) {
			e.preventDefault();
			addTag(input);
		}
	};

	return (
		<PillsInput {...props}>
			<Pill.Group>
				{value.map((tag) => (
					<Pill key={tag} withRemoveButton onRemove={() => removeTag(tag)}>
						#{tag}
					</Pill>
				))}
				<PillsInput.Field
					placeholder={value.length ? "" : placeholder}
					value={input}
					onChange={(e) => setInput(e.currentTarget.value)}
					onKeyDown={handleKeyDown}
				/>
			</Pill.Group>
		</PillsInput>
	);
}
