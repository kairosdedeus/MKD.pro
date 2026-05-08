import type { ReactNode, SVGProps } from "react";

type MinistryIconProps = SVGProps<SVGSVGElement>;

const cyan = "#29ABD4";
const grey = "#DCE7EC";
const darkGrey = "#8FA2AA";

function MinimalLogoMark({
  children,
  ...props
}: MinistryIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M57 24A24 24 0 0 1 57 72V62A14 14 0 0 0 57 34V24Z" fill={grey} />
      <path d="M29 22V74" stroke={cyan} strokeWidth="7" />
      <path
        d="M36 48L51 33"
        stroke={cyan}
        strokeWidth="6.5"
        strokeLinecap="square"
      />
      <path
        d="M36 48L51 63"
        stroke={cyan}
        strokeWidth="6.5"
        strokeLinecap="square"
      />
      {children}
    </svg>
  );
}

export function WorshipIcon(props: MinistryIconProps) {
  return (
    <MinimalLogoMark {...props}>
      <path
        d="M65 31V57"
        stroke={darkGrey}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path d="M65 32C72 35 78 31 82 26V40C76 44 70 45 65 42V32Z" fill={cyan} />
      <circle cx="61.5" cy="65" r="6.5" fill={cyan} />
    </MinimalLogoMark>
  );
}

export function DanceIcon(props: MinistryIconProps) {
  return (
    <MinimalLogoMark {...props}>
      <circle cx="68" cy="31" r="6" fill={darkGrey} />
      <path
        d="M67 39C61 45 59 51 59 59"
        stroke={darkGrey}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M62 47C69 49 76 46 82 39"
        stroke={cyan}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M59 59C66 61 72 67 77 75"
        stroke={cyan}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M59 59C55 66 50 71 43 74"
        stroke={darkGrey}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </MinimalLogoMark>
  );
}

export function MediaIcon(props: MinistryIconProps) {
  return (
    <MinimalLogoMark {...props}>
      <rect
        x="59"
        y="36"
        width="25"
        height="18"
        rx="4"
        stroke={darkGrey}
        strokeWidth="5"
      />
      <path d="M69 41L77 45L69 49V41Z" fill={cyan} />
      <path
        d="M71.5 56V66"
        stroke={darkGrey}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M63 69H80"
        stroke={cyan}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </MinimalLogoMark>
  );
}
