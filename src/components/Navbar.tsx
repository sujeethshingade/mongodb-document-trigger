import Link from 'next/link';

export default function Navbar() {
    return(
        <nav className="bg-blue-600 p-4 text-white">
          <div className="container mx-auto flex justify-between">
            <Link href="/" className="font-bold text-xl">
              MongoDB Trigger
            </Link>
            <div className="space-x-4">
              <Link href="/users" className="hover:underline">
                Users
              </Link>
              <Link href="/audit-logs" className="hover:underline">
                Audit Logs
              </Link>
            </div>
          </div>
        </nav>
    )
}