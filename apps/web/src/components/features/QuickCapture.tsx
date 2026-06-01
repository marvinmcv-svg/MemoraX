'use client';

import { useState, useCallback } from 'react';
import { Send, Mic, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface QuickCaptureProps {
  onSuccess?: () => void;
}

export function QuickCapture({ onSuccess }: QuickCaptureProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.memories.create({ content });
      setContent('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      addToast('success', 'Memory captured successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create memory:', error);
      addToast('error', 'Failed to capture memory. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, onSuccess, addToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="relative group">
      {/* Gradient background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/10 via-surface to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6 rounded-2xl border border-border bg-surface">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Quick Capture</h2>
            <p className="text-sm text-text-muted">Add a memory instantly</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? Try: 'Remind me to call mom tomorrow at 3pm' or 'Note: Project ideas for next week'"
            className="w-full h-32 p-4 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
          />

          {/* Recording indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 right-4 flex items-center gap-3 px-4 py-2 bg-background rounded-xl border border-border"
              >
                <div className="flex gap-0.5 items-end h-5">
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
                      className="w-0.5 h-5 bg-primary-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-sm text-text-primary font-medium">Recording...</span>
                <button
                  onClick={() => setIsRecording(false)}
                  className="p-1 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
              className={isRecording ? 'bg-destructive-500/20 text-destructive-400' : ''}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted hidden sm:block">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-text-secondary">⌘</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-text-secondary">Enter</kbd>
              {' to save'}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              loading={submitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Capture
            </Button>
          </div>
        </div>

        {/* Success message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-secondary-500/20 text-secondary-400 rounded-full text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              <span>Memory captured!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
