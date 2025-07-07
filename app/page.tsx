'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import Image from 'next/image';
import {ChatComponent} from '@/components/chat-component';
export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat(
    {
      maxSteps: 5,
    }
  );
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // return (
  //   <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
  //     {messages.map(message => (
  //       <div key={message.id} className="whitespace-pre-wrap">
  //         {message.role === 'user' ? 'User: ' : 'AI: '}
  //         {message.parts.map((part, i) => {
  //           switch (part.type) {
  //             case 'text':
  //               return <div key={`${message.id}-${i}`}>{part.text}</div>;
  //             case 'tool-invocation':
  //               return (
  //                 <pre key={`${message.id}-${i}`}>
  //                   {JSON.stringify(part.toolInvocation, null, 2)}
  //                 </pre>
  //               );
  //           }
  //         })}
  //         <div>
  //           {message?.experimental_attachments
  //             ?.filter(
  //               attachment =>
  //                 attachment?.contentType?.startsWith('image/') ||
  //                 attachment?.contentType?.startsWith('application/pdf'),
  //             )
  //             .map((attachment, index) =>
  //               attachment.contentType?.startsWith('image/') ? (
  //                 <Image
  //                   key={`${message.id}-${index}`}
  //                   src={attachment.url}
  //                   width={500}
  //                   height={500}
  //                   alt={attachment.name ?? `attachment-${index}`}
  //                 />
  //               ) : attachment.contentType?.startsWith('application/pdf') ? (
  //                 <iframe
  //                   key={`${message.id}-${index}`}
  //                   src={attachment.url}
  //                   width="500"
  //                   height="600"
  //                   title={attachment.name ?? `attachment-${index}`}
  //                 />
  //               ) : null,
  //             )}
  //         </div>
  //       </div>
  //     ))}

  //     <form onSubmit={event => {
  //         handleSubmit(event, { 
  //           experimental_attachments: files,
  //         });

  //         setFiles(undefined);

  //         if (fileInputRef.current) {
  //           fileInputRef.current.value = '';
  //         }
  //       }}>
  //         <input
  //         type="file"
  //         className=""
  //         onChange={event => {
  //           if (event.target.files) {
  //             setFiles(event.target.files);
  //           }
  //         }}
  //         multiple
  //         ref={fileInputRef}
  //       />
  //       <input
  //         className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
  //         value={input}
  //         placeholder="Say something..."
  //         onChange={handleInputChange}
  //       />
  //     </form>
  //   </div>
  // );
  return ChatComponent({
    messages,
    input,
    handleInputChange,
    handleSubmit,
    files,
    setFiles,
    fileInputRef,
  });
}