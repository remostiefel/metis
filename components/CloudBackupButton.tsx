'use client';

import { useState } from 'react';
import { Cloud, Check } from 'lucide-react';
import { backupToCloud } from '@/app/actions/cloudBackup';

export function CloudBackupButton() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [lastBackup, setLastBackup] = useState<Date | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const result = await backupToCloud();

            if (result.success) {
                setLastBackup(new Date(result.timestamp));
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Backup error:', error);
            alert('Fehler beim Cloud-Backup');
        } finally {
            setIsBackingUp(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleBackup}
                disabled={isBackingUp}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${showSuccess
                        ? 'bg-success/10 text-success-foreground border-2 border-success/20'
                        : 'bg-white border-2 border-primary/20 text-primary-foreground hover:bg-primary/5'
                    } disabled:opacity-50`}
            >
                {showSuccess ? (
                    <>
                        <Check size={16} />
                        Gesichert!
                    </>
                ) : (
                    <>
                        <Cloud size={16} className={isBackingUp ? 'animate-pulse' : ''} />
                        {isBackingUp ? 'Sichere...' : 'Cloud Backup'}
                    </>
                )}
            </button>
            {lastBackup && !showSuccess && (
                <div className="absolute top-full mt-1 right-0 text-xs text-gray-400 whitespace-nowrap">
                    Zuletzt: {lastBackup.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            )}
        </div>
    );
}
