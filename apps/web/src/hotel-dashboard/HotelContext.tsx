import { createContext, useContext, useState, type ReactNode } from 'react';

interface HotelContextValue {
  hotelId: string;
  setHotelId: (id: string) => void;
}

const HotelContext = createContext<HotelContextValue | null>(null);

export function HotelProvider({ defaultHotelId, children }: { defaultHotelId: string; children: ReactNode }) {
  const [hotelId, setHotelId] = useState(defaultHotelId);
  return <HotelContext.Provider value={{ hotelId, setHotelId }}>{children}</HotelContext.Provider>;
}

export function useSelectedHotelId(): HotelContextValue {
  const ctx = useContext(HotelContext);
  if (!ctx) throw new Error('useSelectedHotelId must be used within HotelProvider');
  return ctx;
}
