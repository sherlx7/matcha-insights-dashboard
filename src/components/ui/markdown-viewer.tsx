import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn(
      "prose prose-sm max-w-none dark:prose-invert",
      "prose-headings:text-foreground prose-headings:font-semibold",
      "prose-h1:text-xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4",
      "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3",
      "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2",
      "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2",
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4",
      "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4",
      "prose-li:text-muted-foreground prose-li:my-1",
      "prose-table:my-4 prose-table:w-full",
      "prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-foreground prose-th:border prose-th:border-border",
      "prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border prose-td:text-muted-foreground",
      "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
      "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
      "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
      "prose-hr:my-6 prose-hr:border-border",
      "prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80",
      className
    )}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom table styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border">
              <table className="w-full">{children}</table>
            </div>
          ),
          // Custom code block styling
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom list styling
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
          ),
          // Custom heading styling with better spacing
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-foreground mt-4 mb-2">{children}</h3>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className="text-muted-foreground leading-relaxed my-2">{children}</p>
          ),
          // Custom strong/bold styling
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r-lg">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
