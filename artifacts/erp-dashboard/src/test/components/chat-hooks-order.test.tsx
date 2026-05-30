/**
 * @module chat-hooks-order.test
 * @description Regression guard for the react-hooks/rules-of-hooks fixes in
 *   MentionInput and MessageReactions. Both components previously declared a
 *   useCallback AFTER a prop-conditional early return, so the hook count varied
 *   between renders. These tests render each component in BOTH branches of that
 *   early return (and re-render across the branch) to prove the hook order is
 *   now stable — a "Rendered fewer hooks than expected" error would fail here.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MentionInput } from "@/components/chat/page/MentionInput";
import { MessageReactions } from "@/components/chat/page/MessageReactions";

// MessageReactions reads the current user via useAuth — stub it to a stable id.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, isLoading: false, isAuthenticated: true }),
}));

const noop = () => {};

describe("MentionInput — hook order stable across isChannelReadOnly branch", () => {
  it("renders the read-only branch (early return) without crashing", () => {
    render(
      <MentionInput
        roomId="r1"
        onSend={noop}
        onTypingStart={noop}
        onTypingStop={noop}
        isChannelReadOnly
      />,
    );
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("renders the editable branch (past the early return) with the input", () => {
    render(
      <MentionInput
        roomId="r1"
        onSend={noop}
        onTypingStart={noop}
        onTypingStop={noop}
        isChannelReadOnly={false}
      />,
    );
    expect(document.querySelector("textarea")).not.toBeNull();
  });

  it("re-renders across the branch flip without a hook-order error", () => {
    const { rerender } = render(
      <MentionInput
        roomId="r1"
        onSend={noop}
        onTypingStart={noop}
        onTypingStop={noop}
        isChannelReadOnly={false}
      />,
    );
    // flip into the early-return branch, then back — would throw pre-fix
    expect(() => {
      rerender(
        <MentionInput roomId="r1" onSend={noop} onTypingStart={noop} onTypingStop={noop} isChannelReadOnly />,
      );
      rerender(
        <MentionInput roomId="r1" onSend={noop} onTypingStart={noop} onTypingStop={noop} isChannelReadOnly={false} />,
      );
    }).not.toThrow();
    expect(document.querySelector("textarea")).not.toBeNull();
  });
});

describe("MessageReactions — hook order stable across compact/empty early return", () => {
  it("renders null on the empty+compact early-return branch", () => {
    const { container } = render(
      <MessageReactions messageId="m1" roomId="r1" reactions={[]} onReact={noop} compact />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the reaction pills past the early return", () => {
    render(
      <MessageReactions
        messageId="m1"
        roomId="r1"
        reactions={[{ emoji: "👍", count: 2, userIds: ["u2"], users: ["Ann"] }]}
        onReact={noop}
        compact
      />,
    );
    expect(screen.getByText("👍")).toBeInTheDocument();
  });

  it("re-renders from empty (early return) to populated without a hook-order error", () => {
    const { rerender } = render(
      <MessageReactions messageId="m1" roomId="r1" reactions={[]} onReact={noop} compact />,
    );
    expect(() => {
      rerender(
        <MessageReactions
          messageId="m1"
          roomId="r1"
          reactions={[{ emoji: "🔥", count: 1, userIds: ["u3"], users: ["Bob"] }]}
          onReact={noop}
          compact
        />,
      );
    }).not.toThrow();
    expect(screen.getByText("🔥")).toBeInTheDocument();
  });
});
