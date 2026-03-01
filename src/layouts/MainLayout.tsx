import type { ReactNode } from 'react';

import styles from './MainLayout.module.css';
import Header from './Header';
import Footer from './Footer';

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <>
      <Header />

      <main className={styles.main}>{children}</main>

      <Footer />
    </>
  );
};
