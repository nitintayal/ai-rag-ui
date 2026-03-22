import ReactMarkdown from "react-markdown";
export default function Message({ role, text, sources }) {

  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>

      <div className={`px-4 py-3 rounded-xl max-w-xl ${
        role === "user" ? "bg-green-200" : "bg-white border"
      }`}>

        <ReactMarkdown>{text}</ReactMarkdown>

        {sources && (
          <div className="mt-3 text-xs text-gray-500">
            Sources:
            <ul>
              {sources.map((s,i)=>(
                <span key={i} className="px-2 py-1 bg-gray-200 rounded mr-2">
                  {s}
                </span>
              ))}
            </ul>
          </div>
        )}

      </div>

    </div>
  )
}