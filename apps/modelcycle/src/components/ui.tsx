import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Select as RSelect, Slider as RSlider, Switch as RSwitch, Tooltip as RTooltip } from 'radix-ui';
import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'outline' | 'solid' | 'live' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
  pressed?: boolean;
};

export function Button({ variant = 'outline', size = 'md', pressed, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={clsx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[2px] border font-medium whitespace-nowrap transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-muted',
        size === 'md' && 'h-8 px-3',
        size === 'sm' && 'h-6 px-2 text-xs',
        size === 'icon' && 'size-6',
        variant === 'outline' && 'border-ink bg-paper text-ink hover:bg-wash active:bg-line',
        variant === 'solid' && 'border-ink bg-ink text-paper hover:bg-[#2a2f37] active:bg-black',
        variant === 'live' && 'border-live-dark bg-live-dark text-paper hover:bg-live',
        variant === 'ghost' && 'border-transparent text-ink hover:bg-wash',
        pressed && variant === 'outline' && 'bg-ink! text-paper!',
        className,
      )}
      {...props}
    />
  );
}

export function Slider({
  label, value, min = 0, max = 127, step = 1, format, onChange, onCommit, disabled,
}: {
  label: string;
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  onCommit?: () => void;
  disabled?: boolean;
}) {
  const shown = value === undefined ? '--' : format ? format(value) : String(value);
  return (
    <label className="grid grid-cols-[84px_1fr_48px] items-center gap-2 text-xs">
      <span className="truncate">{label}</span>
      <RSlider.Root
        className="nopan relative flex h-5 touch-none items-center select-none data-[disabled]:opacity-40"
        value={[value ?? Math.round((min + max) / 2)]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onValueChange={([v]) => onChange(v)}
        onValueCommit={() => onCommit?.()}
      >
        <RSlider.Track className="relative h-px w-full grow bg-ink">
          {value !== undefined && <RSlider.Range className="absolute h-[3px] -translate-y-px bg-ink" />}
        </RSlider.Track>
        <RSlider.Thumb
          className={clsx('block h-3.5 w-2 cursor-grab rounded-[1px] border border-ink active:cursor-grabbing', value === undefined ? 'bg-paper' : 'bg-ink')}
        />
      </RSlider.Root>
      <span className="mono text-right">{shown}</span>
    </label>
  );
}

/** A slim level control for tight rows. Hollow and without a fill until its value is known. */
export function Fader({ label, value, max, onChange }: { label: string; value: number | undefined; max: number; onChange: (v: number) => void }) {
  return (
    <RSlider.Root
      className="nopan relative flex h-5 w-14 shrink-0 touch-none items-center select-none"
      value={[value ?? max / 2]}
      min={0}
      max={max}
      step={max / 100}
      aria-label={label}
      title={label}
      onValueChange={([v]) => onChange(v)}
    >
      <RSlider.Track className="relative h-px w-full grow bg-ink">
        {value !== undefined && <RSlider.Range className="absolute h-[3px] -translate-y-px bg-ink" />}
      </RSlider.Track>
      <RSlider.Thumb className={clsx('block h-3.5 w-2 cursor-grab rounded-[1px] border border-ink active:cursor-grabbing', value === undefined ? 'bg-paper' : 'bg-ink')} />
    </RSlider.Root>
  );
}

export function Select({
  value, onChange, options, placeholder, ariaLabel, className,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <RSelect.Root value={value} onValueChange={onChange}>
      <RSelect.Trigger
        aria-label={ariaLabel}
        className={clsx('inline-flex h-7 min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-[2px] border border-ink bg-paper px-2 text-xs hover:bg-wash', className)}
      >
        <span className="truncate"><RSelect.Value placeholder={placeholder} /></span>
        <ChevronDown className="size-3.5 shrink-0" />
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content position="popper" sideOffset={3} className="z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-auto rounded-[2px] border border-ink bg-paper text-xs shadow-[0_6px_18px_rgb(14_17_22/0.16)]">
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item key={o.value} value={o.value} disabled={o.disabled} className="flex cursor-pointer items-center justify-between gap-3 px-2 py-1.5 outline-none data-[disabled]:text-muted data-[highlighted]:bg-ink data-[highlighted]:text-paper">
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                <RSelect.ItemIndicator><Check className="size-3" /></RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
      <span>{label}</span>
      <RSwitch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-4 w-7 shrink-0 cursor-pointer rounded-[2px] border border-ink bg-paper data-[state=checked]:bg-ink"
      >
        <RSwitch.Thumb className="block size-3 translate-x-px rounded-[1px] bg-ink transition-transform duration-150 data-[state=checked]:translate-x-[13px] data-[state=checked]:bg-paper" />
      </RSwitch.Root>
    </label>
  );
}

export function Segmented<T extends string>({
  value, onChange, options, ariaLabel, className, onInk,
}: {
  value: T;
  onInk?: boolean;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={clsx('inline-flex rounded-[2px] border border-ink', className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-7 flex-1 cursor-pointer px-2.5 text-xs font-medium whitespace-nowrap',
            i > 0 && (onInk ? 'border-l border-paper' : 'border-l border-ink'),
            onInk
              ? value === o.value ? 'bg-paper text-ink' : 'bg-ink text-paper hover:bg-[#2a2f37]'
              : value === o.value ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-wash',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tip({ text, children, side }: { text: string; children: ReactNode; side?: 'right' }) {
  return (
    <RTooltip.Root delayDuration={side ? 80 : 350}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content side={side} sideOffset={side ? 8 : 5} className="z-50 max-w-60 rounded-[2px] bg-ink px-2 py-1 text-xs text-paper">{text}</RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

export const TipProvider = RTooltip.Provider;

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1 text-xs last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="mono truncate text-right">{children}</span>
    </div>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <h4 className="mb-1.5 mt-3 text-xs font-semibold first:mt-0">{children}</h4>;
}
