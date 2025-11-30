import React, { useState } from 'react';
import { Conference } from '../types';
import { ArrowUpTrayIcon, DocumentTextIcon, SparklesIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface ReviewWizardProps {
  conferences: Conference[];
  onSubmit: (title: string, content: string, conferenceId: string) => void;
  isLoading: boolean;
}

// Helper to access window globals
const getPdfLib = () => (window as any).pdfjsLib;

export const ReviewWizard: React.FC<ReviewWizardProps> = ({ conferences, onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedConf, setSelectedConf] = useState(conferences[0]?.id || '');
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const isFormValid = title.length > 3 && content.length > 50 && selectedConf && !isParsingPdf;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      await parsePdf(file);
    } else {
      // Text based files
      const reader = new FileReader();
      reader.onload = (ev) => {
        setContent(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
    
    // Auto-fill title from filename if empty
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const parsePdf = async (file: File) => {
    setIsParsingPdf(true);
    try {
      const pdfLib = getPdfLib();
      if (!pdfLib) {
        alert("PDF Library not loaded yet. Please wait or refresh.");
        return;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      // Limit to first 10 pages to avoid massive token usage/latency
      const maxPages = Math.min(pdf.numPages, 10);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `[Page ${i}]\n${pageText}\n\n`;
      }
      
      setContent(fullText);
    } catch (err) {
      console.error(err);
      alert("Failed to parse PDF. Please try a text file.");
    } finally {
      setIsParsingPdf(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up pb-20">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Start New Review</h1>
        <p className="text-gray-500">Submit a paper PDF or text for AI-powered agentic review.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-6">
          
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Paper Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              placeholder="e.g. Attention Is All You Need"
            />
          </div>

          {/* Conference Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Target Conference</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {conferences.map(conf => (
                <button
                  key={conf.id}
                  onClick={() => setSelectedConf(conf.id)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    selectedConf === conf.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {conf.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-gray-700">Paper Content</label>
              <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1">
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                <span>Upload PDF / Text</span>
                <input 
                  type="file" 
                  accept=".pdf,.txt,.tex,.md" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
            
            <div className="relative">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isParsingPdf}
                className={`w-full h-64 px-4 py-4 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-mono text-sm leading-relaxed ${isParsingPdf ? 'opacity-50' : ''}`}
                placeholder={isParsingPdf ? "Extracting text from PDF..." : "Paste the main text here or upload a file..."}
              />
              {isParsingPdf && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
                     <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <span className="text-sm font-medium text-gray-700">Parsing PDF...</span>
                   </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 ml-1">
              Supports .pdf, .txt, .tex, .md. For PDFs, text is extracted locally.
            </p>
          </div>

        </div>

        {/* Footer Action */}
        <div className="bg-gray-50/50 p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => onSubmit(title, content, selectedConf)}
            disabled={!isFormValid || isLoading}
            className={`flex items-center space-x-2 px-8 py-3 rounded-full font-medium transition-all transform active:scale-95 ${
              isFormValid && !isLoading
                ? 'bg-black text-white hover:bg-gray-800 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
               <>
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span>Processing...</span>
               </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>Start Agentic Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};