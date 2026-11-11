type IconProps = {
  className?: string;
};

export function DiscoverIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 5.5c1.8 2.2 2.8 4.3 2.8 6.5S13.8 16.3 12 18.5C10.2 16.3 9.2 14.2 9.2 12S10.2 7.7 12 5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M5.5 12h13" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function ActivityIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M15 17h5l-1.35-1.35A2 2 0 0 1 18 14.24V11a6 6 0 1 0-12 0v3.24c0 .53-.21 1.04-.59 1.41L4 17h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 17a3 3 0 0 0 6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReportIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7.2 8.4c0-1.4 1-2.5 2.4-2.5s2.3 1.1 2.3 2.5c0 .3 0 .5-.1.7 1-.7 2.3-.7 3.3 0-.1-.2-.1-.4-.1-.7 0-1.4 1-2.5 2.4-2.5s2.4 1.1 2.4 2.5c0 1.2-.8 2.2-2 2.4.6 1 .6 2.3 0 3.3 1.2.2 2 1.2 2 2.4 0 1.4-1 2.5-2.4 2.5-1 0-1.9-.6-2.3-1.4-.7.4-1.4.6-2.2.6s-1.5-.2-2.2-.6c-.4.8-1.3 1.4-2.3 1.4-1.4 0-2.4-1.1-2.4-2.5 0-1.2.8-2.2 2-2.4-.6-1-.6-2.3 0-3.3-1.2-.2-2-1.2-2-2.4Z" />
    </svg>
  );
}

export function FilterIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WalkIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="5" r="2.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M9 22l1.4-6L8 14l2-5 4 2 2.5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 11.5 17 22"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
