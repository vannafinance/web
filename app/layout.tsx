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
        <div className="w-9/12 mx-auto my-12">{children}</div>
      </body>
    </html>
  );
}
