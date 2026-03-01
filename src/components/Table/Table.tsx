import { type ReactNode, useState, useMemo } from 'react';

import styles from './Table.module.css';
import { DownIcon, UpDownIcon, UpIcon } from '../../assets/icons';

export type Column<T> = {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  hiddenOnMobile?: boolean;
};

type SortDirection = 'asc' | 'desc';
type SortState = { key: string; direction: SortDirection } | null;

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string | number;
  className?: string;
};

export const Table = <T,>({ columns, data, rowKey, className }: TableProps<T>) => {
  const wrapperClass = [styles.wrapper, className ?? ''].filter(Boolean).join(' ');

  const [sort, setSort] = useState<SortState>(null);

  const handleSort = (colKey: string) => {
    setSort((prev) => {
      if (prev?.key === colKey) {
        return prev.direction === 'asc' ? { key: colKey, direction: 'desc' } : null;
      }
      return { key: colKey, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const aVal = col.sortValue!(a);
      const bVal = col.sortValue!(b);
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [data, sort, columns]);

  const getSortIndicator = (colKey: string): ReactNode => {
    if (sort?.key !== colKey) return <UpDownIcon width={12} height={12} />;
    return sort.direction === 'asc' ? <UpIcon width={12} height={12} /> : <DownIcon width={12} height={12} />;
  };

  return (
    <div className={wrapperClass}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={
                  [col.sortable ? styles.sortable : '', col.hiddenOnMobile ? styles.hiddenOnMobile : ''].filter(Boolean).join(' ') ||
                  undefined
                }
                onClick={col.sortable ? () => handleSort(col.key) : undefined}>
                {col.title}
                {col.sortable && <span className={styles.sortIndicator}>{getSortIndicator(col.key)}</span>}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedData.map((item) => (
            <tr key={rowKey(item)}>
              {columns.map((col) => (
                <td key={col.key} className={col.hiddenOnMobile ? styles.hiddenOnMobile : undefined}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
