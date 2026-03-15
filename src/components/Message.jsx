export default function Message({ role, text, sources }) {

  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>

      <div className={`px-4 py-3 rounded-xl max-w-xl ${
        role === "user" ? "bg-green-200" : "bg-white border"
      }`}>

        <div>{text}</div>

        {sources && (
          <div className="mt-3 text-xs text-gray-500">
            Sources:
            <ul>
              {sources.map((s,i)=>(
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

    </div>
  )
}