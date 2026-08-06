import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@ayana/shared-ui';

export function Splash() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-ink-950 px-8 py-16 text-center text-cream-50">
      <div />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-xs uppercase tracking-[0.4em] text-gold-400">Home to Room</p>
        <h1 className="mt-4 font-display text-5xl font-semibold">AYANA</h1>
        <p className="mx-auto mt-4 max-w-xs text-sm text-cream-50/70">
          Book, verify, personalise, arrive, and enter your room — with minimal waiting.
        </p>
        <p className="mt-8 text-xs uppercase tracking-wide text-cream-50/40">
          Featuring <span className="text-gold-400">Springs by JORA</span>
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-full max-w-xs">
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/traveller/login')}>
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}
