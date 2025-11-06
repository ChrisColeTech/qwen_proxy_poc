import type { ReactNode } from 'react';

interface CodeBlockProps {
  children: ReactNode;
  language?: string;
  title?: string;
}

export function CodeBlock({ children, language, title }: CodeBlockProps) {
  return (
    <div className="code-block">
      {title && <div className="code-block-title">{title}</div>}
      <pre className="code-block-pre">
        <code className={`code-block-code ${language ? `language-${language}` : ''}`}>
          {children}
        </code>
      </pre>
    </div>
  );
}
