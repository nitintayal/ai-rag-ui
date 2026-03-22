import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

export default function ChatWindow() {

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"})
  },[messages, loading])

  return (

    <div className="flex flex-col flex-1">

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {messages.map((msg,i)=>(
          <Message key={i} role={msg.role} text={msg.text}/>
        ))}
        {/* 👇 Typing indicator */}
        {loading && (
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
          </div>
        )}

        <div ref={bottomRef}></div>

      </div>

      <InputBox
        messages={messages}
        setMessages={setMessages}
        loading={loading}
        setLoading={setLoading}
      />

    </div>

  );

}