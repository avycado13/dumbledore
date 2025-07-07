import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import type { UIMessage, ChatRequestOptions } from "ai";
import Image from "next/image";
import { Bot, User } from "lucide-react";

type Props = {
	messages: UIMessage[];
	input: string;
	handleInputChange: (
		event?: {
			preventDefault?: () => void;
		},
		chatRequestOptions?: ChatRequestOptions,
	) => void;
	handleSubmit: (
		event: React.FormEvent<HTMLFormElement>,
		chatRequestOptions?: ChatRequestOptions,
	) => void;
	setFiles: (files: FileList | undefined) => void;
	files: FileList | undefined;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
};

function ChatComponent({
	messages,
	input,
	handleInputChange,
	handleSubmit,
	setFiles,
	files,
	fileInputRef,
}: Props) {
	console.log(messages);
	return (
		<>
			<div className="flex flex-col h-full">
				<ScrollArea className="flex-1 p-4 space-y-4">
					{messages?.map((message) => (
						<div key={message.id} className="p-4">
							{message.role === "user" ? (
								<User className="inline w-4 h-4" />
							) : (
								<Bot className="inline w-4 h-4" />
							)}
							{message.parts.map((part, i) => {
								switch (part.type) {
									case "step-start":
										// show step boundaries as horizontal lines:
										return i > 0 ? (
											<div key={`${message.id}-${i}`} className="text-gray-500">
												<hr className="my-2 border-gray-300" />
											</div>
										) : null;
									case "text":
										return <div key={`${message.id}-${i}`}>{part.text}</div>;
									case "tool-invocation":
										if (part.toolInvocation.state === "result") {
											return (
												<pre key={`${message.id}-${i}`}>
													{JSON.stringify(part.toolInvocation, null, 2)}
												</pre>
											);
										}
										return (
											<div key={`${message.id}-${i}`}>
												<strong>Tool Invocation:</strong>{" "}
												{part.toolInvocation.toolName}
											</div>
										);
								}
							})}
							<div>
								{message?.experimental_attachments
									?.filter(
										(attachment) =>
											attachment?.contentType?.startsWith("image/") ||
											attachment?.contentType?.startsWith("application/pdf"),
									)
									.map((attachment, index) =>
										attachment.contentType?.startsWith("image/") ? (
											<Image
												key={`${message.id}-${index}`}
												src={attachment.url}
												width={500}
												height={500}
												alt={attachment.name ?? `attachment-${index}`}
											/>
										) : attachment.contentType?.startsWith(
												"application/pdf",
											) ? (
											<iframe
												key={`${message.id}-${index}`}
												src={attachment.url}
												width="500"
												height="600"
												title={attachment.name ?? `attachment-${index}`}
											/>
										) : null,
									)}
							</div>
						</div>
					))}
				</ScrollArea>

				<form
					onSubmit={(event) => {
						handleSubmit(event, {
							experimental_attachments: files,
						});

						setFiles(undefined);

						if (fileInputRef.current) {
							fileInputRef.current.value = "";
						}
					}}
					className="p-4 flex items-center space-x-2"
				>
					<input
						type="file"
						className="hidden"
						onChange={(event) => {
							if (event.target.files) {
								setFiles(event.target.files);
							}
						}}
						multiple
						ref={fileInputRef}
					/>
					<Button type="button" onClick={() => fileInputRef.current?.click()}>
						Attach Files
					</Button>
					<Input
						value={input}
						placeholder="Say something..."
						onChange={handleInputChange}
					/>
					<Button type="submit">Send</Button>
				</form>
			</div>
		</>
	);
}

export { ChatComponent };
