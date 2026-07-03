import ReactMarkdown from "react-markdown";

function cleanUrl(url) { return url.replace(/[),.;]+$/, ""); }

function formatSourceLabel(source, url) {
  if (source !== url) return source;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return source; }
}

function parseSource(source) {
  const mm = source.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
  if (mm) return { label: mm[1], url: cleanUrl(mm[2]) };
  const hm = source.match(/^(.*?)\s+-\s+(https?:\/\/\S+)$/i);
  if (hm) return { label: hm[1].trim(), url: cleanUrl(hm[2]) };
  const um = source.match(/https?:\/\/\S+/i);
  if (um) {
    const clean = cleanUrl(um[0]);
    const rawLabel = source.replace(um[0], "").trim() || clean;
    return { label: formatSourceLabel(rawLabel, clean), url: clean };
  }
  return { label: source, url: null };
}

export default function Message({ role, text, sources }) {
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar dot */}
      {!isUser && (
        <div className="mb-1 shrink-0 h-7 w-7 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
          <svg className="h-4 w-4 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} min-w-0 max-w-[88%] sm:max-w-[80%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 overflow-hidden ${
            isUser
              ? "rounded-br-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "rounded-bl-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          }`}
        >
          <div className="break-words overflow-x-auto text-sm leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-900 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:my-2 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h1]:font-bold [&_h1]:text-base [&_h2]:font-semibold [&_h2]:text-sm [&_h3]:font-semibold">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </div>

        {sources?.length > 0 && (
          <div className="px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source, i) => {
                const { label, url } = parseSource(source);
                return url ? (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.preventDefault(); window.open(url, "_blank", "noopener,noreferrer"); }}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95"
                  >
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {label}
                  </a>
                ) : (
                  <span key={i} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
