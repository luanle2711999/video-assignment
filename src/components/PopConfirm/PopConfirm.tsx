import {
  type ReactNode,
  type CSSProperties,
  type ReactElement,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  cloneElement,
  isValidElement,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './PopConfirm.module.css';
import { NoteIcon } from '../../assets/icons';

type Placement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom';

type Trigger = 'click' | 'hover' | 'focus';

export type PopConfirmProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger';
  showCancel?: boolean;
  okButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  cancelButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  placement?: Placement;
  trigger?: Trigger;
  disabled?: boolean;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  overlayClassName?: string;
  overlayStyle?: CSSProperties;
  zIndex?: number;
  getPopupContainer?: () => HTMLElement;
  children: ReactElement;
};

const stylesRecord = styles as Record<string, string>;
const defaultIcon = <NoteIcon />;

export const PopConfirm = ({
  title,
  description,
  icon = defaultIcon,
  okText = 'Yes',
  cancelText = 'No',
  okType = 'primary',
  showCancel = true,
  okButtonProps,
  cancelButtonProps,
  open: controlledOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  placement = 'top',
  trigger = 'click',
  disabled = false,
  mouseEnterDelay = 100,
  mouseLeaveDelay = 100,
  overlayClassName,
  overlayStyle,
  zIndex = 1060,
  getPopupContainer,
  children,
}: PopConfirmProps) => {
  const isControlled = controlledOpen !== undefined;
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : innerOpen;

  const [confirmLoading, setConfirmLoading] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [position, setPosition] = useState<CSSProperties>({
    position: 'absolute',
    top: -9999,
    left: -9999,
    visibility: 'hidden' as const,
  });
  const [positionReady, setPositionReady] = useState(false);

  const setOpen = useCallback(
    (next: boolean, force = false) => {
      if (confirmLoading && !force) return;
      if (!next) {
        setPositionReady(false);
        setPosition({
          position: 'absolute',
          top: -9999,
          left: -9999,
          visibility: 'hidden' as const,
        });
      }
      if (!isControlled) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange, confirmLoading]
  );

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !isOpen) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'topLeft':
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX;
        break;
      case 'topRight':
        top = rect.top + scrollY - 8;
        left = rect.right + scrollX;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottomLeft':
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX;
        break;
      case 'bottomRight':
        top = rect.bottom + scrollY + 8;
        left = rect.right + scrollX;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 8;
        break;
      case 'leftTop':
        top = rect.top + scrollY;
        left = rect.left + scrollX - 8;
        break;
      case 'leftBottom':
        top = rect.bottom + scrollY;
        left = rect.left + scrollX - 8;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 8;
        break;
      case 'rightTop':
        top = rect.top + scrollY;
        left = rect.right + scrollX + 8;
        break;
      case 'rightBottom':
        top = rect.bottom + scrollY;
        left = rect.right + scrollX + 8;
        break;
      default:
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
    }

    setPosition({ top, left, position: 'absolute', zIndex, visibility: 'visible' as const });
    setPositionReady(true);
  }, [isOpen, placement, zIndex]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (confirmLoading) return;
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target) && overlayRef.current && !overlayRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpen, confirmLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (confirmLoading) return;
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, setOpen, confirmLoading]);

  const handleConfirm = async () => {
    if (onConfirm) {
      const result = onConfirm();
      if (result instanceof Promise) {
        setConfirmLoading(true);
        try {
          await result;
        } finally {
          setConfirmLoading(false);
        }
      }
    }
    setOpen(false, true);
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  const triggerRefCallback = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  const childProps: Record<string, unknown> = { ref: triggerRefCallback };

  if (!disabled) {
    if (trigger === 'click') {
      childProps.onClick = (e: React.MouseEvent) => {
        if (confirmLoading) return;
        setOpen(!isOpen);
        const originalOnClick = (children.props as Record<string, unknown>)?.onClick;
        if (typeof originalOnClick === 'function') {
          originalOnClick(e);
        }
      };
    } else if (trigger === 'hover') {
      childProps.onMouseEnter = () => {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => setOpen(true), mouseEnterDelay);
      };
      childProps.onMouseLeave = () => {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => setOpen(false), mouseLeaveDelay);
      };
    } else if (trigger === 'focus') {
      childProps.onFocus = () => setOpen(true);
      childProps.onBlur = () => setOpen(false);
    }
  }

  const child = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, childProps) : children;

  const placementClass = stylesRecord[`placement-${placement}`] ?? stylesRecord['placement-top'];

  const overlay = isOpen ? (
    <div
      ref={overlayRef}
      className={`${stylesRecord.overlay} ${placementClass} ${overlayClassName ?? ''}`}
      style={{
        ...position,
        ...overlayStyle,
        pointerEvents: positionReady ? 'auto' : 'none',
      }}
      onMouseEnter={trigger === 'hover' ? () => clearTimeout(hoverTimerRef.current) : undefined}
      onMouseLeave={
        trigger === 'hover'
          ? () => {
              hoverTimerRef.current = setTimeout(() => setOpen(false), mouseLeaveDelay);
            }
          : undefined
      }>
      <div className={stylesRecord.arrow} />
      <div className={stylesRecord.inner}>
        <div className={stylesRecord.message}>
          {icon && <span className={stylesRecord.icon}>{icon}</span>}
          <div className={stylesRecord.messageContent}>
            <div className={stylesRecord.title}>{title}</div>
            {description && <div className={stylesRecord.description}>{description}</div>}
          </div>
        </div>
        <div className={stylesRecord.buttons}>
          {showCancel && (
            <button className={stylesRecord.cancelBtn} onClick={handleCancel} {...cancelButtonProps}>
              {cancelText}
            </button>
          )}
          <button
            className={`${stylesRecord.okBtn} ${stylesRecord[okType]}`}
            onClick={handleConfirm}
            disabled={confirmLoading}
            {...okButtonProps}>
            {confirmLoading && <span className={stylesRecord.spinner} />}
            {okText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const container = getPopupContainer?.() ?? document.body;

  return (
    <>
      {child}
      {overlay && createPortal(overlay, container)}
    </>
  );
};
