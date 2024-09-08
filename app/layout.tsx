import Navbar from "./ui/header/navbar";
import { publicSans } from "./ui/fonts";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.className} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
