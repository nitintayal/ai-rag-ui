import ReactMarkdown from "react-markdown";

function cleanUrl(url) {
  return url.replace(/[),.;]+$/, "");
}

function formatSourceLabel(source, url) {
  if (source !== url) {
    return source;
  }

  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return source;
  }
}

function parseSource(source) {
  const markdownMatch = source.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
  if (markdownMatch) {
    return { label: markdownMatch[1], url: cleanUrl(markdownMatch[2]) };
  }

  const hyphenMatch = source.match(/^(.*?)\s+-\s+(https?:\/\/\S+)$/i);
  if (hyphenMatch) {
    return { label: hyphenMatch[1].trim(), url: cleanUrl(hyphenMatch[2]) };
  }

  const urlMatch = source.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    const clean = cleanUrl(urlMatch[0]);
    const rawLabel = source.replace(urlMatch[0], "").trim() || clean;

    return {
      label: formatSourceLabel(rawLabel, clean),
      url: clean,
    };
  }

  return { label: source, url: null };
}

export default function Message({ role, text, sources }) {
  const openSource = (event, url) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-4 py-3 overflow-hidden ${
          role === "user"
            ? "max-w-[85%] bg-emerald-100 dark:bg-emerald-900/40 text-slate-900 dark:text-emerald-100"
            : "max-w-full w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        }`}
      >
        <div className="break-words overflow-x-auto text-sm leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:text-xs [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>

        {sources && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sources
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {sources.map((source, i) => {
                const { label, url } = parseSource(source);

                return (
                  <li key={i} className="list-none">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => openSource(event, url)}
                        className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-300 hover:text-slate-900"
                        title={url}
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
                        {label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
