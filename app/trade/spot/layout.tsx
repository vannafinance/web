"use client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="w-full px-3 sm:px-5 lg:w-9/12 mx-auto my-12">{children}</div>;
}
