'use client';

export default function DocumentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}