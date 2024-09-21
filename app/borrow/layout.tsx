"use client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="container w-full mx-auto px-3 md:px-5 lg:px-7 xl:px-20 my-14">{children}</div>;
}
