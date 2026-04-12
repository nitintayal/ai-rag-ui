import { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    if (!file) return;

    if (
      !file.name.endsWith(".pdf") &&
      !file.name.endsWith(".txt") &&
      !file.name.endsWith(".xlsx")
    ) {
      alert("Only PDF, TXT, and XLSX files supported");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    alert("File uploaded successfully");
  };

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-900"
      />

      <button
        onClick={uploadFile}
        className="w-full rounded-xl bg-white px-3 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
      >
        Upload
      </button>
    </div>
  );
}
