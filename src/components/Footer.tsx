import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-6 px-8 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 font-medium">
        <div>
          © {currentYear} LogiTrack Dashboard. All rights reserved.
        </div>
        <div className="flex items-center gap-1">
          Developed by <span className="text-brand-accent font-bold">Island Web Consultants</span>
        </div>
      </div>
    </footer>
  );
}
