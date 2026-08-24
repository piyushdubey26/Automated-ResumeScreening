import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="site-footer text-sm">
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
      <div className="grid gap-10 border-b border-[#42616d] pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-white"><span className="flex h-8 w-8 items-center justify-center rounded bg-[#a84c38]"><Sparkles className="h-4 w-4" /></span>ResumeAI</Link><p className="mt-4 max-w-sm leading-6 text-[#b8c8cc]">Practical resume feedback for people looking for their next role—and teams looking for the right people.</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#edbcae]">Explore</p><div className="mt-4 space-y-3 text-[#dce6e6]"><Link className="block hover:text-white" to="/features">How it works</Link><Link className="block hover:text-white" to="/pricing">Plans and pricing</Link><Link className="block hover:text-white" to="/dashboard">Resume review</Link></div></div>
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#edbcae]">For teams</p><div className="mt-4 space-y-3 text-[#dce6e6]"><Link className="block footer-link" to="/recruiter">Recruiter workspace</Link><a className="flex items-center gap-1 footer-link" href="mailto:piyushdubey447@gmail.com">Contact us <ArrowUpRight className="h-3.5 w-3.5" /></a><a className="flex items-center gap-1 footer-link" href="https://www.linkedin.com/in/piyush-dubey-70183429a" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight className="h-3.5 w-3.5" /></a><span className="block text-[#b8c8cc]">Built by Piyush Dubey</span></div></div>
      </div>
      <div className="flex flex-col gap-2 pt-6 text-xs text-[#b8c8cc] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} ResumeAI. All rights reserved.</span><span>Made for thoughtful applications.</span></div>
    </div>
  </footer>
);

export default Footer;
