import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyForm } from "@/components/properties/PropertyForm";
import type { PropertyRow } from "@/services/properties/types";

/* ── Fixtures ── */

const now = new Date().toISOString();

const existingProperty: PropertyRow = {
  id: "p1",
  organization_id: "org-1",
  name: "Sunset Apartments",
  address_line1: "123 Main St",
  address_line2: "Suite 100",
  city: "Los Angeles",
  state: "CA",
  postal_code: "90001",
  country: "US",
  status: "ACTIVE",
  created_at: now,
  updated_at: now,
};

/* ── Tests ── */

describe("PropertyForm", () => {
  const mockSubmit = jest.fn<Promise<void>, [any]>();
  const mockCancel = jest.fn();

  beforeEach(() => {
    mockSubmit.mockReset();
    mockCancel.mockReset();
    mockSubmit.mockResolvedValue(undefined);
  });

  test("renders create mode with empty fields", () => {
    render(<PropertyForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByLabelText("Property Name")).toHaveValue("");
    expect(screen.getByText("Create Property")).toBeInTheDocument();
  });

  test("renders edit mode with initial values", () => {
    render(<PropertyForm initial={existingProperty} onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByLabelText("Property Name")).toHaveValue("Sunset Apartments");
    expect(screen.getByLabelText("Address Line 1")).toHaveValue("123 Main St");
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  test("validates required fields on empty submit", async () => {
    render(<PropertyForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    // Use fireEvent.submit to bypass native HTML constraint validation (jsdom enforces `required`)
    const form = screen.getByText("Create Property").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Property name is required")).toBeInTheDocument();
    });
    expect(screen.getByText("Address is required")).toBeInTheDocument();
    expect(screen.getByText("City is required")).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  test("validates ZIP code format", async () => {
    const user = userEvent.setup();
    render(<PropertyForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.type(screen.getByLabelText("Property Name"), "Test");
    await user.type(screen.getByLabelText("Address Line 1"), "123 Main");
    await user.type(screen.getByLabelText("City"), "LA");
    await user.selectOptions(screen.getByLabelText("State"), "CA");
    await user.type(screen.getByLabelText("ZIP Code"), "abc");

    await user.click(screen.getByText("Create Property"));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid ZIP code (e.g. 90210)")).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  test("submits valid form data", async () => {
    const user = userEvent.setup();
    render(<PropertyForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.type(screen.getByLabelText("Property Name"), "New Place");
    await user.type(screen.getByLabelText("Address Line 1"), "456 Oak Ave");
    await user.type(screen.getByLabelText("City"), "Denver");
    await user.selectOptions(screen.getByLabelText("State"), "CO");
    await user.type(screen.getByLabelText("ZIP Code"), "80201");

    await user.click(screen.getByText("Create Property"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Place",
          addressLine1: "456 Oak Ave",
          city: "Denver",
          state: "CO",
          postalCode: "80201",
          country: "US",
        }),
      );
    });
  });

  test("shows server error on submit failure", async () => {
    mockSubmit.mockRejectedValueOnce(new Error("Network error"));
    const user = userEvent.setup();
    render(<PropertyForm initial={existingProperty} onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    });
  });

  test("cancel button calls onCancel", async () => {
    const user = userEvent.setup();
    render(<PropertyForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.click(screen.getByText("Cancel"));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  test("custom submitLabel overrides button text", () => {
    render(
      <PropertyForm onSubmit={mockSubmit} onCancel={mockCancel} submitLabel="Save Draft" />,
    );
    expect(screen.getByText("Save Draft")).toBeInTheDocument();
  });
});
