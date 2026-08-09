import { motion } from 'framer-motion';

export interface ProgressStep {
  key: string;
  label: string;
  done: boolean;
  /** Optional short factual line rendered under the label — e.g. why an item can't be guaranteed. */
  note?: string;
}

export function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-start gap-3">
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
          <div className="flex flex-col">
            <span className={step.done ? 'text-ink-900 font-medium' : 'text-ink-700/60'}>{step.label}</span>
            {step.note && <span className="mt-0.5 text-xs text-ink-700/50">{step.note}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
