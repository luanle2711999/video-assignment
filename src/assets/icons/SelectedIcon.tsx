import { type SVGProps } from 'react';

export const SelectedIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
};
