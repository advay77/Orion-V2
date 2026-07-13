import { Task, AgentType } from './types';
import { IntentType } from './intent-classifier';

export interface TaskTemplate {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo: AgentType;
  skill?: string;
}

export interface IntentTaskTemplate {
  intent: IntentType;
  tasks: TaskTemplate[];
  skippedAgents: AgentType[];
  constraints: string[];
}

// Common tasks for framework-based frontend projects
const FRAMEWORK_BASED_FRONTEND_TASKS: TaskTemplate[] = [
  {
    id: 'rd_analyze_target',
    description: 'Analyze the target reference (if provided) and extract design/layout requirements',
    priority: 'high',
    assignedTo: 'research',
    skill: 'layout_analysis',
  },
  {
    id: 'eng_project_structure',
    description: 'Generate project folder structure and package.json',
    priority: 'high',
    assignedTo: 'engineering',
    skill: 'project_generation',
  },
  {
    id: 'eng_components',
    description: 'Generate UI components matching the target layout',
    priority: 'high',
    assignedTo: 'engineering',
    skill: 'component_development',
  },
  {
    id: 'eng_pages',
    description: 'Generate page components and routing',
    priority: 'high',
    assignedTo: 'engineering',
    skill: 'page_development',
  },
  {
    id: 'eng_styling',
    description: 'Apply styling using Tailwind CSS (or appropriate framework styling)',
    priority: 'high',
    assignedTo: 'engineering',
    skill: 'styling',
  },
  {
    id: 'eng_assets',
    description: 'Generate assets folder and README.md',
    priority: 'medium',
    assignedTo: 'engineering',
    skill: 'asset_management',
  },
];

