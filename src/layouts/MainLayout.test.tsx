import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renders Header, main content and Footer', () => {
    render(
      <MainLayout>
        <div>Inner content</div>
      </MainLayout>
    );

    // Header has role banner
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // main landmark should contain the children
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent('Inner content');

    // Footer has role contentinfo
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
