export type ModuleStatus = 'entwurf' | 'überarbeitung' | 'final';
export type Priority = 'low' | 'medium' | 'high';

export interface ModuleFrontmatter {
  id: string;
  title: string;
  kapitel: number | string;
  unterkapitel: number | string;
  tags: string[];
  status: ModuleStatus;
  priority: Priority;
  importance: Priority;
  urgency: Priority;
  created: string;
  updated: string;
  summary?: string;
  quotes?: string[];
  questions?: string[];
}

export interface Module extends ModuleFrontmatter {
  slug: string;
  content: string;
  htmlContent?: string;
  filePath: string;
}

export interface PomodoroSession {
  id: string;
  moduleId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  completed: boolean;
  notes?: string;
}
