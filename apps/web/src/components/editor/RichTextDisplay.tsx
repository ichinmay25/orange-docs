import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

interface RichTextDisplayProps {
  content: unknown;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  if (!content || typeof content !== 'object') return null;

  let html = '';
  try {
    html = generateHTML(content as object, [StarterKit]);
  } catch {
    return null;
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
