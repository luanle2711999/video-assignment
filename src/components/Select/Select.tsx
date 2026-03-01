import { type ReactNode, type CSSProperties, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styles from './Select.module.css';
import { ClearIcon, SelectedIcon } from '../../assets/icons';
import { SuffixSelectIcon } from '../../assets/icons/SuffixSelectIcon';

export type SelectOption = {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
};

export type SelectProps = {
  /** Current value (controlled) */
  value?: string | number | (string | number)[] | null;
  /** Default value (uncontrolled) */
  defaultValue?: string | number | (string | number)[] | null;
  /** List of options */
  options?: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether to allow clearing */
  allowClear?: boolean;
  /** Whether to show search input */
  showSearch?: boolean;
  /** Filter function for search */
  filterOption?: (input: string, option: SelectOption) => boolean;
  /** Custom not found content */
  notFoundContent?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Validation status */
  status?: 'error' | 'warning';
  /** Whether the dropdown is open (controlled) */
  open?: boolean;
  /** Custom dropdown className */
  popupClassName?: string;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: CSSProperties;
  /** Custom suffix icon */
  suffixIcon?: ReactNode;
  /** Whether to render dropdown inline */
  getPopupContainer?: HTMLElement | false;
  /** Enable multiple selection */
  mode?: 'multiple' | undefined;
  /** Callback when value changes */
  onChange?: (value: string | number | (string | number)[] | null, option?: SelectOption | SelectOption[]) => void;
  /** Callback when dropdown open state changes */
  onDropdownVisibleChange?: (open: boolean) => void;
  /** Callback when search input changes */
  onSearch?: (value: string) => void;
  /** Callback when select is focused */
  onFocus?: () => void;
  /** Callback when select is blurred */
  onBlur?: () => void;
};

const defaultFilterOption = (input: string, option: SelectOption): boolean => {
  const label = typeof option.label === 'string' ? option.label : String(option.value);
  return label.toLowerCase().includes(input.toLowerCase());
};

export const Select = ({
  value,
  defaultValue,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  allowClear = false,
  showSearch = false,
  filterOption = defaultFilterOption,
  notFoundContent = 'No data',
  size = 'md',
  status,
  open: controlledOpen,
  popupClassName,
  className,
  style,
  suffixIcon,
  getPopupContainer,
  mode,
  onChange,
  onDropdownVisibleChange,
  onSearch,
  onFocus,
  onBlur,
}: SelectProps) => {
  const isMultiple = mode === 'multiple';
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState<string | number | (string | number)[] | null>(defaultValue ?? (isMultiple ? [] : null));
  const currentValue = isControlled ? value : innerValue;

  const isOpenControlled = controlledOpen !== undefined;
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = isOpenControlled ? controlledOpen : innerOpen;

  const [searchValue, setSearchValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) {
        setInnerOpen(nextOpen);
      }
      onDropdownVisibleChange?.(nextOpen);
    },
    [isOpenControlled, onDropdownVisibleChange]
  );

  const selectedOption = useMemo(() => {
    if (isMultiple) {
      const vals = (currentValue as (string | number)[]) ?? [];
      return options.filter((o) => vals.includes(o.value));
    }
    return options.find((o) => o.value === currentValue);
  }, [options, currentValue, isMultiple]);

  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchValue) return options;
    return options.filter((o) => filterOption(searchValue, o));
  }, [options, showSearch, searchValue, filterOption]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
    if (!isOpen) {
      setSearchValue('');
      setActiveIndex(-1);
    }
  }, [isOpen, showSearch]);

  // Position dropdown
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isMultiple) {
      setOpen(!isOpen);
    } else {
      setOpen(true);
    }
    if (!isOpen) onFocus?.();
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    if (isMultiple) {
      const vals = ((currentValue as (string | number)[]) ?? []).slice();
      const idx = vals.indexOf(option.value);
      let nextVals: (string | number)[];
      if (idx >= 0) {
        nextVals = vals.filter((v) => v !== option.value);
      } else {
        nextVals = [...vals, option.value];
      }
      if (!isControlled) {
        setInnerValue(nextVals);
      }
      const selectedOpts = options.filter((o) => nextVals.includes(o.value));
      onChange?.(nextVals, selectedOpts);
      setSearchValue('');
    } else {
      if (!isControlled) {
        setInnerValue(option.value);
      }
      onChange?.(option.value, option);
      setOpen(false);
      setSearchValue('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isControlled) {
      setInnerValue(isMultiple ? [] : null);
    }
    onChange?.(isMultiple ? [] : null);
    setSearchValue('');
  };

  const handleRemoveTag = (val: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const vals = ((currentValue as (string | number)[]) ?? []).filter((v) => v !== val);
    if (!isControlled) {
      setInnerValue(vals);
    }
    const selectedOpts = options.filter((o) => vals.includes(o.value));
    onChange?.(vals, selectedOpts);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch?.(val);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setOpen(true);
        } else {
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= filteredOptions.length ? 0 : next;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (!isOpen) {
          setOpen(true);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSearchValue('');
        break;
      case 'Backspace':
        if (isMultiple && !searchValue) {
          const vals = (currentValue as (string | number)[]) ?? [];
          if (vals.length > 0) {
            const nextVals = vals.slice(0, -1);
            if (!isControlled) {
              setInnerValue(nextVals);
            }
            const selectedOpts = options.filter((o) => nextVals.includes(o.value));
            onChange?.(nextVals, selectedOpts);
          }
        }
        break;
    }
  };

  const selectorClass = [
    styles.selector,
    styles[size],
    status ? styles[status] : '',
    disabled ? styles.disabled : '',
    isOpen ? styles.focused : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const dropdown = isOpen ? (
    <div ref={dropdownRef} data-testid="select-dropdown" className={`${styles.dropdown} ${popupClassName ?? ''}`} style={dropdownStyle}>
      {showSearch && (
        <div className={styles.searchWrapper}>
          <input
            ref={searchInputRef}
            data-testid="select-search"
            className={styles.searchInput}
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search..."
            autoComplete="off"
          />
        </div>
      )}
      <div className={styles.optionList}>
        {filteredOptions.length === 0 ? (
          <div className={styles.empty}>{notFoundContent}</div>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = isMultiple
              ? ((currentValue as (string | number)[]) ?? []).includes(option.value)
              : option.value === currentValue;
            const isActive = index === activeIndex;
            const optionClass = [
              styles.option,
              isSelected ? styles.selected : '',
              isActive ? styles.active : '',
              option.disabled ? styles.optionDisabled : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={option.value}
                data-testid={`select-option-${option.value}`}
                className={optionClass}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                aria-selected={isSelected}>
                {option.label}
                {isSelected && (
                  <span className={styles.checkIcon}>
                    <SelectedIcon width={14} height={14} />
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  const showClearBtn =
    allowClear &&
    !disabled &&
    (isMultiple ? ((currentValue as (string | number)[]) ?? []).length > 0 : currentValue !== null && currentValue !== undefined);

  const renderSelection = () => {
    if (isMultiple) {
      const selected = (selectedOption as SelectOption[]) ?? [];
      if (selected.length === 0) {
        return <span className={styles.placeholder}>{placeholder}</span>;
      }
      return (
        <span className={styles.tags}>
          {selected.map((opt) => (
            <span key={opt.value} className={styles.tag}>
              <span className={styles.tagLabel}>{opt.label}</span>
              <span data-testid={`tag-close-${opt.value}`} className={styles.tagClose} onClick={(e) => handleRemoveTag(opt.value, e)}>
                <ClearIcon width={10} height={10} />
              </span>
            </span>
          ))}
        </span>
      );
    }

    const single = selectedOption as SelectOption | undefined;
    return single ? <span className={styles.label}>{single.label}</span> : <span className={styles.placeholder}>{placeholder}</span>;
  };

  return (
    <>
      <div
        ref={selectRef}
        data-testid="select-root"
        className={selectorClass}
        style={style}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        aria-expanded={isOpen}
        aria-haspopup="listbox">
        <span className={styles.selectionItem}>{renderSelection()}</span>
        <span className={styles.suffixWrapper}>
          {showClearBtn && (
            <span data-testid="select-clear" className={styles.clearBtn} onClick={handleClear} role="button" tabIndex={-1}>
              <ClearIcon width={12} height={12} />
            </span>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
            {suffixIcon ?? <SuffixSelectIcon width={12} height={12} />}
          </span>
        </span>
      </div>
      {getPopupContainer === false ? dropdown : dropdown && createPortal(dropdown, getPopupContainer ?? document.body)}
    </>
  );
};
