import type { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ variant, size = 'md', className, ...props }: ButtonProps) => {
  const classNames = [styles.button, styles[size], variant ? styles[variant] : '', className ?? ''].filter(Boolean).join(' ');

  return <button className={classNames} {...props} />;
};
