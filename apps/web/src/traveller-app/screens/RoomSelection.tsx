import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreCategoriesForGuest, type CategoryFit } from '@ayana/ai-engine';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useCurrentGuest, useHotel, useRoomsForHotel } from '../hooks';

export function RoomSelection() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const hotel = useHotel(hotelId);
  const rooms = useRoomsForHotel(hotelId);
  const guest = useCurrentGuest();
  const [selected, setSelected] = useState<CategoryFit | null>(null);

  const ranked = useMemo(() => (guest ? scoreCategoriesForGuest(guest, rooms) : []), [guest, rooms]);
  const best = ranked[0] ?? null;
  const alternatives = ranked.slice(1);
  const active = selected ?? best;

  if (!hotel || !guest) return null;

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div className="mx-auto max-w-md">
        <PageHeader title="Room Selection" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="px-5">
          <p className="mb-4 text-xs text-ink-700/50">
            You're choosing a room category — your exact room is assigned closer to arrival and confirmed on your
            Ready-to-Room screen.
          </p>

          {best && (
            <>
              <Badge tone="gold">AI Recommended</Badge>
              <Card
                className={`mt-2 cursor-pointer ${active?.category === best.category && active.view === best.view ? 'ring-2 ring-gold-500' : ''}`}
                onClick={() => setSelected(best)}
              >
                <CategoryCard fit={best} />
              </Card>
            </>
          )}

          {alternatives.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Other Categories</h2>
              <div className="flex flex-col gap-3">
                {alternatives.map((fit) => (
                  <Card
                    key={`${fit.category}-${fit.view}`}
                    className={`cursor-pointer ${active?.category === fit.category && active.view === fit.view ? 'ring-2 ring-gold-500' : ''}`}
                    onClick={() => setSelected(fit)}
                  >
                    <CategoryCard fit={fit} compact />
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button
            fullWidth
            size="lg"
            disabled={!active}
            onClick={() =>
              active &&
              navigate(`/traveller/book/${hotel.id}/${active.category}/${active.view}`)
            }
          >
            {active ? `Confirm ${active.category} — ₹${active.nightlyPrice.toLocaleString('en-IN')}/night` : 'Select a category'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ fit, compact = false }: { fit: CategoryFit; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-medium text-ink-900 capitalize">{fit.category}</p>
        <p className="text-sm font-semibold text-ink-900">₹{fit.nightlyPrice.toLocaleString('en-IN')}</p>
      </div>
      <p className="text-xs text-ink-700/50 capitalize">{fit.view.replace('_', ' ')} view</p>
      {!compact && <p className="mt-2 text-xs text-springs-600">{fit.reasons.join(' · ')}</p>}
    </div>
  );
}
