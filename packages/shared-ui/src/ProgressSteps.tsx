import { motion } from 'framer-motion';

export interface ProgressStep {
  key: string;
  label: string;
  done: boolean;
}

export function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center gap-3">
          <motion.span
            initial={false}
            animate={{
              backgroundColor: step.done ? '#C6A15B' : 'rgba(15,22,38,0.08)',
              color: step.done ? '#0A0F1C' : '#64748b',
            }}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold"
          >
            {step.done ? '✓' : index + 1}
          </motion.span>
          <span className={step.done ? 'text-ink-900 font-medium' : 'text-ink-700/60'}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
