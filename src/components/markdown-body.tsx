"use client";

import ReactMarkdown from "react-markdown";

/** Renders a post's markdown body with the site's editorial type treatment
 * — isolated as its own client component so the article page around it can
 * stay a plain server component. */
export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="text-lg">
      <ReactMarkdown
        components={{
          p: (props) => <p className="mt-5 text-foreground" {...props} />,
          h2: (props) => <h2 className="mt-10 font-serif text-2xl text-foreground" {...props} />,
          h3: (props) => <h3 className="mt-8 font-serif text-xl text-foreground" {...props} />,
          a: (props) => (
            <a
              className="text-link underline hover:text-link-strong"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: (props) => (
            <ul className="mt-5 list-disc space-y-1.5 pl-5 text-foreground" {...props} />
          ),
          ol: (props) => (
            <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-foreground" {...props} />
          ),
          blockquote: (props) => (
            <blockquote
              className="mt-6 border-l-2 border-brand pl-4 text-xl text-foreground italic"
              {...props}
            />
          ),
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
