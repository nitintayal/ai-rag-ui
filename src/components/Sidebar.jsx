import FileUpload from "./FileUpload";

export default function Sidebar() {

  return (

    <div className="w-64 bg-gray-900 text-white flex flex-col">

      <div className="p-4 border-b border-gray-700">

        <button className="w-full bg-gray-800 p-3 rounded-lg hover:bg-gray-700">
          + New Chat
        </button>
        <FileUpload />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        <div className="p-2 rounded hover:bg-gray-700 cursor-pointer">
          Employee Policy
        </div>

        <div className="p-2 rounded hover:bg-gray-700 cursor-pointer">
          Leave Rules
        </div>

      </div>

      <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
        AI RAG Agent
      </div>

    </div>

  );

}