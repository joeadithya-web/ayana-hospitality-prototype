import { useEffect, useRef, useState } from 'react';
import { journeyGoalReply } from '@ayana/ai-engine';
import type { IntentCategory } from '@ayana/shared-types';
import { AnaIqMark, Card, MockTag } from '@ayana/shared-ui';

interface Message {
  from: 'guest' | 'ayana';
  text: string;
}

/**
 * The booking-time "what would make this journey successful?" capture, as a short back-and-
 * forth with AYANA instead of a plain textarea — same visual/interaction pattern as the
 * in-stay "Ask the Concierge" chat. Every guest message is joined into a single string via
 * `onChange`, which is what actually gets stored as the booking's journeyGoal.
 */
export function JourneyGoalChat({ category, onChange }: { category: IntentCategory; onChange: (goal: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'ayana', text: 'What would make this journey successful? Tell me a bit about it, and I’ll make sure everything’s ready.' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const guestTurns = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    guestTurns.current = [...guestTurns.current, trimmed];
    onChange(guestTurns.current.join(' '));

    setMessages((m) => [...m, { from: 'guest', text: trimmed }]);
    setInput('');
    setThinking(true);

    const reply = journeyGoalReply(guestTurns.current.length, category, trimmed);
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'ayana', text: reply }]);
      setThinking(false);
    }, 600);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
          What would make this journey successful?
        </span>
        <AnaIqMark />
      </div>
      <Card className="flex flex-col gap-3">
        <div ref={scrollRef} className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.from === 'guest' ? 'ml-auto bg-ink-900 text-cream-50' : 'bg-ink-900/5 text-ink-900'
              }`}
            >
              {m.text}
            </div>
          ))}
          {thinking && (
            <div className="max-w-[85%] rounded-xl bg-ink-900/5 px-3 py-2 text-sm text-ink-700/40">Typing…</div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
            placeholder="Tell AYANA…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button
            type="button"
            disabled={!input.trim() || thinking}
            onClick={() => send(input)}
            className="flex-none rounded-lg bg-ink-950 px-4 py-2 text-sm font-medium text-cream-50 disabled:opacity-30"
          >
            Send
          </button>
        </div>

        <MockTag />
      </Card>
    </div>
  );
}
