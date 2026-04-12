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
        className={`max-w-xl rounded-2xl px-4 py-3 ${
          role === "user"
            ? "bg-emerald-100 text-slate-900"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <ReactMarkdown>{text}</ReactMarkdown>

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
