'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { FileText, Github, Home } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Audit Logs', href: '/logs', icon: FileText },
    ];

    return (
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                <div className="flex items-center space-x-8">
                    <Link href="/" className="flex items-center space-x-3 font-semibold text-xl hover:text-foreground/80 transition-colors group">
                        <div className="flex flex-col">
                            <span className="lg:inline text-foreground">MongoDB Document Trigger</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center space-x-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.href}
                                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                                    size="sm"
                                    asChild
                                    className="h-9 px-3 font-medium"
                                >
                                    <Link href={item.href} className="flex items-center space-x-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Mobile Navigation */}
                    <div className="md:hidden flex items-center space-x-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.href}
                                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                                    size="sm"
                                    asChild
                                    className="h-9 w-9 p-0"
                                >
                                    <Link href={item.href} title={item.name}>
                                        <Icon className="h-4 w-4" />
                                    </Link>
                                </Button>
                            );
                        })}
                    </div>

                    {/* GitHub Link */}
                    <Button variant="outline" size="sm" asChild className="h-9">
                        <a
                            href="https://github.com/sujeethshingade/mongodb-document-trigger"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                        >
                            <Github className="h-4 w-4" />
                            <span className="hidden sm:inline px-1">GitHub</span>
                        </a>
                    </Button>
                </div>
            </div>
        </nav>
    );
}