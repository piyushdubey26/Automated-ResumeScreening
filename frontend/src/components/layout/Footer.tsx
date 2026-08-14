import React from 'react';
import { Sparkles, Globe, Share2, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">ResumeAI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Modern role-aware automated resume screening platform, JD matcher, AI rewriter, and recruiter talent ecosystem.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Platform Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/features" className="hover:text-indigo-400 transition-colors">Role-Specific Rubrics</a></li>
              <li><a href="/features" className="hover:text-indigo-400 transition-colors">JD Match & Gap Analysis</a></li>
              <li><a href="/features" className="hover:text-indigo-400 transition-colors">AI Resume Bullet Rewriter</a></li>
              <li><a href="/features" className="hover:text-indigo-400 transition-colors">AI Mock Interview Generator</a></li>
              <li><a href="/recruiter" className="hover:text-indigo-400 transition-colors">Recruiter Bulk Screening</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Role Rubrics</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300">Software Development Engineer (SDE)</span></li>
              <li><span className="text-slate-300">Data Scientist & ML Engineer</span></li>
              <li><span className="text-slate-300">Growth & Digital Marketer</span></li>
              <li><span className="text-slate-300">Product Manager (PM)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Community & Credits</h4>
            <p className="text-xs text-slate-400 mb-3">
              Built by Piyush Dubey, Shubham Singh, Sakshi Kumari, and Anisha.
            </p>
            <div className="flex items-center space-x-3">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="GitHub">
                <Globe className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="Social">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="LinkedIn">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ResumeAI Platform. Open Source under MIT License.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for job seekers & recruiters.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
