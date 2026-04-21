'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Mail, Hash, Phone, Settings, CheckCircle, XCircle } from 'lucide-react';

const channels = [
  { id: '1', type: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, connected: true, color: '#25D366' },
  { id: '2', type: 'telegram', name: 'Telegram', icon: Send, connected: false, color: '#0088cc' },
  { id: '3', type: 'slack', name: 'Slack', icon: Hash, connected: false, color: '#4A154B' },
  { id: '4', type: 'sms', name: 'SMS', icon: Phone, connected: false, color: '#64748B' },
  { id: '5', type: 'email', name: 'Email', icon: Mail, connected: false, color: '#EA4335' },
];

export default function ChannelsPage() {
  const [channelList, setChannelList] = useState(channels);

  const toggleChannel = (id: string) => {
    setChannelList(channelList.map(c =>
      c.id === id ? { ...c, connected: !c.connected } : c
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Channels</h1>
        <p className="text-text-secondary mt-1">Connect your messaging channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channelList.map(channel => {
          const Icon = channel.icon;
          return (
            <div key={channel.id} className="p-5 bg-surface rounded-xl border border-border">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${channel.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: channel.color }} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  channel.connected ? 'bg-secondary/10 text-secondary' : 'bg-surface-hover text-text-muted'
                }`}>
                  {channel.connected ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>Not connected</span>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{channel.name}</h3>
              <p className="text-sm text-text-muted mb-4">
                {channel.connected
                  ? 'Receive memories via this channel'
                  : 'Connect to capture memories automatically'}
              </p>
              <button
                onClick={() => toggleChannel(channel.id)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  channel.connected
                    ? 'bg-surface-hover text-text-secondary hover:text-text-primary'
                    : 'bg-primary text-white hover:bg-primary-glow'
                }`}
              >
                {channel.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}