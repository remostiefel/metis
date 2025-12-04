import { Module, Priority } from '@/types';

export function filterModulesByStatus(modules: Module[], status: Module['status']) {
    return modules.filter((module) => module.status === status);
}

export function getEisenhowerMatrix(modules: Module[]) {
    return {
        doFirst: modules.filter(m => m.importance === 'high' && m.urgency === 'high'), // Important & Urgent
        schedule: modules.filter(m => m.importance === 'high' && m.urgency !== 'high'), // Important & Not Urgent
        delegate: modules.filter(m => m.importance !== 'high' && m.urgency === 'high'), // Not Important & Urgent
        eliminate: modules.filter(m => m.importance !== 'high' && m.urgency !== 'high'), // Not Important & Not Urgent
    };
}

export function calculateProgress(modules: Module[]) {
    const total = modules.length;
    if (total === 0) return { total: 0, completed: 0, percentage: 0 };

    const completed = modules.filter(m => m.status === 'final').length;
    const percentage = Math.round((completed / total) * 100);

    return {
        total,
        completed,
        percentage
    };
}

export function getStats(modules: Module[]) {
    const totalWords = modules.reduce((acc, module) => {
        return acc + module.content.trim().split(/\s+/).length;
    }, 0);

    const completedModules = modules.filter(m => m.status === 'final').length;
    const totalModules = modules.length;
    const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    return {
        totalWords,
        totalModules,
        completedModules,
        progress,
    };
}
