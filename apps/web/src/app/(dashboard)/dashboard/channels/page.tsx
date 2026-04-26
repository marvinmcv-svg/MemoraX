'use client';

import { Mic, CheckCircle, AlertCircle, ExternalLink, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const channels = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', connected: false, desc: 'Send messages to capture memories' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', connected: false, desc: 'DM @memorax_bot to capture' },
  { id: 'slack', name: 'Slack', icon: '⚡', connected: false, desc: 'Use /memorax slash command' },
  { id: 'sms', name: 'SMS', icon: '📱', connected: false, desc: 'Send texts to your dedicated number' },
  { id: 'email', name: 'Email', icon: '📧', connected: false, desc: 'Email capture@memorax.ai' },
];

export default function ChannelsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Mic className="w-8 h-8 text-primary" />
          Channels
        </h1>
        <p className="text-text-secondary">Connect your communication channels</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel, i) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{channel.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{channel.name}</h3>
                  <p className="text-sm text-text-muted">{channel.desc}</p>
                </div>
              </div>
              {channel.connected ? (
                <span className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Not connected
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                channel.connected
                  ? 'bg-background text-text-primary hover:bg-surface-hover'
                  : 'bg-primary text-white hover:bg-primary-glow'
              }`}
            >
              {channel.connected ? (
                <>
                  <span>Manage</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Connect</span>
                </>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}