import {
  type ReactNode,
  type FormEvent,
  type CSSProperties,
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import styles from './Form.module.css';

type Layout = 'horizontal' | 'vertical' | 'inline';

type Rule = {
  required?: boolean;
  message?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: unknown) => boolean | string | Promise<boolean | string>;
};

type ValidateFn = () => string;

type FormContextValue = {
  layout: Layout;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  setFieldValue: (name: string, value: unknown) => void;
  setFieldError: (name: string, error: string) => void;
  clearFieldError: (name: string) => void;
  registerField: (name: string, validateFn: ValidateFn) => void;
  unregisterField: (name: string) => void;
};

const FormContext = createContext<FormContextValue>({
  layout: 'vertical',
  values: {},
  errors: {},
  setFieldValue: () => {},
  setFieldError: () => {},
  clearFieldError: () => {},
  registerField: () => {},
  unregisterField: () => {},
});

export const useFormContext = () => useContext(FormContext);

type FormProps = {
  layout?: Layout;
  initialValues?: Record<string, unknown>;
  onFinish?: (values: Record<string, unknown>) => void;
  onFinishFailed?: (errors: Record<string, string>) => void;
  onValuesChange?: (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const FormRoot = ({
  layout = 'vertical',
  initialValues = {},
  onFinish,
  onFinishFailed,
  onValuesChange,
  className,
  style,
  children,
}: FormProps) => {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldsRef = useRef<Record<string, ValidateFn>>({});
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setFieldValue = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        onValuesChange?.({ [name]: value }, next);
        return next;
      });
    },
    [onValuesChange]
  );

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const registerField = useCallback((name: string, validateFn: ValidateFn) => {
    fieldsRef.current[name] = validateFn;
  }, []);

  const unregisterField = useCallback((name: string) => {
    delete fieldsRef.current[name];
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate all registered fields
    const newErrors: Record<string, string> = {};
    for (const [name, validateFn] of Object.entries(fieldsRef.current)) {
      const errMsg = validateFn();
      if (errMsg) {
        newErrors[name] = errMsg;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      onFinishFailed?.(newErrors);
    } else {
      onFinish?.(valuesRef.current);
    }
  };

  const ctx = useMemo(
    () => ({ layout, values, errors, setFieldValue, setFieldError, clearFieldError, registerField, unregisterField }),
    [layout, values, errors, setFieldValue, setFieldError, clearFieldError, registerField, unregisterField]
  );

  const formClass = [styles.form, styles[layout], className ?? ''].filter(Boolean).join(' ');

  return (
    <FormContext.Provider value={ctx}>
      <form className={formClass} style={style} onSubmit={handleSubmit} noValidate>
        {children}
      </form>
    </FormContext.Provider>
  );
};

type FormItemProps = {
  label?: ReactNode;
  name?: string;
  rules?: Rule[];
  required?: boolean;
  tooltip?: ReactNode;
  extra?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const validateRules = (value: unknown, rules: Rule[]): string => {
  for (const rule of rules) {
    if (rule.required) {
      if (value == null) return rule.message ?? 'This field is required';
      if (Array.isArray(value) && value.length === 0) return rule.message ?? 'This field is required';
      if (typeof value === 'string' && value.trim() === '') return rule.message ?? 'This field is required';
    }
    const strValue = value == null ? '' : String(value);
    if (rule.min !== undefined && strValue.length < rule.min) {
      return rule.message ?? `Minimum ${rule.min} characters`;
    }
    if (rule.max !== undefined && strValue.length > rule.max) {
      return rule.message ?? `Maximum ${rule.max} characters`;
    }
    if (rule.pattern && !rule.pattern.test(strValue)) {
      return rule.message ?? 'Invalid format';
    }
    if (rule.validator) {
      const result = rule.validator(value);
      if (result === false) return rule.message ?? 'Validation failed';
      if (typeof result === 'string') return result;
    }
  }
  return '';
};

const FormItem = ({ label, name, rules = [], required, tooltip, extra, className, style, children }: FormItemProps) => {
  const { layout, values, errors, setFieldValue, setFieldError, clearFieldError, registerField, unregisterField } = useFormContext();

  const isRequired = required ?? rules.some((r) => r.required);
  const error = name ? errors[name] : '';
  const value = name ? values[name] : undefined;
  const valueRef = useRef(value);
  valueRef.current = value;

  const validate = useCallback((): string => {
    if (!name || rules.length === 0) return '';
    const errMsg = validateRules(valueRef.current, rules);
    if (errMsg) {
      setFieldError(name, errMsg);
    } else {
      clearFieldError(name);
    }
    return errMsg;
  }, [name, rules, setFieldError, clearFieldError]);

  // Register/unregister this field's validate function with the form
  useEffect(() => {
    if (name) {
      registerField(name, validate);
      return () => unregisterField(name);
    }
  }, [name, validate, registerField, unregisterField]);

  const handleChange = useCallback(
    (val: unknown) => {
      if (!name) return;
      setFieldValue(name, val);
      clearFieldError(name);
    },
    [name, setFieldValue, clearFieldError]
  );

  const handleBlur = useCallback(() => {
    validate();
  }, [validate]);

  // Clone children and inject value/onChange/onBlur
  const enhancedChildren = useMemo(() => {
    if (!name || !children) return children;

    const child = children as React.ReactElement<Record<string, unknown>>;
    if (!child || typeof child !== 'object' || !('props' in child)) return children;

    const cloneProps: Record<string, unknown> = {
      value,
      onBlur: handleBlur,
    };

    cloneProps.onChange = (...args: unknown[]) => {
      const first = args[0];
      if (first && typeof first === 'object' && 'target' in (first as Record<string, unknown>)) {
        handleChange((first as React.ChangeEvent<HTMLInputElement>).target.value);
      } else {
        handleChange(first);
      }
      if (typeof child.props.onChange === 'function') {
        (child.props.onChange as (...a: unknown[]) => void)(...args);
      }
    };

    if (error) {
      cloneProps.status = 'error';
    }

    return <child.type {...child.props} {...cloneProps} />;
  }, [name, children, value, error, handleChange, handleBlur]);

  const itemClass = [styles.formItem, styles[`item-${layout}`], error ? styles.hasError : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={itemClass} style={style}>
      {label && (
        <label className={styles.label}>
          {isRequired && <span className={styles.requiredMark}>*</span>}
          {label}
          {tooltip && <span className={styles.tooltip}>{tooltip}</span>}
        </label>
      )}
      <div className={styles.control}>
        {enhancedChildren}
        {error && <div className={styles.error}>{error}</div>}
        {extra && <div className={styles.extra}>{extra}</div>}
      </div>
    </div>
  );
};

export const Form = Object.assign(FormRoot, { Item: FormItem });
export type { FormProps, FormItemProps, Rule };
