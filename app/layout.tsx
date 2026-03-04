import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Mahfod App - تطبيق محفوظ",
    description: "Scientifically-backed memorization tool for Islamic sciences, poetry, and hadith.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
            </head>
            <body className="font-arabic bg-slate-50 text-slate-800 antialiased min-h-screen">
                {children}
            </body>
        </html>
    );
}