export const INTENT_TASK_TEMPLATES: Record<IntentType, IntentTaskTemplate> = {
  UI_CLONE: {
    intent: 'UI_CLONE',
    tasks: [
      {
        id: 'rd_analyze_structure',
        description: 'Analyze the target website structure, layout hierarchy, and component organization',
        priority: 'high',
        assignedTo: 'research',
        skill: 'layout_analysis',
      },
      {
        id: 'rd_extract_design',
        description: 'Extract color palette, typography, spacing patterns, and animation styles from the target',
        priority: 'high',
        assignedTo: 'research',
        skill: 'design_extraction',
      },
      {
        id: 'eng_html_structure',
        description: 'Generate index.html with proper semantic HTML structure matching the target layout',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'html_generation',
      },
      {
        id: 'eng_css_styles',
        description: 'Generate styles.css with extracted colors, typography, spacing, and responsive layout',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'css_generation',
      },
      {
        id: 'eng_javascript',
        description: 'Generate script.js only if interactive elements are required (animations, forms, dynamic content)',
        priority: 'medium',
        assignedTo: 'engineering',
        skill: 'javascript_generation',
      },
      {
        id: 'eng_assets',
        description: 'Generate assets folder structure for images, icons, and static resources',
        priority: 'low',
        assignedTo: 'engineering',
        skill: 'asset_management',
      },
      {
        id: 'eng_responsive',
        description: 'Ensure responsive layout works across mobile, tablet, and desktop viewports',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'responsive_design',
      },
    ],
    skippedAgents: ['marketing'],
    constraints: [
      'NEVER generate backend APIs, databases, or authentication',
      'NEVER generate React, Vue, Angular, or other frameworks unless explicitly requested',
      'NEVER generate full-stack architecture',
      'NEVER generate deployment configurations',
      'ONLY generate HTML, CSS, and minimal JavaScript if needed',
      'STRICTLY follow the extracted design system',
      'DO NOT add features not present in the original design',
    ],
  },

  FULL_STACK_APP: {
    intent: 'FULL_STACK_APP',
    tasks: [
      {
        id: 'rd_tech_stack',
        description: 'Research and recommend appropriate tech stack for the application requirements',
        priority: 'high',
        assignedTo: 'research',
        skill: 'tech_stack_selection',
      },
      {
        id: 'rd_architecture',
        description: 'Design system architecture including frontend, backend, and database integration',
        priority: 'high',
        assignedTo: 'research',
        skill: 'system_architecture',
      },
      {
        id: 'eng_frontend',
        description: 'Build frontend interface with chosen framework (React/Next.js/Vue/etc)',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'frontend_development',
      },
      {
        id: 'eng_backend',
        description: 'Implement backend API endpoints and business logic',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'backend_development',
      },
      {
        id: 'eng_database',
        description: 'Design and implement database schema and migrations',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'database_design',
      },
      {
        id: 'eng_auth',
        description: 'Implement user authentication and authorization system',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'authentication',
      },
      {
        id: 'eng_integration',
        description: 'Integrate frontend with backend APIs and handle state management',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'api_integration',
      },
      {
        id: 'mkt_content',
        description: 'Create marketing copy for landing pages and user onboarding',
        priority: 'medium',
        assignedTo: 'marketing',
        skill: 'copywriting',
      },
      {
        id: 'mkt_strategy',
        description: 'Define go-to-market strategy and user acquisition channels',
        priority: 'medium',
        assignedTo: 'marketing',
        skill: 'marketing_strategy',
      },
    ],
    skippedAgents: [],
    constraints: [
      'Ensure frontend and backend are properly integrated',
      'Implement proper error handling and validation',
      'Include authentication and authorization where needed',
      'Design scalable database schema',
      'Follow best practices for the chosen tech stack',
    ],
  },

  FRONTEND_ONLY: {
    intent: 'FRONTEND_ONLY',
    tasks: FRAMEWORK_BASED_FRONTEND_TASKS,
    skippedAgents: ['marketing'],
    constraints: [
      'Focus only on frontend implementation',
      'Do not generate backend APIs or databases',
      'Use mock data for API calls if needed',
      'Implement proper component composition',
      'Ensure accessibility standards are met',
      'ALL files must be returned as markdown code blocks with valid path="" attribute',
    ],
  },

  BACKEND_ONLY: {
    intent: 'BACKEND_ONLY',
    tasks: [
      {
        id: 'rd_api_design',
        description: 'Design RESTful API endpoints and data models',
        priority: 'high',
        assignedTo: 'research',
        skill: 'api_design',
      },
      {
        id: 'eng_database',
        description: 'Design and implement database schema with migrations',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'database_design',
      },
      {
        id: 'eng_endpoints',
        description: 'Implement API endpoints with proper validation and error handling',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'api_implementation',
      },
      {
        id: 'eng_auth',
        description: 'Implement authentication and middleware if required',
        priority: 'medium',
        assignedTo: 'engineering',
        skill: 'authentication',
      },
      {
        id: 'eng_testing',
        description: 'Write unit and integration tests for API endpoints',
        priority: 'medium',
        assignedTo: 'engineering',
        skill: 'testing',
      },
      {
        id: 'eng_docs',
        description: 'Generate API documentation with examples',
        priority: 'medium',
        assignedTo: 'engineering',
        skill: 'documentation',
      },
    ],
    skippedAgents: ['marketing'],
    constraints: [
      'Focus only on backend implementation',
      'Do not generate frontend code',
      'Implement proper API versioning',
      'Include comprehensive error handling',
      'Document all endpoints clearly',
    ],
  },

  DOCUMENTATION: {
    intent: 'DOCUMENTATION',
    tasks: [
      {
        id: 'rd_structure',
        description: 'Research best practices for documentation structure and format',
        priority: 'medium',
        assignedTo: 'research',
        skill: 'documentation_research',
      },
      {
        id: 'eng_content',
        description: 'Write comprehensive documentation content with examples',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'technical_writing',
      },
      {
        id: 'eng_formatting',
        description: 'Format documentation in appropriate format (Markdown, HTML, etc)',
        priority: 'high',
        assignedTo: 'engineering',
        skill: 'formatting',
      },
    ],
    skippedAgents: ['marketing'],
    constraints: [
      'Focus on clear, concise documentation',
      'Include code examples where relevant',
      'Use appropriate formatting for the target audience',
      'Ensure documentation is complete and accurate',
    ],
  },

  RESEARCH: {
    intent: 'RESEARCH',
    tasks: [
      {
        id: 'rd_investigation',
        description: 'Conduct thorough investigation on the research topic',
        priority: 'high',
        assignedTo: 'research',
        skill: 'investigation',
      },
      {
        id: 'rd_analysis',
        description: 'Analyze findings and synthesize key insights',
        priority: 'high',
        assignedTo: 'research',
        skill: 'analysis',
      },
      {
        id: 'rd_report',
        description: 'Compile research report with conclusions and recommendations',
        priority: 'high',
        assignedTo: 'research',
        skill: 'reporting',
      },
    ],
    skippedAgents: ['engineering', 'marketing'],
    constraints: [
      'Focus on research and analysis only',
      'Provide data-backed conclusions',
      'Cite sources where applicable',
      'Present findings in a clear, structured format',
    ],
  },

  MARKETING: {
    intent: 'MARKETING',
    tasks: [
      {
        id: 'mkt_strategy',
        description: 'Develop comprehensive marketing strategy',
        priority: 'high',
        assignedTo: 'marketing',
        skill: 'strategy',
      },
      {
        id: 'mkt_copy',
        description: 'Write marketing copy for various channels',
        priority: 'high',
        assignedTo: 'marketing',
        skill: 'copywriting',
      },
      {
        id: 'mkt_content',
        description: 'Create content calendar and marketing materials',
        priority: 'medium',
        assignedTo: 'marketing',
        skill: 'content_creation',
      },
    ],
    skippedAgents: ['engineering', 'research'],
    constraints: [
      'Focus on marketing and copywriting only',
      'Tailor content to target audience',
      'Include clear calls-to-action',
      'Align with brand voice and guidelines',
    ],
  },
};

export function getTasksForIntent(intent: IntentType): Task[] {
  const template = INTENT_TASK_TEMPLATES[intent];
  
  return template.tasks.map((taskTemplate) => ({
    id: taskTemplate.id,
    description: taskTemplate.description,
    priority: taskTemplate.priority,
    assignedTo: taskTemplate.assignedTo,
    skill: taskTemplate.skill,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function getConstraintsForIntent(intent: IntentType): string[] {
  return INTENT_TASK_TEMPLATES[intent].constraints;
}

export function getSkippedAgentsForIntent(intent: IntentType): AgentType[] {
  return INTENT_TASK_TEMPLATES[intent].skippedAgents;
}
