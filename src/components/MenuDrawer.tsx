import React, { useState } from 'react';
import type { Track, Scenario, DiscoveredTrack } from '../types';
import { TasteMap } from './TasteMap';
import { getGeminiKey, setGeminiKey, generateCustomScenario, discoverMatchingTracks } from '../services/gemini';
import { Sparkles, Plus, FolderSync, Settings, Music, MapPin, Eye, ExternalLink } from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  scenarios: Scenario[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  onAddCustomScenario: (sc: Scenario) => void;
  onDiscoverAddTrack: (discTrack: DiscoveredTrack) => void;
  onScanLocalMusic: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  scenarios,
  currentTrack,
  onSelectTrack,
  onAddCustomScenario,
  onDiscoverAddTrack,
  onScanLocalMusic,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'scenarios' | 'discovery' | 'taste' | 'settings'>('library');
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiKey());
  const [savedKeyMsg, setSavedKeyMsg] = useState(false);

  // New Scenario Modal state
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [scenarioError, setScenarioError] = useState('');

  // AI Discovery state
  const [selectedScenarioForDisc, setSelectedScenarioForDisc] = useState(scenarios[0]?.name || '');
  const [discoveredList, setDiscoveredList] = useState<DiscoveredTrack[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discError, setDiscError] = useState('');

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    setGeminiKey(apiKeyInput);
    setSavedKeyMsg(true);
    setTimeout(() => setSavedKeyMsg(false), 2500);
  };

  const handleCreateScenario = async () => {
    if (!newScenarioDesc.trim()) return;
    setIsGeneratingScenario(true);
    setScenarioError('');
    try {
      const generated = await generateCustomScenario(newScenarioDesc);
      const newSc: Scenario = {
        id: `sc_${Date.now()}`,
        name: generated.name,
        description: generated.description,
        icon: generated.icon || 'Sparkles',
        color: generated.color || '#6366f1',
        centroid: [Number(generated.valence) || 0.5, Number(generated.energy) || 0.5],
        count: 0,
      };
      onAddCustomScenario(newSc);
      setNewScenarioDesc('');
      alert(`Scenario "${newSc.name}" created!`);
    } catch (err: any) {
      setScenarioError(err.message || 'Failed to create scenario');
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const handleDiscover = async () => {
    const sc = scenarios.find((s) => s.name === selectedScenarioForDisc) || scenarios[0];
    if (!sc) return;
    setIsDiscovering(true);
    setDiscError('');
    try {
      const results = await discoverMatchingTracks(sc.name, sc.centroid);
      setDiscoveredList(results);
    } catch (err: any) {
      setDiscError(err.message || 'Discovery failed');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-[#10131c] border-l border-white/10 flex flex-col text-white shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/30">
          <h2 className="font-semibold text-base tracking-wide text-neutral-200">MoodPulse Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-black/20 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 px-2 text-center font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'library' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Library ({tracks.length})
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex-1 py-3 px-2 text-center font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'scenarios' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Scenarios
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`flex-1 py-3 px-2 text-center font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'discovery' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            AI Discovery
          </button>
          <button
            onClick={() => setActiveTab('taste')}
            className={`flex-1 py-3 px-2 text-center font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'taste' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            2D Map
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-2 text-center font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'settings' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Library Tab */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">All Scanned Tracks</span>
                <button
                  onClick={onScanLocalMusic}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-600/50 transition-colors"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  Scan Music Folder
                </button>
              </div>

              {tracks.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  <p>No tracks added yet.</p>
                  <p className="text-xs mt-1 text-neutral-600">Scan your phone's music folder or files.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((t) => {
                    const isSelected = currentTrack?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTrack(t);
                          onClose();
                        }}
                        className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40'
                            : 'bg-white/5 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {t.coverUrl ? (
                            <img src={t.coverUrl} alt="Art" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-neutral-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-300' : 'text-neutral-200'}`}>
                            {t.title}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">{t.artist}</p>
                        </div>
                        {t.scenario && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                            {t.scenario}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Create AI Scenario
                </span>
                <p className="text-xs text-neutral-400">
                  Describe any situation (e.g., "Rainy Sunday reading sci-fi with hot tea")
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newScenarioDesc}
                    onChange={(e) => setNewScenarioDesc(e.target.value)}
                    placeholder="Enter scenario description..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleCreateScenario}
                    disabled={isGeneratingScenario || !newScenarioDesc.trim()}
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isGeneratingScenario ? '...' : 'Create'}
                  </button>
                </div>
                {scenarioError && <p className="text-[11px] text-red-400">{scenarioError}</p>}
              </div>

              <div className="space-y-2">
                <span className="text-xs text-neutral-400">All Scenarios ({scenarios.length})</span>
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-white">{sc.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        V: {sc.centroid[0].toFixed(2)} | E: {sc.centroid[1].toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{sc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Discovery Tab */}
          {activeTab === 'discovery' && (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Music Discovery Engine
                </span>
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedScenarioForDisc}
                    onChange={(e) => setSelectedScenarioForDisc(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.name} className="bg-neutral-900 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleDiscover}
                    disabled={isDiscovering}
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isDiscovering ? 'Discovering...' : 'Find Tracks'}
                  </button>
                </div>
                {discError && <p className="text-[11px] text-red-400">{discError}</p>}
              </div>

              {discoveredList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-neutral-400">Discovered Recommendations</span>
                  {discoveredList.map((dt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-white">{dt.title}</p>
                          <p className="text-xs text-neutral-400">{dt.artist}</p>
                        </div>
                        <button
                          onClick={() => onDiscoverAddTrack(dt)}
                          className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 rounded text-[11px] font-semibold hover:bg-indigo-600/50"
                        >
                          + Add to Library
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-400 italic">"{dt.reason}"</p>
                      <div className="flex gap-2 pt-1 text-[11px] text-neutral-400">
                        <a
                          href={`https://open.spotify.com/search/${encodeURIComponent(dt.title + ' ' + dt.artist)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          Spotify <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dt.title + ' ' + dt.artist)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-red-400 hover:underline"
                        >
                          YouTube <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2D Taste Map Tab */}
          {activeTab === 'taste' && (
            <TasteMap scenarios={scenarios} tracks={tracks} currentTrack={currentTrack} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <span className="text-sm font-semibold text-white">Gemini API Key</span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your Gemini API key enables custom scenario generation, psychoacoustic vector estimation, and AI track discovery. It is stored exclusively on your device.
                </p>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="w-full py-2 bg-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-500 active:scale-98 transition-all"
                  >
                    Save API Key
                  </button>
                  {savedKeyMsg && <p className="text-xs text-emerald-400 text-center">API Key saved successfully!</p>}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2 text-xs text-neutral-400 leading-relaxed">
                <p className="font-semibold text-neutral-300">Background Audio & Lockscreen</p>
                <p>
                  Background playback is natively supported via MediaSession API. When you lock your phone or switch apps, playback continues and lockscreen controls will remain active.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
