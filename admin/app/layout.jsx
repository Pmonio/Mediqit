import { ClerkProvider } from "@clerk/nextjs";
import "./shell.css";

export const metadata = {
  title: "Mediqit Admin",
  description: "Secure Mediqit operations dashboard",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
