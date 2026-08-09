import { useEffect, useRef, useState } from 'react';
import { answerConciergeMessage } from '@ayana/ai-engine';
import type { AyanaMemory, HotelCity, ServiceKind } from '@ayana/shared-types';
import { Button, Card, MockTag } from '@ayana/shared-ui';
import { AnaIqMark } from './AnaIqMark';

interface Message {
  from: 'guest' | 'concierge';
  text: string;
  action?: { label: string; kind: ServiceKind };
}

const PROMPTS = ['What do I owe?', 'Somewhere to eat?', 'Book me a massage', 'What’s worth seeing?'];

/**
 * In-stay concierge. Replies are matched to intent and answered from live data — the folio
 * balance on this same screen, the bookable service catalog, and the guest's AYANA Memory —
 * rather than a fixed acknowledgement. Service answers can open the booking sheet directly.
 */
export function ConciergeChat({
  city,
  memory,
  outstanding,
  guestFirstName,
  onBookService,
}: {
  city: HotelCity;
  memory: AyanaMemory;
  outstanding: number;
  guestFirstName: string;
  onBookService: (kind: ServiceKind) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'concierge', text: `Hi ${guestFirstName}, I'm AnA IQ. Ask me about your bill, the spa, dining, transport, or what's worth seeing in ${city}.` },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((m) => [...m, { from: 'guest', text: trimmed }]);
    setInput('');
    setThinking(true);

    const reply = answerConciergeMessage(trimmed, { city, memory, outstanding, guestFirstName });
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'concierge', text: reply.text, action: reply.action }]);
      setThinking(false);
    }, 700);
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-950">Ask the Concierge</h2>
        <AnaIqMark />
      </div>
      <Card className="flex flex-col gap-3">
        <div ref={scrollRef} className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.from === 'guest' ? 'ml-auto bg-ink-900 text-cream-50' : 'bg-ink-900/5 text-ink-900'
              }`}
            >
              {m.text}
              {m.action && (
                <button
                  onClick={() => onBookService(m.action!.kind)}
                  className="mt-2 block w-full rounded-lg bg-gold-500/20 px-3 py-1.5 text-xs font-medium text-gold-700"
                >
                  {m.action.label} →
                </button>
              )}
            </div>
          ))}
          {thinking && (
            <div className="max-w-[85%] rounded-xl bg-ink-900/5 px-3 py-2 text-sm text-ink-700/40">Typing…</div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-ink-900/15 px-2.5 py-1 text-[11px] text-ink-700/70"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-ink-900/15 px-3 py-2 text-sm"
            placeholder="Ask me anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <Button size="sm" disabled={!input.trim() || thinking} onClick={() => send(input)}>
            Send
          </Button>
        </div>

        <MockTag />
      </Card>
    </section>
  );
}
