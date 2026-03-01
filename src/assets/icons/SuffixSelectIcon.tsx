import { type SVGProps } from 'react';

export const SuffixSelectIcon = (props: SVGProps<SVGSVGElement>) => {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};
