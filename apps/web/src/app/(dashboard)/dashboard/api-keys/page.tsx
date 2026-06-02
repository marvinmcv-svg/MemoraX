'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Code, ExternalLink, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
}

const apiEndpoints = [
  {
    method: 'POST',
    path: '/api/v1/capture',
    description: 'Capture a new memory from any source',
    body: '{ channel, channelUserId, content, contentType, metadata }',
  },
  {
    method: 'GET',
    path: '/api/v1/memories',
    description: 'List all memories for a user',
    body: '?page=1&pageSize=50',
  },
  {
    method: 'POST',
    path: '/api/v1/memories/search',
    description: 'Search memories semantically',
    body: '{ query: "string" }',
  },
  {
    method: 'POST',
    path: '/api/v1/reminders',
    description: 'Create a reminder for a memory',
    body: '{ memoryId, remindAt, deliveryChannel }',
  },
  {
    method: 'GET',
    path: '/api/v1/kg/stats',
    description: 'Get knowledge graph statistics',
    body: null,
  },
  {
    method: 'GET',
    path: '/api/v1/serendipity/discover',
    description: 'Get serendipitous memory recommendations',
    body: null,
  },
];

const codeExamples = {
  curl: `curl -X POST https://api.memorax.ai/api/v1/capture \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Remember to call mom", "channel": "api"}'`,
  node: `const response = await fetch('https://api.memorax.ai/api/v1/memories', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`,
  python: `import requests

response = requests.get(
  'https://api.memorax.ai/api/v1/memories',
  headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`,
};

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.apiKeys.list();
      setApiKeys((data.data as ApiKey[]) || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreate = async () => {
    try {
      const result = await api.apiKeys.create({ name: newKeyName });
      setNewKey(result.key);
      setApiKeys(prev => [...prev, result]);
      setNewKeyName('');
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.apiKeys.revoke(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Key className="w-8 h-8 text-primary" />
          API Keys
        </h1>
        <p className="text-text-secondary">Manage API keys for the MemoraX public API</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'keys'
              ? 'bg-primary-500 text-white'
              : 'bg-surface border border-border text-text-secondary hover:border-primary-500/30'
          }`}
        >
          My Keys
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'docs'
              ? 'bg-primary-500 text-white'
              : 'bg-surface border border-border text-text-secondary hover:border-primary-500/30'
          }`}
        >
          Documentation
        </button>
      </div>

      {activeTab === 'keys' ? (
        <>
          {/* Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-text-primary font-medium">API Access</p>
                <p className="text-text-muted text-sm">Use API keys to integrate MemoraX into your applications</p>
              </div>
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Create Key
            </Button>
          </div>

          {/* API Keys List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-12 rounded-2xl border border-border bg-surface text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-text-secondary text-lg mb-2">No API keys yet</p>
              <p className="text-text-muted text-sm mb-6">Create your first API key to start integrating</p>
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey, i) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border border-border bg-surface"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-text-primary font-semibold mb-1">{apiKey.name}</h3>
                      <p className="text-xs text-text-muted font-mono">
                        Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        {apiKey.lastUsed && ` • Last used ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(apiKey.id)}
                      className="p-2 text-text-muted hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-background rounded-xl font-mono text-sm">
                    <code className="flex-1 text-text-secondary truncate">{apiKey.key}</code>
                    <button
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      {copiedId === apiKey.id ? (
                        <Check className="w-4 h-4 text-secondary-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Documentation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Base URL
              </h3>
              <div className="p-3 bg-background rounded-xl font-mono text-sm text-text-secondary">
                https://api.memorax.ai
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-surface">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Authentication</h3>
              <p className="text-text-secondary text-sm mb-3">
                Include your API key in the Authorization header:
              </p>
              <div className="p-3 bg-background rounded-xl font-mono text-sm text-text-secondary">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <h3 className="text-lg font-semibold text-text-primary mb-4">Endpoints</h3>
          <div className="space-y-3 mb-8">
            {apiEndpoints.map((endpoint, i) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-surface"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    endpoint.method === 'GET' ? 'bg-secondary-500/10 text-secondary-400' :
                    endpoint.method === 'POST' ? 'bg-primary-500/10 text-primary-400' :
                    'bg-accent-500/10 text-accent-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-text-primary font-mono">{endpoint.path}</code>
                </div>
                <p className="text-text-secondary text-sm mb-3">{endpoint.description}</p>
                {endpoint.body && (
                  <div className="p-3 bg-background rounded-xl font-mono text-xs text-text-muted">
                    {endpoint.body}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Code Examples */}
          <h3 className="text-lg font-semibold text-text-primary mb-4">Code Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(codeExamples).map(([lang, code]) => (
              <motion.div
                key={lang}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-border bg-surface"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-primary uppercase">{lang}</span>
                  <button
                    onClick={() => copyToClipboard(code, lang)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    {copiedId === lang ? (
                      <Check className="w-4 h-4 text-secondary-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                </div>
                <pre className="text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap">
                  {code}
                </pre>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowCreateModal(false); setNewKey(null); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-surface border border-border rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              {newKey ? 'API Key Created' : 'Create API Key'}
            </h3>

            {newKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl">
                  <p className="text-sm text-text-secondary mb-2">Your new API key:</p>
                  <div className="flex items-center gap-2 p-3 bg-background rounded-xl font-mono text-sm">
                    <code className="flex-1 text-text-primary truncate">{newKey}</code>
                    <button
                      onClick={() => copyToClipboard(newKey, 'new-key')}
                      className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      {copiedId === 'new-key' ? (
                        <Check className="w-4 h-4 text-secondary-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  Make sure to copy your API key now. You won't be able to see it again.
                </p>
                <Button fullWidth onClick={() => { setShowCreateModal(false); setNewKey(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My Application"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button fullWidth onClick={handleCreate} disabled={!newKeyName}>
                    Create
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}