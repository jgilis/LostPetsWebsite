type IconProps = {
  className?: string;
};

export function DiscoverIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 4.15 14.95 12 12 10.55 9.05 12Z" fill="currentColor" />
      <path
        d="M12 19.85 9.05 12 12 13.45 14.95 12Z"
        fill="currentColor"
        opacity="0.38"
      />
      <circle cx="12" cy="12" r="1.85" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="1.85"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.35"
      />
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
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M8 5.6h8A2.4 2.4 0 0 1 18.4 8v11A2.4 2.4 0 0 1 16 21.4H8A2.4 2.4 0 0 1 5.6 19V8A2.4 2.4 0 0 1 8 5.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M9.2 5.6V4.7A1.7 1.7 0 0 1 10.9 3h2.2A1.7 1.7 0 0 1 14.8 4.7v.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 11.2v6.2M8.9 14.3h6.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
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
