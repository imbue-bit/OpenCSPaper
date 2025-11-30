import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { ReviewWizard } from './components/ReviewWizard';
import { ReviewDetail } from './components/ReviewDetail';
import { Settings } from './components/Settings';
import { INITIAL_CONFERENCES, DEFAULT_CONFIG } from './constants';
import { AppConfig, PaperSubmission, ReviewStatus, ChatMessage, Conference } from './types';
import * as GeminiService from './services/geminiService';

const STORAGE_KEY_PAPERS = 'opencspaper_history_v1';
const STORAGE_KEY_CONFIG = 'opencspaper_config_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [papers, setPapers] = useState<PaperSubmission[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedPapers = localStorage.getItem(STORAGE_KEY_PAPERS);
      if (savedPapers) {
        setPapers(JSON.parse(savedPapers));
      }

      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Deep merge to ensure new fields exist
        setConfig(prev => ({ 
          ...prev, 
          ...parsed,
          userProfile: { ...prev.userProfile, ...(parsed.userProfile || {}) },
          modelConfig: { ...prev.modelConfig, ...(parsed.modelConfig || {}) }
        }));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PAPERS, JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  const allConferences = [...INITIAL_CONFERENCES, ...config.customConferences];

  const handleStartReview = async (title: string, content: string, conferenceId: string) => {
    setIsLoading(true);
    const newPaper: PaperSubmission = {
      id: Date.now().toString(),
      title,
      content,
      conferenceId,
      status: ReviewStatus.CHECKING_DESK_REJECT,
      rebuttalChat: [],
      createdAt: Date.now()
    };

    setPapers(prev => [newPaper, ...prev]);
    setSelectedPaperId(newPaper.id);
    setActiveTab('review');

    try {
      const conf = allConferences.find(c => c.id === conferenceId) as Conference;
      
      // Step 1: Desk Reject
      const deskCheck = await GeminiService.checkDeskReject(content, conf, config);
      
      if (deskCheck.isDeskReject) {
        updatePaperStatus(newPaper.id, ReviewStatus.DESK_REJECTED, {
          isDeskReject: true,
          deskRejectReason: deskCheck.reason
        });
      } else {
        // Step 2: Deep Review
        updatePaperStatus(newPaper.id, ReviewStatus.REVIEWING);
        const reviewResult = await GeminiService.performDeepReview(content, conf, config);
        
        updatePaperStatus(newPaper.id, ReviewStatus.COMPLETED, reviewResult);
      }
    } catch (error) {
      console.error(error);
      updatePaperStatus(newPaper.id, ReviewStatus.FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaperStatus = (id: string, status: ReviewStatus, result?: any) => {
    setPapers(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, status, result: result ? { ...p.result, ...result } : p.result };
    }));
  };

  const handleUpdateRebuttal = (id: string, chat: ChatMessage[]) => {
    setPapers(prev => prev.map(p => (p.id === id ? { ...p, rebuttalChat: chat } : p)));
  };

  const handleAddToFewShot = (text: string) => {
    const timestamp = new Date().toLocaleDateString();
    const newEntry = `\n\n[User Example added ${timestamp}]:\n"${text}"`;
    setConfig(prev => ({
      ...prev,
      fewShotExamples: prev.fewShotExamples + newEntry
    }));
    alert("This review style has been added to your Knowledge Base settings!");
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-6 animate-fade-in-up">
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
             <button 
               onClick={() => setActiveTab('new')}
               className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
             >
               + New Review
             </button>
           </div>
           
           {papers.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
               <p className="text-gray-400">No reviews yet. Start a new one.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {papers.map(p => (
                 <div 
                   key={p.id} 
                   onClick={() => { setSelectedPaperId(p.id); setActiveTab('review'); }}
                   className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                 >
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{p.conferenceId}</span>
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       p.status === ReviewStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                       p.status === ReviewStatus.DESK_REJECTED ? 'bg-red-100 text-red-700' :
                       'bg-blue-100 text-blue-700'
                     }`}>
                       {p.status.replace('_', ' ')}
                     </span>
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                     {p.title}
                   </h3>
                   <p className="text-sm text-gray-500 line-clamp-3">
                     {p.result?.summary || "Review in progress..."}
                   </p>
                   {p.result?.finalDecision && (
                     <div className="mt-4 pt-4 border-t border-gray-100">
                       <span className="text-sm font-medium text-gray-900">Decision: {p.result.finalDecision}</span>
                     </div>
                   )}
                 </div>
               ))}
             </div>
           )}
        </div>
      );
    }

    if (activeTab === 'new') {
      return <ReviewWizard conferences={allConferences} onSubmit={handleStartReview} isLoading={isLoading} />;
    }

    if (activeTab === 'settings') {
      return <Settings config={config} onUpdateConfig={setConfig} />;
    }

    if (activeTab === 'review' && selectedPaperId) {
      const paper = papers.find(p => p.id === selectedPaperId);
      if (!paper) return <div>Paper not found</div>;
      return <ReviewDetail 
        paper={paper} 
        config={config} 
        onUpdateRebuttal={handleUpdateRebuttal} 
        onAddToFewShot={handleAddToFewShot}
      />;
    }

    return null;
  };

  return (
    <AppShell activeTab={activeTab === 'review' ? 'dashboard' : activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AppShell>
  );
};

export default App;