import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { KanbanColumn } from "../KanbanColumn";
import type { FunnelStage } from "../types";

const STAGE_FIXTURE: { key: FunnelStage; label: string; accent: string } = {
  key: "NEW",
  label: "Yangi ariza",
  accent: "bg-blue-500",
};

function renderColumn(props: Partial<React.ComponentProps<typeof KanbanColumn>> = {}) {
  return render(
    <DndContext>
      <KanbanColumn
        stage={STAGE_FIXTURE}
        count={props.count ?? 0}
        itemIds={props.itemIds ?? []}
        isLoading={props.isLoading ?? false}
        isEmpty={props.isEmpty ?? true}
      >
        {props.children ?? null}
      </KanbanColumn>
    </DndContext>,
  );
}

describe("KanbanColumn", () => {
  it("renders the stage label and count badge", () => {
    renderColumn({ count: 7 });
    expect(screen.getByText("Yangi ariza")).toBeInTheDocument();
    expect(screen.getByTestId("badge-count-NEW")).toHaveTextContent("7");
  });

  it("shows the loading hint when isLoading is true", () => {
    renderColumn({ isLoading: true });
    expect(screen.getByText("Yuklanmoqda...")).toBeInTheDocument();
  });

  it("shows the empty placeholder when isLoading is false and empty", () => {
    renderColumn({ isLoading: false, isEmpty: true });
    expect(screen.getByTestId("column-empty-NEW")).toBeInTheDocument();
  });

  it("does not show the empty placeholder while loading", () => {
    renderColumn({ isLoading: true, isEmpty: true });
    expect(screen.queryByTestId("column-empty-NEW")).not.toBeInTheDocument();
  });

  it("renders children inside the sortable region", () => {
    renderColumn({
      isEmpty: false,
      children: <div data-testid="kid">child node</div>,
    });
    expect(screen.getByTestId("kid")).toBeInTheDocument();
  });

  it("attaches the data-stage attribute for E2E targeting", () => {
    renderColumn();
    expect(screen.getByTestId("column-stage-NEW")).toHaveAttribute(
      "data-stage",
      "NEW",
    );
  });
});
