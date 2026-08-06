import { twMerge } from 'tailwind-merge';

/** Joins class lists and resolves conflicting Tailwind utilities so later args always win. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
