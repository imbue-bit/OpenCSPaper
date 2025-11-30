import React, { useState } from 'react';
import { AppConfig, Conference } from '../types';
import { 
  PlusIcon, TrashIcon, KeyIcon, CpuChipIcon, 
  AdjustmentsHorizontalIcon, BeakerIcon, UserCircleIcon, 
  BookOpenIcon, CubeTransparentIcon 
} from '@heroicons/react/24/outline';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

export const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'model' | 'knowledge'>('general');
  const [newConfName, setNewConfName] = useState('');
  
  // Handlers
  const handleAddConference = () => {
    if (!newConfName) return;
    const newConf: Conference = {
      id: newConfName.toLowerCase().replace(/\s+/g, '-'),
      name: newConfName,
      shortName: newConfName,
      description: 'Custom Conference',
      focusArea: 'General Computer Science',
      customRules: ''
    };
    onUpdateConfig({
      ...config,
      customConferences: [...config.customConferences, newConf]
    });
    setNewConfName('');
  };

  const handleRemoveConference = (id: string) => {
    onUpdateConfig({
      ...config,
      customConferences: config.customConferences.filter(c => c.id !== id)
    });
  };

  const updateModelConfig = (key: keyof typeof config.modelConfig, value: any) => {
    onUpdateConfig({
      ...config,
      modelConfig: { ...config.modelConfig, [key]: value }
    });
  };

  const updateUserProfile = (key: keyof typeof config.userProfile, value: string) => {
    onUpdateConfig({
      ...config,
      userProfile: { ...config.userProfile, [key]: value }
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="mb-6 flex space-x-1 p-1 bg-gray-100/80 rounded-xl w-fit">
        <TabButton 
          active={activeTab === 'general'} 
          onClick={() => setActiveTab('general')} 
          icon={UserCircleIcon} 
          label="Profile & General" 
        />
        <TabButton 
          active={activeTab === 'model'} 
          onClick={() => setActiveTab('model')} 
          icon={CpuChipIcon} 
          label="AI Model" 
        />
        <TabButton 
          active={activeTab === 'knowledge'} 
          onClick={() => setActiveTab('knowledge')} 
          icon={BookOpenIcon} 
          label="Knowledge Base" 
        />
      </div>

      <div className="space-y-6">
        
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-fade-in">
            {/* User Profile */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">Reviewer Persona</h3>
                <p className="text-xs text-gray-500">The AI will adopt this identity during reviews.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={config.userProfile.name}
                    onChange={(e) => updateUserProfile('name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role / Title</label>
                  <input 
                    type="text" 
                    value={config.userProfile.role}
                    onChange={(e) => updateUserProfile('role', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                  <input 
                    type="text" 
                    value={config.userProfile.affiliation}
                    onChange={(e) => updateUserProfile('affiliation', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area of Expertise (Tags)</label>
                  <input 
                    type="text" 
                    value={config.userProfile.expertise}
                    onChange={(e) => updateUserProfile('expertise', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="e.g. Computer Vision, Reinforcement Learning"
                  />
                </div>
              </div>
            </div>

            {/* Conference Management */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <div>
                   <h3 className="font-semibold text-gray-900">Custom Conferences</h3>
                   <p className="text-xs text-gray-500">Manage venues available in the review wizard.</p>
                 </div>
               </div>
               
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex space-x-2">
                 <input 
                   type="text" 
                   value={newConfName}
                   onChange={(e) => setNewConfName(e.target.value)}
                   placeholder="Add new conference name..."
                   className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                 />
                 <button 
                   onClick={handleAddConference}
                   className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center"
                 >
                   <PlusIcon className="w-4 h-4 mr-1" /> Add
                 </button>
               </div>

               <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                 {config.customConferences.length === 0 && (
                   <div className="p-6 text-center text-gray-400 text-sm">No custom conferences added yet.</div>
                 )}
                 {config.customConferences.map(conf => (
                   <div key={conf.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                     <div>
                       <span className="font-medium text-gray-900 block">{conf.name}</span>
                       <span className="text-xs text-gray-500">ID: {conf.id}</span>
                     </div>
                     <button 
                       onClick={() => handleRemoveConference(conf.id)}
                       className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                     >
                       <TrashIcon className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* TAB: AI MODEL */}
        {activeTab === 'model' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
             <div className="p-6 space-y-8">
                
                {/* Connection Settings */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                       <label className="block text-sm font-medium text-gray-900">Model Architecture</label>
                       <p className="text-xs text-gray-500">Choose the reasoning engine.</p>
                    </div>
                    <select 
                      value={config.modelConfig.modelName}
                      onChange={(e) => updateModelConfig('modelName', e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-2.5-flash-thinking-exp-0121">Gemini 2.5 Thinking</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                       <label className="block text-sm font-medium text-gray-900">API Key Override</label>
                       <p className="text-xs text-gray-500">Optional. Overrides system key.</p>
                    </div>
                    <div className="relative">
                      <KeyIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input 
                        type="password" 
                        placeholder="sk-..."
                        value={config.modelConfig.apiKey || ''}
                        onChange={(e) => updateModelConfig('apiKey', e.target.value)}
                        className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                       <label className="block text-sm font-medium text-gray-900">Custom Base URL</label>
                       <p className="text-xs text-gray-500">For enterprise or proxy setups.</p>
                    </div>
                    <div className="relative">
                      <BeakerIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input 
                        type="text" 
                        placeholder="https://api.example.com"
                        value={config.modelConfig.baseUrl || ''}
                        onChange={(e) => updateModelConfig('baseUrl', e.target.value)}
                        className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-8">
                  <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center">
                    <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                    Advanced Hyperparameters
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Temperature */}
                     <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium text-gray-700">Temperature</label>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{config.modelConfig.temperature}</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.1"
                          value={config.modelConfig.temperature}
                          onChange={(e) => updateModelConfig('temperature', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-xs text-gray-400">Higher values produce more creative but less deterministic outputs.</p>
                     </div>

                     {/* Top P */}
                     <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium text-gray-700">Top P</label>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{config.modelConfig.topP}</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05"
                          value={config.modelConfig.topP}
                          onChange={(e) => updateModelConfig('topP', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-xs text-gray-400">Nucleus sampling probability mass.</p>
                     </div>

                     {/* Top K */}
                     <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium text-gray-700">Top K</label>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{config.modelConfig.topK}</span>
                        </div>
                        <input 
                          type="range" min="1" max="100" step="1"
                          value={config.modelConfig.topK}
                          onChange={(e) => updateModelConfig('topK', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-xs text-gray-400">Limits the number of tokens to consider for each step.</p>
                     </div>
                  </div>
                </div>

             </div>
          </div>
        )}

        {/* TAB: KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
           <div className="space-y-6 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Few-Shot Examples & Style Guide</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    The AI uses these examples to learn how you write reviews. You can manually edit this or add to it from the Review details page.
                  </p>
                </div>
                <textarea
                  value={config.fewShotExamples}
                  onChange={(e) => onUpdateConfig({ ...config, fewShotExamples: e.target.value })}
                  className="w-full h-96 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 leading-relaxed custom-scrollbar"
                  placeholder="Example: 'The paper lacks sufficient experimental validation...'"
                />
             </div>
             
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                <CubeTransparentIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Pro Tip</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    After a review is generated, you can edit it and click "Learn Style" to automatically append it here. This creates a feedback loop that improves the agent over time.
                  </p>
                </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};