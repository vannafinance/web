"use client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="container mx-auto w-full px-3 sm:px-5 lg:px-7 my-12 dark:bg-baseDark">{children}</div>;
}
