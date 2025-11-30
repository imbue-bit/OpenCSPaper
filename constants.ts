import { Conference, AppConfig } from './types';

export const INITIAL_CONFERENCES: Conference[] = [
  {
    id: 'neurips',
    name: 'NeurIPS',
    shortName: 'NeurIPS',
    description: 'Neural Information Processing Systems',
    focusArea: 'Machine Learning, Computational Neuroscience, Deep Learning theory.'
  },
  {
    id: 'iclr',
    name: 'ICLR',
    shortName: 'ICLR',
    description: 'International Conference on Learning Representations',
    focusArea: 'Deep Learning, Representation Learning, Generative Models.'
  },
  {
    id: 'icml',
    name: 'ICML',
    shortName: 'ICML',
    description: 'International Conference on Machine Learning',
    focusArea: 'General Machine Learning, Optimization, Statistics.'
  },
  {
    id: 'kdd',
    name: 'KDD',
    shortName: 'KDD',
    description: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining',
    focusArea: 'Data Mining, Applied Data Science, Scalable Algorithms.'
  },
  {
    id: 'acl',
    name: 'ACL',
    shortName: 'ACL',
    description: 'Association for Computational Linguistics',
    focusArea: 'NLP, Computational Linguistics, Language Models.'
  },
  {
    id: 'cvpr',
    name: 'CVPR',
    shortName: 'CVPR',
    description: 'Conference on Computer Vision and Pattern Recognition',
    focusArea: 'Computer Vision, Image Processing.'
  }
];

export const DEFAULT_FEW_SHOT = `Example of a good review tone:
"While the proposed method for graph neural networks is theoretically interesting, the experimental validation lacks comparison with strong baselines like GraphSAGE or GAT on large-scale datasets. The novelty is marginal as it primarily combines existing attention mechanisms."
`;

export const DEFAULT_CONFIG: AppConfig = {
  userProfile: {
    name: "Reviewer",
    role: "Senior Area Chair",
    affiliation: "Top Tier University",
    expertise: "Machine Learning, Deep Learning, AI"
  },
  fewShotExamples: DEFAULT_FEW_SHOT,
  customConferences: [],
  modelConfig: {
    modelName: 'gemini-2.5-flash',
    temperature: 0.4,
    topK: 40,
    topP: 0.95
  }
};