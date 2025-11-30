
export enum ReviewStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  CHECKING_DESK_REJECT = 'CHECKING_DESK_REJECT',
  DESK_REJECTED = 'DESK_REJECTED',
  REVIEWING = 'REVIEWING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ReviewRatings {
  relevance: number;
  novelty: number;
  technicalQuality: number;
  presentation: number;
  reproducibility: number;
  confidence: number;
}

export interface ReviewResult {
  isDeskReject: boolean;
  deskRejectReason?: string;
  
  // New Detailed Report Fields
  deskRejectAssessment?: string;
  summary?: string;
  strengths?: string; // Content as a formatted string (paragraphs)
  weaknesses?: string; // Content as a formatted string (paragraphs)
  missingRelatedWork?: string;
  questionsForRebuttal?: string;
  
  ratings?: ReviewRatings;
  
  ethicsFlag?: 'Yes' | 'No';
  ethicsDescription?: string;
  
  genAIAnalysis?: string;
  
  finalDecision?: string;
  rawOutput?: string;
}

export interface Conference {
  id: string;
  name: string;
  shortName: string;
  description: string;
  focusArea: string;
  customRules?: string; // User defined rules
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface PaperSubmission {
  id: string;
  title: string;
  content: string; // Text content of the paper
  conferenceId: string;
  status: ReviewStatus;
  result?: ReviewResult;
  rebuttalChat: ChatMessage[];
  createdAt: number;
}

export interface ModelConfig {
  modelName: string;
  apiKey?: string; // Optional override
  temperature: number;
  topK: number;
  topP: number;
  baseUrl?: string; // Optional custom endpoint
}

export interface UserProfile {
  name: string;
  role: string; // e.g. "Senior Area Chair"
  affiliation: string;
  expertise: string; // comma separated tags
}

export interface AppConfig {
  userProfile: UserProfile;
  fewShotExamples: string; // Generic few shot text
  customConferences: Conference[];
  modelConfig: ModelConfig;
}
