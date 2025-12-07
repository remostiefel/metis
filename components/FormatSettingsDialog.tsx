import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface FormatStyle {
    fontSize: string;
    color: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
    marginTop: string;
    marginBottom: string;
    padding?: string;
    backgroundColor?: string;
    borderRadius?: string;
    borderLeft?: string;
    border?: string;
    [key: string]: string | undefined;
}

interface FormatSettings {
    [key: string]: FormatStyle;
}

interface FormatSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: FormatSettings) => void;
}

const formatLabels: { [key: string]: string } = {
    subtitle: 'Untertitel',
    haiku: 'Haiku',
    keypoints: 'Kernaussagen',
    reflection: 'Reflexionsfragen',
    links: 'Verknüpfungen / Siehe auch'
};

const defaultSettings: FormatSettings = {
    // ... defaults matching the JSON file for reset functionality if needed
    // Simplified for brevity, fetching from API is better
};

export function FormatSettingsDialog({ isOpen, onClose, onSave }: FormatSettingsDialogProps) {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<FormatSettings>({});
    const [activeTab, setActiveTab] = useState<string>('subtitle');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/settings/formats')
                .then(res => res.json())
                .then(data => {
                    setSettings(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    showToast('Fehler beim Laden der Einstellungen', 'error');
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const handleChange = (property: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [property]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/settings/formats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                showToast('Einstellungen gespeichert', 'success');
                onSave(settings); // Propagate to parent to update styles
                onClose();
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            showToast('Fehler beim Speichern', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Formate bearbeiten</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-100 overflow-y-auto p-4 space-y-2">
                        {Object.keys(formatLabels).map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === key
                                        ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {formatLabels[key]}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Lade Einstellungen...</div>
                        ) : settings[activeTab] ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Text & Schrift</h3>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Schriftgröße</label>
                                            <input
                                                type="text"
                                                value={settings[activeTab].fontSize}
                                                onChange={(e) => handleChange('fontSize', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm"
                                                placeholder="z.B. 1.2rem oder 16px"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Schriftfarbe</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={settings[activeTab].color}
                                                    onChange={(e) => handleChange('color', e.target.value)}
                                                    className="h-9 w-9 p-1 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={settings[activeTab].color}
                                                    onChange={(e) => handleChange('color', e.target.value)}
                                                    className="flex-1 p-2 border rounded-lg text-sm uppercase font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Fett gedruckt</label>
                                                <select
                                                    value={settings[activeTab].fontWeight}
                                                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                                                    className="w-full p-2 border rounded-lg text-sm"
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="600">Fett</option>
                                                    <option value="bold">Bold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Kursiv</label>
                                                <select
                                                    value={settings[activeTab].fontStyle}
                                                    onChange={(e) => handleChange('fontStyle', e.target.value)}
                                                    className="w-full p-2 border rounded-lg text-sm"
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="italic">Kursiv</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Ausrichtung</label>
                                            <select
                                                value={settings[activeTab].textAlign}
                                                onChange={(e) => handleChange('textAlign', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm"
                                            >
                                                <option value="left">Links</option>
                                                <option value="center">Zentriert</option>
                                                <option value="right">Rechts</option>
                                                <option value="justify">Blocksatz</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Box & Abstand</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Abstand Oben</label>
                                                <input
                                                    type="text"
                                                    value={settings[activeTab].marginTop}
                                                    onChange={(e) => handleChange('marginTop', e.target.value)}
                                                    className="w-full p-2 border rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Abstand Unten</label>
                                                <input
                                                    type="text"
                                                    value={settings[activeTab].marginBottom}
                                                    onChange={(e) => handleChange('marginBottom', e.target.value)}
                                                    className="w-full p-2 border rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Innenabstand (Padding)</label>
                                            <input
                                                type="text"
                                                value={settings[activeTab].padding || ''}
                                                onChange={(e) => handleChange('padding', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm"
                                                placeholder="z.B. 1em"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Hintergrundfarbe</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={settings[activeTab].backgroundColor || '#ffffff'}
                                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                                    className="h-9 w-9 p-1 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={settings[activeTab].backgroundColor || ''}
                                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                                    className="flex-1 p-2 border rounded-lg text-sm font-mono"
                                                    placeholder="transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Rahmen (links)</label>
                                            <input
                                                type="text"
                                                value={settings[activeTab].borderLeft || ''}
                                                onChange={(e) => handleChange('borderLeft', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm"
                                                placeholder="z.B. 4px solid red"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Live-Vorschau</h3>
                                    <div className="p-8 border border-gray-100 bg-white rounded-xl shadow-sm">
                                        <p className="mb-4 text-gray-300">Normaler Text davor...</p>
                                        <div style={settings[activeTab] as any}>
                                            Dies ist ein Beispiel für {formatLabels[activeTab]}.
                                            {activeTab === 'haiku' && <br />}
                                            {activeTab === 'haiku' && "Zweite Zeile hier,"}
                                            {activeTab === 'haiku' && <br />}
                                            {activeTab === 'haiku' && "Dritte Zeile endet das Gedicht."}
                                        </div>
                                        <p className="mt-4 text-gray-300">Normaler Text danach...</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                        Abbrechen
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                        <Save size={18} /> Speichern
                    </button>
                </div>
            </div>
        </div>
    );
}
