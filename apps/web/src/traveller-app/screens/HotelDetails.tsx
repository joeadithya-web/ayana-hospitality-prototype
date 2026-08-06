import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, PageHeader } from '@ayana/shared-ui';
import { useHotel } from '../hooks';

const MOCK_REVIEWS = [
  { author: 'Priya S.', rating: 5, text: 'Seamless check-in, exactly matched my AYANA Memory preferences.' },
  { author: 'Vikram R.', rating: 4, text: 'Great business amenities, room was ready before I even arrived.' },
];

export function HotelDetails() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const hotel = useHotel(hotelId);

  if (!hotel) return null;

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div className="mx-auto max-w-md">
        <div className="relative">
          <img src={hotel.images[0]} alt={hotel.name} className="h-56 w-full object-cover" />
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-900"
          >
            ←
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-950">{hotel.name}</h1>
              <p className="text-sm text-ink-700/60">{hotel.address}</p>
            </div>
            {hotel.isFlagship && <Badge tone="gold">Flagship</Badge>}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-ink-700/70">
            <Badge tone="neutral">{hotel.starRating}★</Badge>
            <span>{hotel.reviewRating} · {hotel.reviewCount} reviews</span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-700/80">{hotel.description}</p>

          <section className="mt-6">
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((a) => (
                <Badge key={a} tone="neutral">{a}</Badge>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Available Offers</h2>
            <Card className="bg-springs-500/10">
              <p className="text-sm font-medium text-springs-600">Hotel-approved: 10% off room upgrades this month</p>
            </Card>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Guest Reviews</h2>
            <div className="flex flex-col gap-2">
              {MOCK_REVIEWS.map((r) => (
                <Card key={r.author}>
                  <p className="text-sm font-medium text-ink-900">{r.author} · {'★'.repeat(r.rating)}</p>
                  <p className="text-sm text-ink-700/60">{r.text}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Map</h2>
            <div className="flex h-28 items-center justify-center rounded-xl2 bg-ink-900/5 text-xs text-ink-700/40">
              Map preview (simulated) — {hotel.address}
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button fullWidth size="lg" onClick={() => navigate(`/traveller/hotel/${hotel.id}/rooms`)}>
            Select Room — from ₹{hotel.priceFloor.toLocaleString('en-IN')}
          </Button>
        </div>
      </div>
    </div>
  );
}
