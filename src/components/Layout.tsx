import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Search, Coffee, Heart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export const Header = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Swagger Automation', path: '/', icon: Code2 },
    { name: 'JSON Path Evaluator', path: '/jsonpath', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-black">
            <Code2 size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">API Suite</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400",
                location.pathname === item.path ? "text-emerald-500" : "text-zinc-400"
              )}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-zinc-400 hover:text-white"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 right-0 top-16 border-b border-white/10 bg-zinc-950 p-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 text-base font-medium transition-colors",
                    location.pathname === item.path ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-400 hover:bg-white/5"
                  )}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-zinc-950 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="text-emerald-500" />
              <span className="text-lg font-bold text-white">API Suite</span>
            </div>
            <p className="text-sm text-zinc-400">
              Professional browser-only tools for API developers and testers. 
              No data ever leaves your browser.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Support the Project</h3>
            <div className="flex flex-col gap-4">
              <a 
                href="https://www.paypal.com/donate?hosted_button_id=FSQJNT5N6FUZJ"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <Heart size={16} fill="currentColor" /> Donate via PayPal
              </a>
              <a 
                href="https://buymeacoffee.com/onlinetools1"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FFDD00] px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/20"
              >
                <Coffee size={16} fill="currentColor" /> Buy Me a Coffee
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Ads</h3>
            <div className="h-32 w-full rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-xs text-zinc-500">
              Google AdSense Placeholder
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} API Suite. Built for speed and privacy.
        </div>
      </div>
    </footer>
  );
};
