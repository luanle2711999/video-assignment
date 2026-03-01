import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, type Column } from './Table';

type Item = { id: number; name: string; age: number };

const columns: Column<Item>[] = [
  {
    key: 'name',
    title: 'Name',
    render: (it) => it.name,
    sortable: true,
    sortValue: (it) => it.name.toLowerCase(),
  },
  {
    key: 'age',
    title: 'Age',
    render: (it) => it.age,
    sortable: true,
    sortValue: (it) => it.age,
    hiddenOnMobile: true,
  },
  {
    key: 'static',
    title: 'Static',
    render: () => 'X',
  },
];

const data: Item[] = [
  { id: 1, name: 'Charlie', age: 35 },
  { id: 2, name: 'Alice', age: 30 },
  { id: 3, name: 'Bob', age: 25 },
];

describe('Table', () => {
  it('renders headers and rows in given order', () => {
    render(<Table columns={columns} data={data} rowKey={(i) => i.id} />);

    // headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Static')).toBeInTheDocument();

    // rows (header is a row as well)
    const rows = screen.getAllByRole('row');
    // rows[0] header, rows[1] first data row
    expect(rows[1]).toHaveTextContent('Charlie');
    expect(rows[2]).toHaveTextContent('Alice');
    expect(rows[3]).toHaveTextContent('Bob');
  });

  it('sorts ascending on first click, descending on second, and resets on third', async () => {
    const user = userEvent.setup();
    render(<Table columns={columns} data={data} rowKey={(i) => i.id} />);

    const nameHeader = screen.getByText('Name');

    // first click -> asc
    await user.click(nameHeader);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alice');
    expect(rows[2]).toHaveTextContent('Bob');
    expect(rows[3]).toHaveTextContent('Charlie');

    // second click -> desc
    await user.click(nameHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Charlie');
    expect(rows[2]).toHaveTextContent('Bob');
    expect(rows[3]).toHaveTextContent('Alice');

    // third click -> reset (original order)
    await user.click(nameHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Charlie');
    expect(rows[2]).toHaveTextContent('Alice');
    expect(rows[3]).toHaveTextContent('Bob');
  });

  it('does not sort when column has no sortValue', async () => {
    const user = userEvent.setup();
    // make a column without sortValue
    const cols = [{ key: 's', title: 'S', render: (i: Item) => i.name, sortable: true }];
    render(<Table columns={cols as unknown as Column<Item>[]} data={data} rowKey={(i) => i.id} />);

    const header = screen.getByText('S');
    await user.click(header);

    const rows = screen.getAllByRole('row');
    // order should remain original
    expect(rows[1]).toHaveTextContent('Charlie');
  });

  it('applies hiddenOnMobile class to th/td when specified', () => {
    render(<Table columns={columns} data={data} rowKey={(i) => i.id} />);

    // find all cells with Age content and check className includes hiddenOnMobile
    const ageHeader = screen.getByText('Age');
    expect(ageHeader.className).toContain('hiddenOnMobile');

    // first data row second cell
    const rows = screen.getAllByRole('row');
    const firstDataCells = within(rows[1]).getAllByRole('cell');
    expect(firstDataCells[1]).toHaveClass('hiddenOnMobile');
  });
});
