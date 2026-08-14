import { Request, Response } from 'express';
import { mockDb } from '../utils/mockDb';

export const getLeaderboard = (req: Request, res: Response) => {
  const leaderboard = [
    { rank: 1, name: 'Alex Rivera', institution: 'UC Berkeley', score: 94, badges: ['ATS Ninja', 'Metric Machine', 'Role Ready'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { rank: 2, name: 'Priya Sharma', institution: 'Northeastern Univ', score: 91, badges: ['ML Wizard', 'Data Master'], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
    { rank: 3, name: 'Jordan Lee', institution: 'NYU Stern', score: 89, badges: ['Growth Hacker', 'CRO Pro'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { rank: 4, name: 'Samantha Wu', institution: 'Stanford Univ', score: 88, badges: ['Full Stack Ace'], avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
    { rank: 5, name: 'Marcus Brody', institution: 'MIT', score: 86, badges: ['System Architect'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
  ];

  return res.json({ leaderboard });
};

export const analyzePortfolio = (req: Request, res: Response) => {
  const { githubUrl, behanceUrl, linkedinUrl } = req.body;

  const signals = {
    githubStars: githubUrl ? 38 : 0,
    publicRepos: githubUrl ? 14 : 0,
    portfolioStrengthScore: githubUrl ? 88 : 65,
    activityBadge: githubUrl ? 'Verified Code Contributor' : 'Standard Profile',
    signalSummary: 'High public code activity with active commits in microservices & full-stack TypeScript.'
  };

  return res.json(signals);
};

export const getLearningRecommendations = (req: Request, res: Response) => {
  const { missingSkills } = req.body;
  const skillsList: string[] = missingSkills && missingSkills.length > 0 ? missingSkills : ['System Design', 'Docker', 'GraphQL', 'A/B Testing'];

  const recommendations = skillsList.map(skill => {
    return {
      skill,
      courseTitle: `Mastering ${skill} for High-Scale Applications`,
      provider: skill.includes('System') || skill.includes('Docker') ? 'Educative.io / Coursera' : 'Udemy / LinkedIn Learning',
      estimatedHours: '6 - 12 hours',
      link: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`
    };
  });

  return res.json({ recommendations });
};
