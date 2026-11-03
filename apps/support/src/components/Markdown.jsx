import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Raw HTML in markdown is not rendered (react-markdown's default), so CMS
// content can't inject markup or scripts.
const components = {
  a: ({ href, children }) => {
    const external = /^https?:\/\//.test(href ?? "");
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  },
};

export function Markdown({ children }) {
  return (
    <div className="kb-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
