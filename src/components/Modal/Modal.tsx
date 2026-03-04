import { type ReactNode, type MouseEvent, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { ClearIcon } from '../../assets/icons';

export type ModalProps = {
  /** Whether the modal is visible */
  open: boolean;
  /** Modal title */
  title?: ReactNode;
  /** Custom footer. Set to `null` to hide footer */
  footer?: ReactNode | null;
  /** Width of the modal */
  width?: number | string;
  /** Whether to show the close icon */
  closable?: boolean;
  /** Custom close icon */
  closeIcon?: ReactNode;
  /** Whether to show the mask */
  mask?: boolean;
  /** Whether clicking the mask closes the modal */
  maskClosable?: boolean;
  /** Whether to center the modal vertically */
  centered?: boolean;
  /** Text of the OK button */
  okText?: string;
  /** Text of the Cancel button */
  cancelText?: string;
  /** OK button variant */
  okType?: 'primary' | 'secondary' | 'danger';
  /** Whether the OK button is loading */
  confirmLoading?: boolean;
  /** Whether to destroy the modal content when closed */
  destroyOnClose?: boolean;
  /** Custom z-index */
  zIndex?: number;
  /** Class name for the modal wrapper */
  className?: string;
  /** Custom styles for the modal body */
  bodyStyle?: React.CSSProperties;
  /** Custom styles for the mask */
  maskStyle?: React.CSSProperties;
  /** Callback when OK button is clicked */
  onOk?: () => void;
  /** Callback when Cancel button is clicked or modal is closed */
  onCancel?: () => void;
  /** Callback after the modal is closed (transition ended) */
  afterClose?: () => void;
  /** Container to render the modal into */
  getContainer?: HTMLElement | false;
  /** Modal content */
  children?: ReactNode;
};

export const Modal = ({
  open,
  title,
  footer,
  width = 520,
  closable = true,
  closeIcon,
  mask = true,
  maskClosable = true,
  centered = false,
  okText = 'OK',
  cancelText = 'Cancel',
  okType = 'primary',
  confirmLoading = false,
  destroyOnClose = false,
  zIndex = 1000,
  className,
  bodyStyle,
  maskStyle,
  onOk,
  onCancel,
  afterClose,
  getContainer,
  children,
}: ModalProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onCancel?.();
      }
    },
    [open, onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      afterClose?.();
    }
  }, [open, afterClose]);

  const handleMaskClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && maskClosable) {
      onCancel?.();
    }
  };

  if (!open && destroyOnClose) {
    return null;
  }

  const defaultFooter = (
    <div className={styles.footer}>
      <button className={styles.cancelBtn} onClick={onCancel}>
        {cancelText}
      </button>
      <button data-testid="modal-ok-button" className={`${styles.okBtn} ${styles[okType]}`} onClick={onOk} disabled={confirmLoading}>
        {confirmLoading && <span data-testid="modal-spinner" className={styles.spinner} />}
        {okText}
      </button>
    </div>
  );

  const resolvedFooter = footer === null ? null : (footer ?? defaultFooter);

  const modalContent = (
    <div className={`${styles.root} ${open ? styles.open : styles.closed} ${className ?? ''}`} style={{ zIndex }}>
      {mask && <div data-testid="modal-mask" className={styles.mask} style={maskStyle} onClick={handleMaskClick} />}
      <div className={`${styles.wrap} ${centered ? styles.centered : ''}`} onClick={handleMaskClick}>
        <div className={styles.modal} style={{ width }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          {closable && (
            <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
              {closeIcon ?? <ClearIcon width={16} height={16} />}
            </button>
          )}
          {title && (
            <div className={styles.header} id="modal-title">
              {title}
            </div>
          )}
          <div className={styles.body} style={bodyStyle}>
            {children}
          </div>
          {resolvedFooter}
        </div>
      </div>
    </div>
  );

  if (!getContainer) {
    return modalContent;
  }
  // https://react.dev/reference/react-dom/createPortal
  return createPortal(modalContent, getContainer ?? document.body);
};
