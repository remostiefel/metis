'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Cloud Backup via Git
 * Commits all changes and pushes to GitHub
 */
export async function backupToCloud() {
    try {
        const projectRoot = path.join(process.cwd());

        // Git add all changes
        await execAsync('git add -A', { cwd: projectRoot });

        // Commit with timestamp
        const timestamp = new Date().toISOString();
        await execAsync(`git commit -m "Auto-backup: ${timestamp}"`, { cwd: projectRoot });

        // Push to GitHub
        await execAsync('git push origin main', { cwd: projectRoot });

        return {
            success: true,
            message: 'Erfolgreich in der Cloud gesichert! ☁️',
            timestamp,
        };
    } catch (error: any) {
        // If no changes to commit, that's okay
        if (error.message?.includes('nothing to commit')) {
            return {
                success: true,
                message: 'Keine Änderungen zum Sichern.',
                timestamp: new Date().toISOString(),
            };
        }

        console.error('Cloud backup error:', error);
        return {
            success: false,
            message: 'Fehler beim Cloud-Backup: ' + error.message,
            timestamp: new Date().toISOString(),
        };
    }
}
