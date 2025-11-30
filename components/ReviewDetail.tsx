
import React, { useState, useEffect, useRef } from 'react';
import { PaperSubmission, ReviewStatus, ChatMessage, ReviewResult, AppConfig } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PaperAirplaneIcon, ArrowDownTrayIcon, PencilSquareIcon, CheckIcon, BookOpenIcon, ShieldCheckIcon, BeakerIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon, UserCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import * as GeminiService from '../services/geminiService';

interface ReviewDetailProps {
  paper: PaperSubmission;
  config: AppConfig;
  onUpdateRebuttal: (id: string, chat: ChatMessage[]) => void;
  onAddToFewShot: (text: string) => void;
}

const ScoreBadge = ({ label, score }: { label: string; score: number }) => {
  let colorClass = 'text-gray-300';
  if (score >= 8) colorClass = 'text-green-600';
  else if (score >= 5) colorClass = 'text-yellow-600';
  else if (score > 0) colorClass = 'text-red-600';

  return (
    <div className="flex flex-col p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</span>
      <div className="flex items-baseline">
        <span className={`text-3xl font-bold ${colorClass}`}>
          {score > 0 ? score : '-'}
        </span>
        <span className="text-gray-300 ml-1 text-sm font-medium">/10</span>
      </div>
    </div>
  );
};

const EditableSection = ({ title, content, onSave, onLearn, className = "" }: { title: string, content: string, onSave: (val: string) => void, onLearn: (val: string) => void, className?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);

  // Sync value if prop changes (e.g. initial load)
  useEffect(() => {
    setValue(content);
  }, [content]);

  const handleSave = () => {
    setIsEditing(false);
    onSave(value);
  };

  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <button onClick={handleSave} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              <CheckIcon className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <PencilSquareIcon className="w-4 h-4" />
            </button>
          )}
          {!isEditing && (
            <button 
              onClick={() => onLearn(value)} 
              title="Add this text to Few-Shot settings to train the model"
              className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <BookOpenIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full h-auto min-h-[150px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none"
        />
      ) : (
        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm text-justify">
           {value}
        </div>
      )}
    </div>
  );
};

