import { useState } from "react";

export default function FileUpload() {

  const [file, setFile] = useState(null);

  const uploadFile = async () => {

    if (!file) return;

    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".txt") && !file.name.endsWith(".xlsx")) {
    alert("Only PDF, TXT, and XLSX files supported");
    return;
    }

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData
    });

    alert("File uploaded successfully");

  };

  return (

    <div className="p-3">

      <input
        type="file"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <button
        onClick={uploadFile}
        className="ml-3 bg-black text-white px-3 py-1 rounded"
      >
        Upload
      </button>

    </div>

  );

}