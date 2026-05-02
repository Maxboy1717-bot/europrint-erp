import { useState, useCallback } from "react";
import { BarChart2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPollData } from "@/store/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { getChatApiBase } from "@/lib/apiBase";
import { safeStorage } from '@/lib/safeStorage';

interface Props {
  messageId: string;
  poll: ChatPollData;
  isMe: boolean;
}

export function MessagePoll({ messageId, poll, isMe }: Props) {
  const { user } = useAuth();
  const [localMyVotes, setLocalMyVotes] = useState<number[]>(Array.isArray(poll.myVotes) ? poll.myVotes : []);
  const [localVotes, setLocalVotes] = useState(poll.votes ?? {});
  const [localTotal, setLocalTotal] = useState(poll.totalVotes ?? 0);
  const [isVoting, setIsVoting] = useState(false);

  const hasVoted = localMyVotes.length > 0;
  const maxVotes = Math.max(...Object.values(localVotes).map((v) => v.count), 1);

  const handleVote = useCallback(async (idx: number) => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const token = safeStorage.getItem("access_token");
      const res = await fetch(`${getChatApiBase()}/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          optionIndex: poll.isMultiple ? [...localMyVotes, idx] : [idx],
        }),
      });
      if (res.ok) {
        const data = await res.json() as {
          votes: Record<number, { count: number; users: string[] }>;
          totalVotes: number;
          myVotes: number[];
        };
        setLocalVotes(data.votes);
        setLocalTotal(data.totalVotes);
        setLocalMyVotes(data.myVotes);
      }
    } finally {
      setIsVoting(false);
    }
  }, [poll.id, poll.isMultiple, localMyVotes, isVoting]);

  const options = Array.isArray(poll.options) ? poll.options : [];

  return (
    <div className={cn("min-w-[220px] max-w-[300px]")}>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
        <p className="text-sm font-medium leading-snug">{poll.question}</p>
      </div>

      <div className="space-y-1.5">
        {(Array.isArray(options) ? options : []).map((opt, idx) => {
          const voteData = localVotes[idx];
          const count = voteData?.count ?? 0;
          const pct = localTotal > 0 ? Math.round((count / localTotal) * 100) : 0;
          const iChose = localMyVotes.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={isVoting}
              className={cn(
                "w-full text-left rounded-lg overflow-hidden border transition-all",
                iChose
                  ? "border-primary/60"
                  : "border-border/40 hover:border-primary/30",
                isMe ? "border-primary-foreground/20" : ""
              )}
            >
              <div className="relative px-2.5 py-1.5">
                {/* Progress bar */}
                <div
                  className={cn(
                    "absolute inset-0 transition-all",
                    isMe
                      ? iChose ? "bg-primary-foreground/30" : "bg-primary-foreground/10"
                      : iChose ? "bg-primary/15" : "bg-muted/40"
                  )}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {iChose && <Check className="w-3 h-3 flex-shrink-0 text-primary" />}
                    <span className="text-xs truncate">{typeof opt === "string" ? opt : opt.text}</span>
                  </div>
                  <span className="text-[10px] font-medium flex-shrink-0 opacity-70">
                    {count > 0 ? `${pct}%` : ""}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className={cn(
        "text-[10px] mt-1.5 opacity-60",
        isMe ? "text-primary-foreground" : "text-muted-foreground"
      )}>
        {localTotal} ovoz · {poll.isAnonymous ? "Anonim" : "Ochiq"} · {poll.isMultiple ? "Ko'p tanlov" : "Yagona tanlov"}
      </p>
    </div>
  );
}
