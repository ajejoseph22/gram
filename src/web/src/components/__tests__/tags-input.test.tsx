import { MantineProvider } from "@mantine/core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagsInput } from "../tags-input.tsx";

afterEach(cleanup);

function renderWithMantine(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("TagsInput", () => {
	it("should render existing tags as pills", () => {
		renderWithMantine(<TagsInput value={["funny", "viral"]} onChange={() => {}} />);
		expect(screen.getByText("#funny")).toBeDefined();
		expect(screen.getByText("#viral")).toBeDefined();
	});

	it("should add a tag on Enter key", async () => {
		const onChange = vi.fn();
		renderWithMantine(<TagsInput value={[]} onChange={onChange} />);
		const inputElement = screen.getByRole("textbox");
		await userEvent.type(inputElement, "newtag{Enter}");
		expect(onChange).toHaveBeenCalledWith(["newtag"]);
	});

	it("should strip leading # from input", async () => {
		const onChange = vi.fn();
		renderWithMantine(<TagsInput value={[]} onChange={onChange} />);
		const inputElement = screen.getByRole("textbox");
		await userEvent.type(inputElement, "#hashtag{Enter}");
		expect(onChange).toHaveBeenCalledWith(["hashtag"]);
	});

	it("should not add duplicate tags", async () => {
		const onChange = vi.fn();
		renderWithMantine(<TagsInput value={["existing"]} onChange={onChange} />);
		const inputElement = screen.getByPlaceholderText("");
		await userEvent.type(inputElement, "existing{Enter}");
		expect(onChange).not.toHaveBeenCalled();
	});

	it("should remove a tag when its remove button is clicked", async () => {
		const onChange = vi.fn();
		const { container } = renderWithMantine(<TagsInput value={["viral", "funny"]} onChange={onChange} />);
		const removeButtons = container.querySelectorAll(".mantine-Pill-remove");
		expect(removeButtons.length).toBe(2);
		await userEvent.click(removeButtons[0]);
		expect(onChange).toHaveBeenCalledWith(["funny"]);
	});
});
