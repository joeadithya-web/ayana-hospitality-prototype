import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '@ayana/shared-ui';
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
            <h2 className="mb-2 font-display text-base font-semibold text-ink-950">Photos</h2>
            <PhotoCarousel images={hotel.images} hotelName={hotel.name} />
          </section>

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

function PhotoCarousel({ images, hotelName }: { images: string[]; hotelName: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollTo(next: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setIndex(clamped);
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-xl2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${hotelName} photo ${i + 1}`}
            className="h-44 w-full flex-none snap-center object-cover"
          />
        ))}
      </div>

      {index > 0 && (
        <button
          aria-label="Previous photo"
          onClick={() => scrollTo(index - 1)}
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-sm"
        >
          ‹
        </button>
      )}
      {index < images.length - 1 && (
        <button
          aria-label="Next photo"
          onClick={() => scrollTo(index + 1)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-sm"
        >
          ›
        </button>
      )}

      <div className="mt-2 flex justify-center gap-1.5">
        {images.map((src, i) => (
          <span
            key={src}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-gold-500' : 'w-1.5 bg-ink-900/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