export const ReviewDetail: React.FC<ReviewDetailProps> = ({ paper, config, onUpdateRebuttal, onAddToFewShot }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localResult, setLocalResult] = useState<ReviewResult | undefined>(paper.result);
  
  useEffect(() => {
    setLocalResult(paper.result);
  }, [paper.result]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [paper.rebuttalChat]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = { role: 'user', text: inputText, timestamp: Date.now() };
    const updatedChat = [...paper.rebuttalChat, newMsg];
    
    onUpdateRebuttal(paper.id, updatedChat);
    setInputText('');
    setIsTyping(true);

    try {
      const responseText = await GeminiService.generateRebuttalResponse(
        updatedChat,
        paper.title,
        localResult as ReviewResult,
        paper.conferenceId,
        config
      );

      const agentMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      onUpdateRebuttal(paper.id, [...updatedChat, agentMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = { role: 'model', text: "System Error: Could not generate response.", timestamp: Date.now() };
      onUpdateRebuttal(paper.id, [...updatedChat, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExportPDF = () => {
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) {
      alert("PDF Generator is loading...");
      return;
    }

    const doc = new jsPDF();
    const result = localResult;
    if (!result) return;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("OpenCSPaper Review", 10, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Title: ${paper.title.substring(0, 70)}${paper.title.length > 70 ? '...' : ''}`, 10, 30);
    doc.text(`Venue: ${paper.conferenceId.toUpperCase()} | Date: ${new Date(paper.createdAt).toLocaleDateString()}`, 10, 36);
    doc.text(`Reviewer: ${config.userProfile.name}, ${config.userProfile.role}`, 10, 42);

    let y = 55;
    
    // Scores Box
    if (result.ratings) {
       doc.setDrawColor(220);
       doc.setFillColor(248, 250, 252);
       doc.roundedRect(10, y, 190, 20, 3, 3, 'FD');
       
       doc.setFontSize(9);
       const metrics = [
         `Rel: ${result.ratings.relevance}`, 
         `Nov: ${result.ratings.novelty}`, 
         `Tech: ${result.ratings.technicalQuality}`,
         `Pres: ${result.ratings.presentation}`,
         `Repro: ${result.ratings.reproducibility}`,
         `Conf: ${result.ratings.confidence}`
       ];
       doc.text(metrics.join('  |  '), 15, y + 13);
       y += 30;
    }

    // Recommendation
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const decisionColor = result.finalDecision?.includes('Accept') ? '0,128,0' : '178,34,34';
    doc.setTextColor(decisionColor);
    doc.text(`Decision: ${result.finalDecision}`, 10, y);
    doc.setTextColor(0,0,0);
    y += 10;

    const sections = [
      { t: "Desk Rejection Assessment", c: result.deskRejectAssessment },
      { t: "Summary", c: result.summary },
      { t: "Strengths", c: result.strengths },
      { t: "Weaknesses", c: result.weaknesses },
      { t: "Missing Related Work", c: result.missingRelatedWork },
      { t: "Questions for Rebuttal", c: result.questionsForRebuttal },
      { t: "Ethics Review", c: `${result.ethicsFlag}: ${result.ethicsDescription}` },
      { t: "GenAI Analysis", c: result.genAIAnalysis },
    ];

    sections.forEach(sec => {
       if (!sec.c) return;
       
       if (y > 270) { doc.addPage(); y = 20; }
       
       doc.setFont("helvetica", "bold");
       doc.setFontSize(11);
       doc.text(sec.t, 10, y);
       y += 6;
       
       doc.setFont("helvetica", "normal");
       doc.setFontSize(10);
       const splitText = doc.splitTextToSize(sec.c, 185);
       doc.text(splitText, 10, y);
       y += splitText.length * 5 + 8;
    });

    doc.save(`Review_${paper.title.substring(0, 15)}.pdf`);
  };

  const steps = [
    { id: ReviewStatus.CHECKING_DESK_REJECT, label: "Desk Check" },
    { id: ReviewStatus.REVIEWING, label: "Deep Review" },
    { id: ReviewStatus.COMPLETED, label: "Decision" }
  ];

  const getStepState = (stepId: ReviewStatus) => {
    if (paper.status === ReviewStatus.DESK_REJECTED && stepId === ReviewStatus.CHECKING_DESK_REJECT) return 'rejected';
    if (paper.status === ReviewStatus.FAILED) return 'error';
    if (paper.status === stepId) return 'active';
    
    const order = [ReviewStatus.PARSING, ReviewStatus.CHECKING_DESK_REJECT, ReviewStatus.REVIEWING, ReviewStatus.COMPLETED];
    const currIdx = order.indexOf(paper.status === ReviewStatus.DESK_REJECTED ? ReviewStatus.CHECKING_DESK_REJECT : paper.status);
    const stepIdx = order.indexOf(stepId);
    
    return currIdx > stepIdx ? 'completed' : 'pending';
  };

  if (!localResult) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
      
      {/* Report Column */}
      <div className="lg:col-span-2 overflow-y-auto pr-4 custom-scrollbar space-y-8 pb-32">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{paper.title}</h2>
            <div className="flex items-center space-x-3 mt-2">
              <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider">
                {paper.conferenceId}
              </span>
              <span className="text-sm text-gray-500 font-medium">{new Date(paper.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          {paper.status === ReviewStatus.COMPLETED && (
            <button 
              onClick={handleExportPDF}
              className="flex-shrink-0 flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-all shadow-sm active:scale-95"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Download Report</span>
            </button>
          )}
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center relative max-w-md mx-auto">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-100 -z-0"></div>
            {steps.map((step) => {
              const state = getStepState(step.id);
              return (
                <div key={step.id} className="relative z-10 bg-white px-2 flex flex-col items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                     state === 'active' ? 'bg-white border-blue-500 text-blue-500 animate-pulse' :
                     state === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                     state === 'rejected' ? 'bg-red-500 border-red-500 text-white' :
                     'bg-white border-gray-200 text-gray-300'
                   }`}>
                     {state === 'completed' && <CheckIcon className="w-5 h-5" />}
                     {state === 'rejected' && <XCircleIcon className="w-5 h-5" />}
                     {state === 'active' && <ClockIcon className="w-5 h-5" />}
                     {state === 'pending' && <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                   </div>
                   <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${state === 'active' ? 'text-blue-600' : 'text-gray-400'}`}>
                     {step.label}
                   </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Messages */}
        {paper.status === ReviewStatus.DESK_REJECTED && localResult && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start space-x-4 animate-fade-in">
            <XCircleIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-red-900">Desk Rejected</h3>
              <p className="text-red-700 mt-1">{localResult.deskRejectReason}</p>
            </div>
          </div>
        )}

        {/* Deep Review Content */}
        {localResult && !localResult.isDeskReject && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <ScoreBadge label="Relevance" score={localResult.ratings?.relevance || 0} />
              <ScoreBadge label="Novelty" score={localResult.ratings?.novelty || 0} />
              <ScoreBadge label="Tech Quality" score={localResult.ratings?.technicalQuality || 0} />
              <ScoreBadge label="Presentation" score={localResult.ratings?.presentation || 0} />
              <ScoreBadge label="Reproduce" score={localResult.ratings?.reproducibility || 0} />
              <ScoreBadge label="Confidence" score={localResult.ratings?.confidence || 0} />
            </div>

            {/* Decision Banner */}
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${
              localResult.finalDecision?.includes('Accept') 
                ? 'bg-green-50 border-green-100' 
                : 'bg-orange-50 border-orange-100'
            }`}>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Final Recommendation</h3>
                <p className={`text-3xl font-bold tracking-tight ${
                  localResult.finalDecision?.includes('Accept') ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {localResult.finalDecision}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                localResult.finalDecision?.includes('Accept') ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'
              }`}>
                {localResult.finalDecision?.includes('Accept') ? <CheckIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600">
                  <span className="font-bold text-gray-800 block mb-1">Desk Rejection Assessment</span>
                  {localResult.deskRejectAssessment || "Passed checks."}
               </div>

               <EditableSection 
                  title="Paper Summary" 
                  content={localResult.summary || ''} 
                  onSave={(val) => setLocalResult({...localResult, summary: val})}
                  onLearn={onAddToFewShot}
               />
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableSection 
                    title="Strengths" 
                    content={localResult.strengths || ''} 
                    onSave={(val) => setLocalResult({...localResult, strengths: val})}
                    onLearn={onAddToFewShot}
                    className="h-full"
                  />
                  <EditableSection 
                    title="Weaknesses" 
                    content={localResult.weaknesses || ''} 
                    onSave={(val) => setLocalResult({...localResult, weaknesses: val})}
                    onLearn={onAddToFewShot}
                    className="h-full"
                  />
               </div>

               <EditableSection 
                  title="Missing Related Work" 
                  content={localResult.missingRelatedWork || 'None identified.'} 
                  onSave={(val) => setLocalResult({...localResult, missingRelatedWork: val})}
                  onLearn={onAddToFewShot}
               />

               <EditableSection 
                  title="Questions for Rebuttal" 
                  content={localResult.questionsForRebuttal || 'No specific questions.'} 
                  onSave={(val) => setLocalResult({...localResult, questionsForRebuttal: val})}
                  onLearn={onAddToFewShot}
               />

               {/* Special Analysis Sections */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">Ethics Review</h3>
                    </div>
                    <div className="text-sm">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase mr-2 ${localResult.ethicsFlag === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        Flag: {localResult.ethicsFlag}
                      </span>
                      <p className="mt-2 text-gray-600 leading-relaxed">{localResult.ethicsDescription}</p>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <BeakerIcon className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-gray-900">GenAI Content Analysis</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{localResult.genAIAnalysis}</p>
                 </div>
               </div>

            </div>
          </div>
        )}
      </div>

      {/* Rebuttal Chat Column */}
      <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
             <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-700" />
             <span className="font-bold text-gray-900 text-sm">Rebuttal Simulation</span>
          </div>
          {paper.status === ReviewStatus.COMPLETED && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full uppercase tracking-wide">Live</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9FAFB]">
          {paper.status !== ReviewStatus.COMPLETED ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
              <UserCircleIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm font-medium">Rebuttal becomes available<br/>after the review is decisioned.</p>
            </div>
          ) : (
            <>
              {paper.rebuttalChat.length === 0 && (
                 <div className="text-center text-xs text-gray-400 my-8 px-8 leading-relaxed">
                   The reviewer is ready. Defend your paper against the weaknesses mentioned in the report.
                 </div>
              )}
              {paper.rebuttalChat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                 <div className="flex justify-start">
                   <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                     <div className="flex space-x-1.5">
                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                       <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                     </div>
                   </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        <div className="p-3 bg-white border-t border-gray-100">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-1 pl-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white focus-within:shadow-sm">
            <input
              type="text"
              disabled={paper.status !== ReviewStatus.COMPLETED || isTyping}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={paper.status === ReviewStatus.COMPLETED ? "Type your rebuttal..." : "Waiting..."}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400 py-2 disabled:opacity-50"
            />
            <button
              disabled={paper.status !== ReviewStatus.COMPLETED || !inputText.trim() || isTyping}
              onClick={handleSendMessage}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
