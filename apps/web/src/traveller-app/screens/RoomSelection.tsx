import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreCategoriesForGuest, type CategoryFit, type RoomVariant } from '@ayana/ai-engine';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useCurrentGuest, useHotel, useRoomsForHotel } from '../hooks';

const BED_LABEL: Record<string, string> = { twin: 'Twin beds', double: 'Double bed', king: 'King bed' };

export function RoomSelection() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const hotel = useHotel(hotelId);
  const rooms = useRoomsForHotel(hotelId);
  const guest = useCurrentGuest();

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [chosen, setChosen] = useState<{ fit: CategoryFit; variant: RoomVariant } | null>(null);

  const ranked = useMemo(() => (guest ? scoreCategoriesForGuest(guest, rooms) : []), [guest, rooms]);
  const best = ranked[0] ?? null;
  const alternatives = ranked.slice(1);

  if (!hotel || !guest) return null;

  function selectHeadline(fit: CategoryFit) {
    setChosen({ fit, variant: fit.variants[0]! });
    setOpenCategory(null);
  }

  const isChosen = (fit: CategoryFit, v: RoomVariant) =>
    chosen?.fit.category === fit.category && chosen.variant.bedType === v.bedType && chosen.variant.view === v.view;

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div className="mx-auto max-w-md">
        <PageHeader title="Room Selection" subtitle={hotel.name} onBack={() => navigate(-1)} />

        <div className="px-5">
          <p className="mb-4 text-xs text-ink-700/50">
            You're choosing a room category — your exact room is assigned closer to arrival and confirmed at check-in.
          </p>

          {best && (
            <>
              <Badge tone="gold">AI Recommended</Badge>
              <Card
                className={`mt-2 cursor-pointer ${chosen?.fit.category === best.category ? 'ring-2 ring-gold-500' : ''}`}
                onClick={() => selectHeadline(best)}
              >
                <PriceRow name={best.category} price={best.nightlyPrice} />
                <p className="text-xs capitalize text-ink-700/50">
                  {BED_LABEL[best.bedType]} · {best.view.replace('_', ' ')} view · up to {best.maxOccupancy} guests
                </p>
                <p className="mt-2 text-xs text-springs-600">{best.reasons.join(' · ')}</p>
              </Card>
            </>
          )}

          {alternatives.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Other Categories</h2>
              <div className="flex flex-col gap-3">
                {alternatives.map((fit) => {
                  const expanded = openCategory === fit.category;
                  return (
                    <Card key={fit.category} className={chosen?.fit.category === fit.category ? 'ring-2 ring-gold-500' : ''}>
                      <button
                        className="w-full text-left"
                        onClick={() => setOpenCategory(expanded ? null : fit.category)}
                      >
                        <PriceRow name={fit.category} price={fit.nightlyPrice} from />
                        <p className="flex items-center justify-between text-xs text-ink-700/50">
                          <span>
                            {fit.variants.length} option{fit.variants.length === 1 ? '' : 's'} · up to {fit.maxOccupancy} guests
                          </span>
                          <span className="text-gold-600">{expanded ? 'Hide options ▲' : 'View options ▼'}</span>
                        </p>
                      </button>

                      {expanded && (
                        <div className="mt-3 flex flex-col gap-2 border-t border-ink-900/10 pt-3">
                          {fit.variants.map((v) => (
                            <button
                              key={`${v.bedType}-${v.view}`}
                              onClick={() => setChosen({ fit, variant: v })}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left ${
                                isChosen(fit, v) ? 'border-gold-500 bg-gold-500/10' : 'border-ink-900/10'
                              }`}
                            >
                              <span>
                                <span className="block text-sm font-medium text-ink-900">{BED_LABEL[v.bedType]}</span>
                                <span className="block text-xs capitalize text-ink-700/50">
                                  {v.view.replace('_', ' ')} view
                                  {v.availableCount === 0 ? ' · currently full' : ` · ${v.availableCount} available`}
                                </span>
                              </span>
                              <span className="text-right">
                                <span className="block text-sm font-semibold text-ink-900">
                                  ₹{v.nightlyPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="block text-[10px] text-ink-700/40">Exclusive of Taxes</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
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
            disabled={!chosen}
            onClick={() =>
              chosen &&
              navigate(
                `/traveller/book/${hotel.id}/${chosen.fit.category}/${chosen.variant.view}/${chosen.variant.bedType}`,
              )
            }
          >
            {chosen
              ? `Confirm ${chosen.fit.category} — ₹${chosen.variant.nightlyPrice.toLocaleString('en-IN')}/night`
              : 'Select a category'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ name, price, from = false }: { name: string; price: number; from?: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <p className="font-medium capitalize text-ink-900">{name}</p>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink-900">
          {from && <span className="text-xs font-normal text-ink-700/50">from </span>}
          ₹{price.toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-ink-700/40">Exclusive of Taxes</p>
      </div>
    </div>
  );
}
