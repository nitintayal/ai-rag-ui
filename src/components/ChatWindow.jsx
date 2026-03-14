import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

export default function ChatWindow() {

  const [messages, setMessages] = useState([]);

  const bottomRef = useRef(null);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"})
  },[messages])

  return (

    <div className="flex flex-col flex-1">

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {messages.map((msg,i)=>(
          <Message key={i} role={msg.role} text={msg.text}/>
        ))}

        <div ref={bottomRef}></div>

      </div>

      <InputBox
        messages={messages}
        setMessages={setMessages}
      />

    </div>

  );

}