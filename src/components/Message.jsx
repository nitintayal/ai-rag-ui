export default function Message({ role, text }) {

  return (

    <div
      className={`flex ${
        role === "user" ? "justify-end" : "justify-start"
      }`}
    >

      <div
        className={`px-4 py-3 rounded-xl max-w-xl ${
          role === "user"
            ? "bg-green-200"
            : "bg-white border"
        }`}
      >
        {text}
      </div>

    </div>

  );

}