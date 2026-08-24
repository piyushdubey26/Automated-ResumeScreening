import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { RecruiterCandidate } from '../types';
import {
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  Users,
  X,
  Brain,
  Plus,
  ArrowRight,
  ArrowLeft,
  Send,
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  skills: string[];
  experience: string;
  description: string;
  candidateCount: number;
  shortlistedCount: number;
  status: 'Screening complete' | 'In progress' | 'Draft';
}

export const RecruiterDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Navigation & Sub-states
  const [activeNav, setActiveNav] = useState<'Dashboard' | 'Jobs' | 'Candidates' | 'AI Screening' | 'Shortlisted' | 'Analytics' | 'Settings'>('Dashboard');
  
  // Job selection state (starts with 'j-1' - Senior Frontend Engineer)
  const [selectedJobId, setSelectedJobId] = useState<string>('j-1');
  const [showCreateJobForm, setShowCreateJobForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null);

  // Search, filter, and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Shortlisted' | 'Under Review' | 'Rejected'>('all');
  const [matchTierFilter, setMatchTierFilter] = useState<'all' | 'strong' | 'good' | 'review' | 'low'>('all');

  // Job Description list
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 'j-1',
      title: 'Senior Frontend Engineer',
      company: 'TechScale',
      location: 'Remote',
      employmentType: 'Full-time',
      skills: ['React', 'Next.js', 'TypeScript', 'AWS'],
      experience: '5+ years',
      description: 'We are looking for a Senior Frontend Engineer to join our core product team. You will lead the development of our dashboard, optimize application performance, and work closely with product designers to ship premium web experiences.',
      candidateCount: 142,
      shortlistedCount: 2,
      status: 'Screening complete'
    },
    {
      id: 'j-2',
      title: 'Product Designer',
      company: 'DesignFlow',
      location: 'New York, NY (Hybrid)',
      employmentType: 'Full-time',
      skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      experience: '3+ years',
      description: 'Join our design group to shape the future of collaborative design interfaces. Looking for a generalist product designer who excels at simplifying complex user workflows.',
      candidateCount: 86,
      shortlistedCount: 0,
      status: 'In progress'
    },
    {
      id: 'j-3',
      title: 'Backend Engineer',
      company: 'CloudBase',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      skills: ['Node.js', 'Golang', 'PostgreSQL', 'Docker'],
      experience: '4+ years',
      description: 'Scaling backend servers, managing cloud databases, and building resilient API gateways. Experience with large-scale relational databases and Docker deployment is a must.',
      candidateCount: 200,
      shortlistedCount: 1,
      status: 'Screening complete'
    }
  ]);

  // Candidate Data State
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([
    {
      id: 'c-1',
      recruiterJobId: 'j-1',
      candidateName: 'Aarav Sharma',
      candidateEmail: 'aarav.sharma@example.com',
      targetRole: 'sde',
      resumeText: 'Senior engineer with 5 years experience building React, Next.js, and TypeScript applications. Managed AWS infrastructure and CI/CD pipelines.',
      overallScore: 96,
      jdMatchPct: 96,
      status: 'Shortlisted',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'c-2',
      recruiterJobId: 'j-1',
      candidateName: 'Priya Mehta',
      candidateEmail: 'priya.mehta@example.com',
      targetRole: 'sde',
      resumeText: 'Frontend developer with 4 years experience specializing in React, TypeScript, TailwindCSS, and Node.js backend integrations.',
      overallScore: 91,
      jdMatchPct: 91,
      status: 'Under Review',
      appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'c-3',
      recruiterJobId: 'j-1',
      candidateName: 'Rahul Verma',
      candidateEmail: 'rahul.verma@example.com',
      targetRole: 'sde',
      resumeText: 'Software Engineer focused on frontend technologies. 3 years experience with React, JavaScript, AWS services, and Redux.',
      overallScore: 87,
      jdMatchPct: 87,
      status: 'Under Review',
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'c-4',
      recruiterJobId: 'j-1',
      candidateName: 'Neha Sharma',
      candidateEmail: 'neha.sharma@example.com',
      targetRole: 'sde',
      resumeText: 'Junior frontend dev. 2 years experience with HTML, CSS, JavaScript, and introductory React.',
      overallScore: 55,
      jdMatchPct: 55,
      status: 'Rejected',
      appliedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'c-5',
      recruiterJobId: 'j-3',
      candidateName: 'Vikram Singh',
      candidateEmail: 'vikram.singh@example.com',
      targetRole: 'sde',
      resumeText: 'Backend Developer with 4 years experience in Node.js, PostgreSQL, Redis, and Docker setups.',
      overallScore: 89,
      jdMatchPct: 89,
      status: 'Shortlisted',
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // Form State for creating jobs
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'Full-time',
    description: '',
    skills: '',
    experience: '',
    preferredSkills: ''
  });

  // Check state passed from homepage to open create job directly
  useEffect(() => {
    if (location.state?.openCreateJob) {
      setActiveNav('Jobs');
      setShowCreateJobForm(true);
      // Clear location state so it doesn't open on refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Load from local storage if recruiter database values exist
  useEffect(() => {
    const savedCandidates = localStorage.getItem('resumeai_recruiter_candidates');
    if (savedCandidates) {
      try {
        setCandidates(JSON.parse(savedCandidates));
      } catch (e) {
        console.error('Failed to parse saved recruiter candidates', e);
      }
    }
    const savedJobs = localStorage.getItem('resumeai_recruiter_jobs');
    if (savedJobs) {
      try {
        setJobs(JSON.parse(savedJobs));
      } catch (e) {
        console.error('Failed to parse saved jobs', e);
      }
    }
  }, []);

  // Save changes helper
  const saveCandidatesToStorage = (updatedList: RecruiterCandidate[]) => {
    setCandidates(updatedList);
    localStorage.setItem('resumeai_recruiter_candidates', JSON.stringify(updatedList));
  };

  const saveJobsToStorage = (updatedJobsList: Job[]) => {
    setJobs(updatedJobsList);
    localStorage.setItem('resumeai_recruiter_jobs', JSON.stringify(updatedJobsList));
  };

  // Compare candidates state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const toggleCompareSelect = (candidateId: string) => {
    setCompareIds(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 candidates.');
        return prev;
      }
      return [...prev, candidateId];
    });
  };

  // Chat/Copilot State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Good afternoon! I’m your ResumeAI Recruiter Assistant. Ask me to find specific skills, compare candidates, or compile a shortlist.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quick Action Chat Suggestions
  const chatSuggestions = [
    "Who are my top 3 candidates?",
    "Compare Aarav and Priya.",
    "Generate interview questions for Aarav.",
    "Which candidates have AWS experience?"
  ];

  const handleSendChat = (messageText: string) => {
    if (!messageText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const normalizedMsg = messageText.toLowerCase();

      const currentJobCandidates = candidates.filter(c => c.recruiterJobId === selectedJobId);
      const topSorted = [...currentJobCandidates].sort((a, b) => b.jdMatchPct - a.jdMatchPct);

      if (normalizedMsg.includes('top') || normalizedMsg.includes('rank') || normalizedMsg.includes('best')) {
        const top3 = topSorted.slice(0, 3);
        aiResponseText = `Here are the top candidates for ${jobs.find(j => j.id === selectedJobId)?.title || 'this role'}:\n\n` +
          top3.map((c, i) => `${i + 1}. **${c.candidateName}** (${c.jdMatchPct}% match) - ${c.overallScore >= 90 ? 'Strong Match' : 'Good Match'}`).join('\n') +
          `\n\nWould you like me to generate interview questions for Aarav Sharma?`;
      } else if (normalizedMsg.includes('compare')) {
        aiResponseText = `### Candidate Comparison Summary\n\n` +
          `**Aarav Sharma** (96% match) vs **Priya Mehta** (91% match):\n` +
          `- **Experience:** Aarav has 5 years of frontend experience; Priya has 4 years.\n` +
          `- **Tech Stack:** Both satisfy Core React & TypeScript requirements. Aarav also possesses AWS cloud infrastructure deployment experience, which aligns perfectly with the target role. Priya shows stronger integration history with Node.js backends.\n\n` +
          `**Recommendation:** Aarav remains the strongest match, but Priya is a highly recommended secondary interviewer.`;
      } else if (normalizedMsg.includes('interview') || normalizedMsg.includes('questions')) {
        aiResponseText = `Here are customized interview questions for **Aarav Sharma** (96% match):\n\n` +
          `1. *Aarav, you mentioned managing AWS infrastructure. Can you describe how you architected production React/Next.js hosting pipelines?*\n` +
          `2. *Next.js uses several rendering models (SSR, SSG, ISR). In your 5 years experience, how did you choose between them for performance optimization?*\n` +
          `3. *How do you approach team code quality and architecture when building complex TypeScript apps?*`;
      } else if (normalizedMsg.includes('aws') || normalizedMsg.includes('cloud')) {
        const matching = currentJobCandidates.filter(c => c.resumeText.toLowerCase().includes('aws'));
        if (matching.length > 0) {
          aiResponseText = `I found ${matching.length} candidates with AWS experience:\n\n` +
            matching.map(c => `- **${c.candidateName}** (${c.jdMatchPct}% Match) - "${c.resumeText.substring(0, 80)}..."`).join('\n');
        } else {
          aiResponseText = `No candidates in the current job screen mention AWS in their profile.`;
        }
      } else {
        aiResponseText = `I analyzed the ${currentJobCandidates.length} parsed profiles for this role. **Aarav Sharma** (96%) and **Priya Mehta** (91%) are your clear leads. Let me know if you would like to run interview preparation questions, compare their core skills, or shortlist another applicant.`;
      }

      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  // Upload/Screening simulation state
  const [uploadFilesMock, setUploadFilesMock] = useState<Array<{ name: string; size: string; status: 'pending' | 'parsing' | 'done'; parsedName?: string }>>([]);
  const [screeningLogs, setScreeningLogs] = useState<string[]>([]);
  const [isSimulatingScreening, setIsSimulatingScreening] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addMockFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addMockFiles(Array.from(e.target.files));
    }
  };

  const addMockFiles = (files: File[]) => {
    const newFiles = files.map(f => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      status: 'pending' as const,
      parsedName: f.name.replace(/_resume|_cv/gi, '').split('.')[0].replace(/[-_]/g, ' ')
    }));
    setUploadFilesMock(prev => [...prev, ...newFiles]);
  };

  const startMockScreening = () => {
    if (uploadFilesMock.length === 0) {
      alert('Please add at least one resume file to screen.');
      return;
    }

    setIsSimulatingScreening(true);
    setScreeningLogs(['Initializing screening pipeline...']);

    // Step-by-step progress logging
    const logSteps = [
      'Extracting plain text metadata from PDF structure...',
      'Running entity recognition for target skills mapping...',
      'Calculating semantic embedding alignment with selected JD...',
      'Generating AI explainability matching logs...',
      'Matching scores calculated successfully!'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logSteps.length) {
        setScreeningLogs(prev => [...prev, logSteps[currentLogIndex]]);
        
        // Update mock file status during progress
        setUploadFilesMock(prev => prev.map((f, idx) => {
          if (idx === currentLogIndex % prev.length) {
            return { ...f, status: f.status === 'pending' ? 'parsing' : 'done' };
          }
          return f;
        }));
        
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Finish simulation
        setUploadFilesMock(prev => prev.map(f => ({ ...f, status: 'done' })));
        
        // Create actual database records for the screened files
        const names = uploadFilesMock.map(f => f.parsedName || 'Unknown Candidate');
        const newCandidatesList = [...candidates];

        names.forEach((name, i) => {
          const score = Math.floor(Math.random() * 30) + 65; // realistic scores 65-95
          const newCand: RecruiterCandidate = {
            id: `c-new-${Date.now()}-${i}`,
            recruiterJobId: selectedJobId,
            candidateName: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            candidateEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            targetRole: 'sde',
            resumeText: `Screened resume for ${name}. Highlights include frontend/backend alignments matching ${jobs.find(j => j.id === selectedJobId)?.title}.`,
            overallScore: score,
            jdMatchPct: score,
            status: score >= 90 ? 'Shortlisted' : 'Under Review',
            appliedAt: new Date().toISOString()
          };
          newCandidatesList.push(newCand);
        });

        // Update Job counters
        const updatedJobs = jobs.map(j => {
          if (j.id === selectedJobId) {
            return {
              ...j,
              candidateCount: j.candidateCount + uploadFilesMock.length,
              shortlistedCount: j.shortlistedCount + uploadFilesMock.filter((_, idx) => {
                const score = newCandidatesList[newCandidatesList.length - uploadFilesMock.length + idx]?.overallScore || 0;
                return score >= 90;
              }).length,
              status: 'Screening complete' as const
            };
          }
          return j;
        });

        saveJobsToStorage(updatedJobs);
        saveCandidatesToStorage(newCandidatesList);
        
        setIsSimulatingScreening(false);
        setScreeningLogs(prev => [...prev, '✓ Successfully screened all documents. Redirecting to Candidate Ranks...']);
        
        setTimeout(() => {
          setUploadFilesMock([]);
          setScreeningLogs([]);
          setActiveNav('Candidates');
        }, 1500);
      }
    }, 1000);
  };

  // Job Submission Handler
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.company || !jobForm.description) {
      alert('Please fill in all required fields (Job Title, Company, Description).');
      return;
    }

    const newJob: Job = {
      id: `j-${Date.now()}`,
      title: jobForm.title,
      company: jobForm.company,
      location: jobForm.location || 'Remote',
      employmentType: jobForm.employmentType,
      skills: jobForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      experience: jobForm.experience || '3+ years',
      description: jobForm.description,
      candidateCount: 0,
      shortlistedCount: 0,
      status: 'Draft'
    };

    const updatedJobsList = [newJob, ...jobs];
    saveJobsToStorage(updatedJobsList);
    
    // Auto-select this newly created job
    setSelectedJobId(newJob.id);

    // Reset Form
    setJobForm({
      title: '',
      company: '',
      location: '',
      employmentType: 'Full-time',
      description: '',
      skills: '',
      experience: '',
      preferredSkills: ''
    });

    setShowCreateJobForm(false);
    
    // Redirect straight to upload screening for this job
    setActiveNav('AI Screening');
  };

  // Filtered Candidates list for current active job
  const activeJobCandidates = candidates.filter(c => c.recruiterJobId === selectedJobId);
  
  const filteredAndSortedCandidates = activeJobCandidates
    .filter(c => {
      // Search text query
      const matchesSearch = c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.resumeText.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status Filter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      // Match Tier Filter
      let matchesTier = true;
      if (matchTierFilter === 'strong') matchesTier = c.jdMatchPct >= 90;
      else if (matchTierFilter === 'good') matchesTier = c.jdMatchPct >= 75 && c.jdMatchPct < 90;
      else if (matchTierFilter === 'review') matchesTier = c.jdMatchPct >= 60 && c.jdMatchPct < 75;
      else if (matchTierFilter === 'low') matchesTier = c.jdMatchPct < 60;

      return matchesSearch && matchesStatus && matchesTier;
    })
    .sort((a, b) => b.jdMatchPct - a.jdMatchPct); // rank by highest match percentage first

  const selectedJobDetail = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Get score pill styling based on match tier
  const getMatchTierBadge = (score: number) => {
    if (score >= 90) return { label: 'Strong Match', text: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
    if (score >= 75) return { label: 'Good Match', text: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' };
    if (score >= 60) return { label: 'Review', text: 'text-amber-400 border-amber-500/20 bg-amber-500/10' };
    return { label: 'Low Match', text: 'text-rose-400 border-rose-500/20 bg-rose-500/10' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-indigo-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Hiring Overview</p>
              <h2 className="font-serif text-lg text-white font-semibold">Recruiter Workspace</h2>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none border-b border-slate-900 lg:border-none">
              {(['Dashboard', 'Jobs', 'Candidates', 'AI Screening', 'Shortlisted', 'Analytics', 'Settings'] as const).map(nav => {
                const isActive = activeNav === nav;
                let Icon = LayoutDashboard;
                if (nav === 'Jobs') Icon = BriefcaseBusiness;
                else if (nav === 'Candidates') Icon = Users;
                else if (nav === 'AI Screening') Icon = FileText;
                else if (nav === 'Shortlisted') Icon = Check;
                else if (nav === 'Analytics') Icon = BarChart3;
                else if (nav === 'Settings') Icon = Settings;

                return (
                  <button
                    key={nav}
                    onClick={() => {
                      setActiveNav(nav);
                      setShowCreateJobForm(false);
                    }}
                    className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-md shadow-purple-950/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{nav}</span>
                    {nav === 'AI Screening' && uploadFilesMock.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 block ml-1 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Job Selector */}
            <div className="hidden lg:block pt-4 border-t border-slate-900">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Active Job Scope</label>
              <div className="relative">
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    setCompareIds([]);
                  }}
                  className="w-full text-xs font-semibold text-slate-350 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-purple-500 cursor-pointer capitalize"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1.5 pl-1">
                {activeJobCandidates.length} profiles linked
              </span>
            </div>

            {/* Micro AI Assistant Trigger box */}
            <div className="hidden lg:block p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-purple-500/5 rounded-full filter blur-xl"></div>
              <div className="flex items-center space-x-1.5 mb-2 text-purple-400">
                <Brain className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Copilot</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Need to rank, draft outreach, or evaluate match gaps instantly? Use the assistant box.
              </p>
              <button
                onClick={() => setActiveNav('Analytics')}
                className="w-full flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-800 cursor-pointer"
              >
                <span>View Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </aside>

        {/* MAIN DASHBOARD INTERFACE CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col space-y-6">
          
          {/* USER WELCOME HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <p className="text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                ResumeAI 2.0 Recruiter Hub
              </p>
              <h1 className="font-serif text-3xl font-bold text-white mt-1">
                Good afternoon, {user?.name || 'Sarah Jenkins'} 👋
              </h1>
              <p className="text-xs text-slate-400 mt-1">Your unified candidate screening overview</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveNav('Jobs');
                  setShowCreateJobForm(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-950/20 hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Job</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeNav === 'Dashboard' && (
            <div className="space-y-8">
              {/* KPI metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Jobs', value: jobs.length, icon: BriefcaseBusiness, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                  { label: 'Applications', value: candidates.length + 423, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'AI Screened', value: candidates.length + 346, icon: FileText, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                  { label: 'Shortlisted', value: candidates.filter(c => c.status === 'Shortlisted').length + 39, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div className="absolute right-0 bottom-0 w-12 h-12 bg-white/2 rounded-full filter blur-md"></div>
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold">{item.label}</span>
                      <span className="text-2xl font-extrabold text-white mt-1.5 block leading-none">{item.value}</span>
                    </div>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </span>
                  </div>
                ))}
              </div>

              {/* Main AI Screening Card */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full filter blur-[100px] pointer-events-none"></div>
                <div className="max-w-xl">
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25 mb-4">
                    <Sparkles className="w-3 h-3" />
                    <span>AI SCREENING</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mb-2">Find your strongest candidates automatically.</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    ResumeAI screens bulk resume uploads, compares them semantically to your requirements, and highlights matching candidates with detailed matching logs.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveNav('Jobs');
                        setShowCreateJobForm(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md shadow-purple-950/20 cursor-pointer"
                    >
                      + Create Job
                    </button>
                    <button
                      onClick={() => setActiveNav('AI Screening')}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-bold text-slate-350 cursor-pointer"
                    >
                      Upload Resumes
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Jobs Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Jobs Pipeline</h3>
                  <button
                    onClick={() => setActiveNav('Jobs')}
                    className="text-xs text-purple-400 hover:underline font-semibold"
                  >
                    View all jobs
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {jobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setActiveNav('Candidates');
                      }}
                      className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all relative overflow-hidden group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center text-slate-450 group-hover:text-purple-400 transition-colors">
                          <BriefcaseBusiness className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{job.location.split(' ')[0]}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{job.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{job.company}</p>
                      
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Screened candidates</span>
                          <strong className="text-slate-300">{job.candidateCount}</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Shortlisted candidates</span>
                          <strong className="text-slate-300">{job.shortlistedCount}</strong>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-950 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          job.status === 'Screening complete' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {job.status}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Recopilot Panel inside Dashboard */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-850 shadow-sm">
                <div className="flex items-start gap-3.5 border-b border-slate-950 pb-4 mb-4">
                  <span className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Brain className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white">Ask AI Recruiter</h3>
                    <p className="text-[11px] text-slate-400">Ask questions about candidate stacks, comparisons, or interview questions.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-none">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-xl max-w-lg text-xs leading-relaxed ${
                          msg.sender === 'user' 
                            ? 'bg-purple-600 text-white rounded-tr-none' 
                            : 'bg-slate-950 border border-slate-850 text-slate-350 rounded-tl-none whitespace-pre-line'
                        }`}>
                          {msg.text}
                          <span className="block text-[9px] opacity-60 text-right mt-1.5">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-500 text-xs">
                          AI typing...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {chatSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(s)}
                        className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-950">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat(chatInput)}
                      className="flex-1 text-xs text-slate-200 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none placeholder:text-slate-500 focus:border-purple-600"
                      placeholder="Ask anything (e.g. 'Compare Aarav and Priya')"
                    />
                    <button
                      onClick={() => handleSendChat(chatInput)}
                      className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: JOBS PIPELINE */}
          {activeNav === 'Jobs' && (
            <div className="space-y-6">
              {!showCreateJobForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hiring Job Vacancies</h3>
                    <button
                      onClick={() => setShowCreateJobForm(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-purple-400 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create Job</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {jobs.map(job => (
                      <div
                        key={job.id}
                        className={`p-6 rounded-2xl bg-slate-900/60 border hover:border-slate-700 transition-all ${
                          selectedJobId === job.id ? 'border-purple-600/40 bg-purple-600/[0.01]' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h4 className="font-serif text-lg text-white font-bold">{job.title}</h4>
                            <p className="text-xs text-slate-400">{job.company} · {job.location}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            job.status === 'Screening complete' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {job.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-5">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {job.skills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-400 font-bold">
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-slate-950 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-semibold">
                            Experience: <strong className="text-slate-350">{job.experience}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setActiveNav('Candidates');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-[11px] font-semibold text-slate-300 cursor-pointer"
                            >
                              Candidates ({job.candidateCount})
                            </button>
                            <button
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setActiveNav('AI Screening');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-[11px] font-bold text-white cursor-pointer"
                            >
                              Screen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* CREATE JOB FORM */
                <form onSubmit={handleCreateJob} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-950 pb-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateJobForm(false)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h3 className="text-base font-serif font-bold text-white">Create New Job Description</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">Step 1 of 2</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Title *</label>
                      <input
                        value={jobForm.title}
                        onChange={e => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600"
                        placeholder="e.g. Senior Frontend Engineer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company Name *</label>
                      <input
                        value={jobForm.company}
                        onChange={e => setJobForm(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600"
                        placeholder="e.g. TechScale"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                      <input
                        value={jobForm.location}
                        onChange={e => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600"
                        placeholder="e.g. Remote / London, UK"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employment Type</label>
                      <select
                        value={jobForm.employmentType}
                        onChange={e => setJobForm(prev => ({ ...prev, employmentType: e.target.value }))}
                        className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600 cursor-pointer"
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Minimum Experience</label>
                      <input
                        value={jobForm.experience}
                        onChange={e => setJobForm(prev => ({ ...prev, experience: e.target.value }))}
                        className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600"
                        placeholder="e.g. 5+ years"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills Required (Comma separated)</label>
                    <input
                      value={jobForm.skills}
                      onChange={e => setJobForm(prev => ({ ...prev, skills: e.target.value }))}
                      className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600"
                      placeholder="e.g. React, Next.js, TypeScript, AWS"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Description *</label>
                    <textarea
                      value={jobForm.description}
                      onChange={e => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-purple-600 resize-none leading-relaxed"
                      placeholder="Paste the job scope description details..."
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-950 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateJobForm(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-lg shadow-purple-950/20"
                    >
                      Create Job & Start Screening
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: CANDIDATE RANKINGS */}
          {activeNav === 'Candidates' && (
            <div className="space-y-6">
              
              {/* Job scope heading info */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Active Scope</span>
                  <h3 className="font-serif text-xl font-bold text-white mt-1 capitalize">{selectedJobDetail.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedJobDetail.company} · {selectedJobDetail.location} · {selectedJobDetail.experience} experience</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Switch role:</span>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      setCompareIds([]);
                    }}
                    className="text-xs font-semibold text-slate-350 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 outline-none focus:border-purple-500 cursor-pointer capitalize"
                  >
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                
                {/* Search */}
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs text-slate-200 bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 outline-none placeholder:text-slate-500 focus:border-purple-500"
                    placeholder="Search candidate name..."
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Match Tier select */}
                  <select
                    value={matchTierFilter}
                    onChange={e => setMatchTierFilter(e.target.value as any)}
                    className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-2 outline-none cursor-pointer focus:border-purple-500"
                  >
                    <option value="all">All Match Tiers</option>
                    <option value="strong">Strong Match (&ge; 90%)</option>
                    <option value="good">Good Match (75-89%)</option>
                    <option value="review">Review (60-74%)</option>
                    <option value="low">Low Match (&lt; 60%)</option>
                  </select>

                  {/* Status buttons */}
                  <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl p-1">
                    {(['all', 'Shortlisted', 'Under Review', 'Rejected'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          statusFilter === filter 
                            ? 'bg-purple-600/20 text-purple-400' 
                            : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {filter === 'all' ? 'All Status' : filter === 'Under Review' ? 'Review' : filter}
                      </button>
                    ))}
                  </div>

                </div>

              </div>

              {/* Candidate ranking Table */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
                
                {filteredAndSortedCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No candidates match the selection.</p>
                    <button
                      onClick={() => setActiveNav('AI Screening')}
                      className="text-xs text-purple-400 hover:underline font-bold mt-1.5"
                    >
                      Screen new candidates for this job
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-xs">
                      <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-950 pb-3">
                        <tr>
                          <th className="w-8 pb-3"></th>
                          <th className="pb-3 px-3">Rank</th>
                          <th className="pb-3 px-3">Candidate</th>
                          <th className="pb-3 px-3">AI Match Score</th>
                          <th className="pb-3 px-3">Skills Alignment</th>
                          <th className="pb-3 px-3">Experience</th>
                          <th className="pb-3 px-3">Status</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-950">
                        {filteredAndSortedCandidates.map((cand, idx) => {
                          const isSelectedForCompare = compareIds.includes(cand.id);
                          const tier = getMatchTierBadge(cand.jdMatchPct);
                          const isJobSde = selectedJobDetail.skills.includes('React');

                          return (
                            <tr key={cand.id} className="hover:bg-slate-900/40 group">
                              <td className="py-3.5">
                                <input
                                  type="checkbox"
                                  checked={isSelectedForCompare}
                                  onChange={() => toggleCompareSelect(cand.id)}
                                  className="w-3.5 h-3.5 rounded border-slate-800 text-purple-650 bg-slate-950 outline-none focus:ring-offset-0 cursor-pointer"
                                />
                              </td>
                              <td className="py-3.5 px-3 font-extrabold text-slate-450 group-hover:text-white transition-colors">
                                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                              </td>
                              <td className="py-3.5 px-3">
                                <div>
                                  <button
                                    onClick={() => setSelectedCandidate(cand)}
                                    className="font-bold text-slate-205 hover:text-purple-400 text-left"
                                  >
                                    {cand.candidateName}
                                  </button>
                                  <span className="block text-[10px] text-slate-500 mt-0.5">{cand.candidateEmail}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-extrabold ${getScoreColor(cand.jdMatchPct)}`}>
                                    {cand.jdMatchPct}%
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border ${tier.text}`}>
                                    {tier.label}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-slate-400">
                                {isJobSde ? 'React · Next.js · TypeScript · AWS' : 'Node.js · PostgreSQL · Docker'}
                              </td>
                              <td className="py-3.5 px-3 text-slate-450">
                                {cand.jdMatchPct >= 90 ? '5 years' : cand.jdMatchPct >= 80 ? '4 years' : '3 years'}
                              </td>
                              <td className="py-3.5 px-3">
                                <select
                                  value={cand.status}
                                  onChange={(e) => {
                                    const updated = candidates.map(item => item.id === cand.id ? { ...item, status: e.target.value as any } : item);
                                    saveCandidatesToStorage(updated);
                                  }}
                                  className="text-[11px] font-bold text-slate-400 bg-slate-950 border border-slate-850 rounded px-2 py-1 outline-none cursor-pointer focus:border-purple-500 capitalize"
                                >
                                  <option>Shortlisted</option>
                                  <option>Under Review</option>
                                  <option>Rejected</option>
                                </select>
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() => setSelectedCandidate(cand)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-350 cursor-pointer"
                                >
                                  View report
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* BOTTOM COMPARISON DRAWER BAR */}
              {compareIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 shadow-2xl z-40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Users className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">Compare Candidates</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Selected {compareIds.length} of max 3 candidates.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCompareIds([])}
                      className="text-xs text-slate-450 hover:text-white"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={() => setShowCompareModal(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-lg shadow-purple-950/20 cursor-pointer"
                    >
                      Compare Side-by-Side
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: RESUME UPLOAD / SCREENING */}
          {activeNav === 'AI Screening' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Job Selection Scope</span>
                <h3 className="font-serif text-lg font-bold text-white mt-1 capitalize">{selectedJobDetail.title}</h3>
                <p className="text-xs text-slate-400 mt-1">We will screen all uploaded candidates against the active requirements of this job description.</p>
              </div>

              {/* Drag/Drop Box */}
              {!isSimulatingScreening ? (
                <div className="space-y-4">
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-slate-800 hover:border-purple-600 bg-slate-900/40 hover:bg-slate-900/70 p-8 rounded-2xl text-center transition-all cursor-pointer relative"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <UploadCloud className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">Upload Candidates</h4>
                    <p className="text-xs text-slate-450 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Drag and drop resume PDF / DOCX files here, or click to browse. Let ResumeAI automatically parse and rank.
                    </p>
                    <span className="inline-block mt-4 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-950 text-slate-500 uppercase tracking-wider border border-slate-850">
                      Supports up to 100 files
                    </span>
                  </div>

                  {/* List of uploaded files with checkmarks */}
                  {uploadFilesMock.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-950 pb-2.5 mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uploaded Documents ({uploadFilesMock.length})</span>
                        <button
                          onClick={() => setUploadFilesMock([])}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-none">
                        {uploadFilesMock.map((file, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-955 border border-slate-850/50">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span className="font-semibold text-slate-300 truncate max-w-[200px]">{file.name}</span>
                              <span className="text-[10px] text-slate-550">({file.size})</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {file.status === 'pending' && (
                                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Ready</span>
                                </span>
                              )}
                              {file.status === 'parsing' && (
                                <span className="text-[10px] text-purple-400 flex items-center space-x-1">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Parsing...</span>
                                </span>
                              )}
                              {file.status === 'done' && (
                                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Parsed</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={startMockScreening}
                        className="w-full mt-3 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition-all shadow-lg shadow-purple-950/20 cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>✨ Start AI Screening</span>
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* SIMULATING SCREENING LOG CONSOLE */
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Screening Simulation Active...</span>
                  </div>
                  
                  {/* Console logs box */}
                  <div className="bg-black/80 rounded-xl p-4 font-mono text-[11px] text-slate-350 space-y-2 border border-slate-900 min-h-[160px]">
                    {screeningLogs.map((log, idx) => (
                      <p key={idx} className={log.startsWith('✓') ? 'text-emerald-400' : 'text-slate-350'}>
                        {log}
                      </p>
                    ))}
                  </div>

                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full animate-pulse" style={{ width: `${(screeningLogs.length / 6) * 100}%` }}></div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: SHORTLISTED */}
          {activeNav === 'Shortlisted' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Shortlist</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-450 border border-purple-500/20">
                  {candidates.filter(c => c.status === 'Shortlisted').length} selected candidates
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
                {candidates.filter(c => c.status === 'Shortlisted').length === 0 ? (
                  <div className="text-center py-12">
                    <Check className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No candidates shortlisted yet.</p>
                    <p className="text-xs text-slate-550 mt-1">Review candidates from the ranking dashboard to star shortlist them.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-xs">
                      <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-950 pb-3">
                        <tr>
                          <th className="pb-3 px-3">Candidate</th>
                          <th className="pb-3 px-3">Role Match Scope</th>
                          <th className="pb-3 px-3">AI Score</th>
                          <th className="pb-3 px-3">Actioned On</th>
                          <th className="pb-3 text-right">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-950">
                        {candidates.filter(c => c.status === 'Shortlisted').map(cand => (
                          <tr key={cand.id} className="hover:bg-slate-900/40">
                            <td className="py-3 px-3">
                              <div>
                                <strong className="text-slate-205">{cand.candidateName}</strong>
                                <span className="block text-[10px] text-slate-500 mt-0.5">{cand.candidateEmail}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-400 capitalize">
                              {jobs.find(j => j.id === cand.recruiterJobId)?.title || 'Software Engineer'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-emerald-450">{cand.jdMatchPct}%</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(cand.appliedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setSelectedCandidate(cand)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-350 cursor-pointer"
                              >
                                View AI Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeNav === 'Analytics' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hiring Analytics</h3>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* SVG Matching Score Distribution Chart */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Score Distribution</h4>
                  
                  <div className="relative h-48 w-full bg-slate-950/60 rounded-xl p-3 border border-slate-850/40 flex items-end justify-between">
                    {[
                      { range: '0-59', height: '10%' },
                      { range: '60-69', height: '25%' },
                      { range: '70-79', height: '40%' },
                      { range: '80-89', height: '75%' },
                      { range: '90-100', height: '90%' }
                    ].map((bar, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 space-y-2">
                        <div className="w-8 bg-gradient-to-t from-purple-750 to-purple-500 rounded-md transition-all duration-500 hover:opacity-80" style={{ height: bar.height }}></div>
                        <span className="text-[10px] text-slate-500">{bar.range}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Most screened resumes score between 80% and 100%, indicating strong initial applicant pools.
                  </p>
                </div>

                {/* SVG Conversion Pipeline */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hiring Pipeline Conversion</h4>
                  
                  <div className="space-y-3">
                    {[
                      { step: 'Applied Resumes', value: 428, pct: '100%', bg: 'bg-indigo-600' },
                      { step: 'AI Screened & Parsed', value: 351, pct: '82%', bg: 'bg-purple-600' },
                      { step: 'Good/Strong Match', value: 168, pct: '39%', bg: 'bg-pink-600' },
                      { step: 'Shortlisted', value: 41, pct: '9.5%', bg: 'bg-emerald-600' }
                    ].map((p, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-semibold">{p.step}</span>
                          <span className="text-slate-500">{p.value} ({p.pct})</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950">
                          <div className={`h-2 rounded-full ${p.bg}`} style={{ width: p.pct }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeNav === 'Settings' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h3 className="text-base font-serif font-bold text-white border-b border-slate-950 pb-3">Recruiter Settings</h3>
              
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hiring Organization Name</label>
                  <input
                    defaultValue="TechScale Corporation"
                    className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Screening Threshold (%)</label>
                  <input
                    type="number"
                    defaultValue="75"
                    className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 outline-none"
                  />
                  <span className="text-[10px] text-slate-550 block mt-1.5">
                    Resumes scoring below this threshold will automatically go to review status.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Notifications</label>
                  <label className="flex items-center space-x-2 text-xs text-slate-350 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-slate-800 text-purple-650 bg-slate-950 outline-none cursor-pointer"
                    />
                    <span>Email summary reports when candidate resume screening batches complete.</span>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => alert('Settings saved successfully')}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* DETAILED CANDIDATE REPORT / AI PROFILE MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl sm:p-8 text-slate-100 scrollbar-none relative">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute right-4 top-4 p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-450 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start justify-between border-b border-slate-950 pb-5 pr-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-purple-400">AI Candidate Report</p>
                <h2 className="mt-2 text-2xl font-serif font-bold text-white">{selectedCandidate.candidateName}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Senior Frontend Engineer Match Scope · {selectedCandidate.candidateEmail}
                </p>
              </div>
            </div>

            {/* Overall Matching metric panel */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-950/80 border border-slate-850 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Overall Match</p>
                <p className={`mt-1 text-3xl font-extrabold ${getScoreColor(selectedCandidate.jdMatchPct)}`}>
                  {selectedCandidate.jdMatchPct}%
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                selectedCandidate.jdMatchPct >= 90 
                  ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                  : 'bg-indigo-500/10 text-indigo-450 border-indigo-500/20'
              }`}>
                {selectedCandidate.jdMatchPct >= 90 ? 'Strong interview recommendation' : 'Review recommended'}
              </span>
            </div>

            {/* AI Summary and Radar breakdown */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Summary</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-350">
                    Strong candidate with 5 years of relevant frontend experience and excellent alignment with the required React, Next.js, TypeScript and AWS stack.
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Strengths</h3>
                  <ul className="mt-2 space-y-1 text-xs text-slate-350">
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span>Strong React experience</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span>Production Next.js applications</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span>TypeScript expertise</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span>AWS experience</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span>Relevant project evidence</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-rose-455 uppercase tracking-wider">Potential Gaps</h3>
                  <p className="mt-1 text-xs text-slate-350 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>No clear Kubernetes experience</span>
                  </p>
                </div>
              </div>

              {/* Explainable AI breakdown sliders */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explainable AI Match Matrix</h3>
                
                {[
                  { label: 'Skills Match', score: 98 },
                  { label: 'Experience Match', score: 94 },
                  { label: 'Project Relevance', score: 96 },
                  { label: 'Education Match', score: 88 },
                  { label: 'Job Relevance', score: 97 }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-450">{item.label}</span>
                      <span className="text-slate-300 font-extrabold">{item.score}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full">
                      <div className="h-1.5 bg-purple-600 rounded-full" style={{ width: `${item.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Expandable Why This Candidate section */}
            <div className="mt-6 border-t border-slate-950 pt-5 space-y-3">
              <details className="group cursor-pointer">
                <summary className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider outline-none list-none select-none">
                  <span>Why this candidate? (Evidence extracted)</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-3 p-4 rounded-xl bg-slate-950/70 border border-slate-850 space-y-2 text-xs text-slate-350 leading-relaxed cursor-default">
                  <p>✓ <strong>5 years relevant experience</strong> - Found inside previous role as Senior Engineer at TechScale.</p>
                  <p>✓ <strong>Built production React applications</strong> - Extensive documentation of frontend builds.</p>
                  <p>✓ <strong>Next.js + TypeScript</strong> - Core stack matched directly with our required requirements.</p>
                  <p>✓ <strong>AWS deployment experience</strong> - Evidence of deployment script management.</p>
                  <p className="text-rose-400">⚠ <strong>No evidence of Kubernetes</strong> - Role recommends docker deployment experience but Kubernetes was not found.</p>
                </div>
              </details>
            </div>

            {/* Actions */}
            <div className="mt-7 flex items-center justify-end gap-2 border-t border-slate-950 pt-5">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const updated = candidates.map(item => item.id === selectedCandidate.id ? { ...item, status: 'Rejected' as const } : item);
                  saveCandidatesToStorage(updated);
                  setSelectedCandidate(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-900/40 text-xs font-semibold text-slate-400 hover:text-rose-400"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  const updated = candidates.map(item => item.id === selectedCandidate.id ? { ...item, status: 'Shortlisted' as const } : item);
                  saveCandidatesToStorage(updated);
                  setSelectedCandidate(null);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-lg shadow-purple-950/20"
              >
                Shortlist Candidate
              </button>
            </div>

          </article>
        </div>
      )}

      {/* CANDIDATE SIDE-BY-SIDE COMPARE MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <article className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl sm:p-8 text-slate-100 scrollbar-none relative">
            <button
              onClick={() => setShowCompareModal(false)}
              className="absolute right-4 top-4 p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-450 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-950 pb-4 pr-8 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[.14em] text-purple-400">AI Comparison Analysis</span>
              <h2 className="mt-1 font-serif text-xl font-bold text-white">Compare Candidates Matrix</h2>
            </div>

            <div className="overflow-x-auto border border-slate-950 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-850">Metrics</th>
                    {compareIds.map((id, index) => {
                      const c = candidates.find(item => item.id === id);
                      return (
                        <th key={id} className="p-3 border-r border-slate-850 text-center">
                          <p className="text-white font-bold">{c?.candidateName || `Candidate ${index + 1}`}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 normal-case block font-normal">{c?.candidateEmail}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950">
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 border-r border-slate-850">AI Match Score</td>
                    {compareIds.map(id => {
                      const c = candidates.find(item => item.id === id);
                      return (
                        <td key={id} className="p-3 text-center border-r border-slate-850 font-extrabold text-sm text-purple-400">
                          {c?.jdMatchPct}%
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 border-r border-slate-850">Experience</td>
                    {compareIds.map(id => {
                      const c = candidates.find(item => item.id === id);
                      return (
                        <td key={id} className="p-3 text-center border-r border-slate-850 text-slate-300 font-semibold">
                          {c?.jdMatchPct && c.jdMatchPct >= 90 ? '5 years' : c?.jdMatchPct && c.jdMatchPct >= 80 ? '4 years' : '3 years'}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Skill matches rows */}
                  {['React', 'Next.js', 'TypeScript', 'AWS'].map(skill => (
                    <tr key={skill}>
                      <td className="p-3 font-semibold text-slate-400 border-r border-slate-850">{skill}</td>
                      {compareIds.map(id => {
                        const c = candidates.find(item => item.id === id);
                        const hasSkill = c?.resumeText.toLowerCase().includes(skill.toLowerCase());
                        return (
                          <td key={id} className="p-3 text-center border-r border-slate-850">
                            {hasSkill ? (
                              <Check className="w-4 h-4 text-emerald-450 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Recommendation Summary block */}
            <div className="mt-6 p-4 rounded-2xl bg-purple-600/[0.03] border border-purple-500/20">
              <div className="flex items-center space-x-1.5 mb-2 text-purple-400">
                <Brain className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Recommendation Summary</span>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed">
                {candidates.find(id => id.id === compareIds[0])?.candidateName || 'Aarav'} is the strongest overall match because he satisfies the largest number of required skills (Next.js, AWS, TypeScript) and has the strongest relevant experience in dashboard development.
              </p>
            </div>

            <div className="mt-7 flex items-center justify-end space-x-2 border-t border-slate-950 pt-5">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white"
              >
                Close Comparison
              </button>
            </div>
          </article>
        </div>
      )}

    </div>
  );
};

export default RecruiterDashboardPage;
