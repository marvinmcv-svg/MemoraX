'use client';

import { useState, useCallback } from 'react';
import { Send, Mic, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface QuickCaptureProps {
  onSuccess?: () => void;
}

export function QuickCapture({ onSuccess }: QuickCaptureProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.memories.create({ content });
      setContent('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, onSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      <div className="flex items-center gap-3 mb-4 relative">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-text-primary">Quick Capture</h2>
          <p className="text-sm text-text-muted">Add a memory instantly</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? Try: 'Remind me to call mom tomorrow at 3pm' or 'Note: Project ideas for next week'"
          className="w-full h-32 p-4 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />

        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <motion.button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white glow-primary'
                : 'bg-background text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Mic className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="p-2.5 bg-primary text-white hover:bg-primary-glow rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-background rounded-xl border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-end h-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scaleY: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="w-1 h-8 bg-primary rounded-full"
                />
              ))}
            </div>
            <div className="flex-1">
              <p className="text-text-primary text-sm font-medium">Recording in progress</p>
              <p className="text-text-muted text-xs">Tap mic to stop</p>
            </div>
            <button
              onClick={() => setIsRecording(false)}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showSuccess ? 1 : 0, y: showSuccess ? 0 : 10 }}
        className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 text-secondary text-sm font-medium"
      >
        <Sparkles className="w-4 h-4" />
        <span>Memory captured!</span>
      </motion.div>

      <p className="mt-3 text-xs text-text-muted text-right">
        Press <kbd className="px-1.5 py-0.5 bg-background rounded text-text-secondary">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-background rounded text-text-secondary">Enter</kbd> to save
      </p>
    </div>
  );
}