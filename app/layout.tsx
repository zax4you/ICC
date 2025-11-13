import "./../styles/globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "ICC Trading App",
  description: "Analyze trades with ICC & confluence method"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text1 min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
