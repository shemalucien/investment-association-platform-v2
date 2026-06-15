import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-black mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold mb-4 text-white">AMATSINDA Cooperative</h4>
            <p className="text-sm text-gray-300">
              Empowering our community through cooperative financial management and sustainable growth.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/login" className="hover:text-white">Login</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/members" className="hover:text-white">Members</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Services</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Share Purchases</li>
              <li>Loan Applications</li>
              <li>Profit Distribution</li>
              <li>Weekly Contributions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Phone: +250790255540</p>
              <p>Email: ishimweniyonshutirem53@gmail.com</p>
              <p>Location: Rwanda</p>
              <div className="flex items-center gap-3 pt-2">
                <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-700 p-2 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </Link>
                <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-700 p-2 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </Link>
                <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-700 p-2 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} AMATSINDA Cooperative. All rights reserved.</p>
          <p className="mt-2">Cooperative Management System - Building Financial Independence Together</p>
        </div>
      </div>
    </footer>
  )
}
