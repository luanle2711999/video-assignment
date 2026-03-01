import { type InputHTMLAttributes, type ReactNode, type Ref, useState, useCallback } from 'react';

import styles from './Input.module.css';
import { ClearIcon } from '../../assets/icons';

type InputSize = 'sm' | 'md' | 'lg';
type InputStatus = 'error' | 'warning';

type InputProps = {
  /** Prefix icon or element inside the input */
  prefix?: ReactNode;
  /** Suffix icon or element inside the input */
  suffix?: ReactNode;
  /** Element placed before the input (outside, attached) */
  addonBefore?: ReactNode;
  /** Element placed after the input (outside, attached) */
  addonAfter?: ReactNode;
  /** Allow clearing the input value */
  allowClear?: boolean;
  /** Size variant */
  size?: InputSize;
  /** Validation status */
  status?: InputStatus;
  /** Ref forwarded to the native input */
  ref?: Ref<HTMLInputElement>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>;

export const Input = ({
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  allowClear = false,
  size = 'md',
  status,
  disabled,
  className,
  value,
  defaultValue,
  onChange,
  ref,
  ...props
}: InputProps) => {
  const [innerValue, setInnerValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : innerValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInnerValue(e.target.value);
      }
      onChange?.(e);
    },
    [isControlled, onChange]
  );

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInnerValue('');
    }
    // Dispatch a synthetic change event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    const input = document.querySelector(`.${styles.input}`) as HTMLInputElement | null;
    if (input && nativeInputValueSetter) {
      nativeInputValueSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [isControlled]);

  const showClear = allowClear && String(currentValue).length > 0 && !disabled;

  const wrapperClass = [styles.inputWrapper, styles[size], status ? styles[status] : '', disabled ? styles.disabled : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  const inputEl = (
    <span className={wrapperClass} style={{ display: 'flex', alignItems: 'center' }}>
      {prefix && (
        <span className={styles.prefix} style={{ display: 'flex', alignItems: 'center' }}>
          {prefix}
        </span>
      )}
      <input ref={ref} className={styles.input} disabled={disabled} value={currentValue} onChange={handleChange} {...props} />
      {showClear && (
        <span className={styles.clearBtn} onClick={handleClear} role="button" tabIndex={-1}>
          <ClearIcon />
        </span>
      )}
      {suffix && (
        <span className={styles.suffix} style={{ display: 'flex', alignItems: 'center' }}>
          {suffix}
        </span>
      )}
    </span>
  );

  if (!addonBefore && !addonAfter) {
    return inputEl;
  }

  return (
    <span className={styles.group}>
      {addonBefore && <span className={styles.addonBefore}>{addonBefore}</span>}
      {inputEl}
      {addonAfter && <span className={styles.addonAfter}>{addonAfter}</span>}
    </span>
  );
};
