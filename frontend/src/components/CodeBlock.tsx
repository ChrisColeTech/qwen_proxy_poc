interface CodeBlockProps {
  title?: string;
  code: string;
  language?: string;
}

export function CodeBlock({ title, code, language }: CodeBlockProps) {
  return (
    <div className="code-block">
      {title && (
        <div className="code-block-title">
          {title}
        </div>
      )}
      <pre className="code-block-pre">
        <code className={`code-block-code ${language ? `language-${language}` : ''}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
