import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Image, Smile, Mic, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpeechToText, getSpeechRecognitionErrorMessage } from '../../hooks/useSpeechToText';

const DEFAULT_EMOJIS = [
  '😀', '😊', '😂', '❤️', '👍', '🙏', '🌾', '👋', '😅', '🔥',
  '✅', '💬', '🎉', '🙂', '😎', '🤝', '💪', '🌱', '🍅', '🥕',
];

const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Chat input: expanding textarea, emoji picker, attach, reply preview, send when has content.
 * replyPreview: { _id, text, sender?: { name } } or null
 */
export function MessageInput({
  value,
  onChange,
  onSend,
  onAttach,
  onImageSelect,
  replyPreview,
  onDismissReply,
  placeholder = 'Message...',
  sendDisabled,
  sending,
  showEmojiPicker,
  onToggleEmojiPicker,
  onEmojiSelect,
  emojiList = DEFAULT_EMOJIS,
  maxFileBytes = MAX_FILE_BYTES,
  onFileTooLarge,
  imageInputRef,
  attachInputRef,
  inputRef,
  onKeyDown,
  onTyping,
}) {
  const textareaRef = useRef(null);

  const {
    transcript: voiceTranscript,
    listening: voiceListening,
    error: voiceError,
    isSupported: voiceSupported,
    startListening: voiceStart,
    stopListening: voiceStop,
    resetTranscript: voiceReset,
  } = useSpeechToText({ language: 'en-IN', continuous: false });

  const voiceWasListeningRef = useRef(false);
  useEffect(() => {
    if (voiceListening) {
      voiceWasListeningRef.current = true;
      return;
    }
    if (voiceWasListeningRef.current && voiceTranscript.trim()) {
      const newText = (value ? `${value} ${voiceTranscript.trim()}` : voiceTranscript.trim());
      onChange(newText);
      onTyping?.();
      voiceReset();
    }
    voiceWasListeningRef.current = false;
  }, [voiceListening, voiceTranscript, voiceReset, value, onChange, onTyping]);

  useEffect(() => {
    if (!voiceError) return;
    const msg = getSpeechRecognitionErrorMessage(voiceError);
    if (msg) toast.error(msg);
  }, [voiceError]);

  useEffect(() => {
    const ta = inputRef?.current || textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [value, inputRef]);

  const handleAttach = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > maxFileBytes) {
      onFileTooLarge?.();
      return;
    }
    if (file.type.startsWith('image/')) {
      onImageSelect?.(file);
    } else {
      onAttach?.(file);
    }
  };

  const handleEmoji = (emoji) => {
    onEmojiSelect?.(emoji);
  };

  const ref = inputRef || textareaRef;
  const hasContent = value.trim().length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex-shrink-0">
      {replyPreview && (
        <div className="flex items-center justify-between mb-2 pl-2 pr-1 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Replying to {replyPreview.sender?.name ?? 'message'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {replyPreview.text || '[Message]'}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismissReply}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 flex-shrink-0"
            aria-label="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 relative">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAttach}
        />
        <input
          ref={attachInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,video/*"
          className="hidden"
          onChange={handleAttach}
        />

        <button
          type="button"
          onClick={() => attachInputRef?.current?.click()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition flex-shrink-0 mb-0.5"
          title="Attach file (max 100MB)"
        >
          <Paperclip size={18} />
        </button>
        <button
          type="button"
          onClick={() => imageInputRef?.current?.click()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition flex-shrink-0 mb-0.5"
          title="Send photo"
        >
          <Image size={18} />
        </button>

        <div className="flex-1 relative min-w-0">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => { onChange(e.target.value); onTyping?.(); }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-600 resize-none transition leading-relaxed max-h-28 overflow-y-auto placeholder-gray-500 dark:placeholder-gray-400"
            style={{ minHeight: '42px' }}
          />
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-1 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-10 flex flex-wrap gap-1 max-w-[240px]">
              {emojiList.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                  onClick={() => handleEmoji(emo)}
                >
                  {emo}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleEmojiPicker?.()}
          className={`p-2 rounded-xl transition flex-shrink-0 mb-0.5 ${
            showEmojiPicker
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}
          title="Emoji"
        >
          <Smile size={18} />
        </button>

        {voiceSupported ? (
          <button
            type="button"
            onClick={() => (voiceListening ? voiceStop() : voiceStart())}
            className={`p-2 rounded-xl transition flex-shrink-0 mb-0.5 ${
              voiceListening
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
            title={voiceListening ? 'Stop listening' : 'Voice input'}
            aria-label={voiceListening ? 'Stop listening' : 'Voice input'}
          >
            <Mic size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition flex-shrink-0 mb-0.5 opacity-60"
            title="Voice input not supported in this browser"
          >
            <Mic size={18} />
          </button>
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={(!hasContent && !sending) || sendDisabled}
          className="p-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-40 transition flex-shrink-0 mb-0.5 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          title="Send"
        >
          {sending ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
