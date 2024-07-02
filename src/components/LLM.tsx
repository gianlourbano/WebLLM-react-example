import {
    CreateMLCEngine,
    InitProgressCallback,
    InitProgressReport,
    MLCEngine,
    ChatCompletionRequestStreaming,
} from "@mlc-ai/web-llm";
import { useEffect, useState } from "react";

import { IconMessage, IconTrashAlt } from "./Icons";
import AutoScrollBox from "./AutoScrollBox";
import Spinner from "./Spinner";
import ProgressIndicator from "./ProgressIndicator";

const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
const SYSTEM_PROMPT = `You are a friendly chatbot who always responds in the style of a pirate. 
    Always be concise and do not digress.`;

export function LLM() {

    // state

    const [isGenerating, setIsGenerating] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [messages, setMessages] = useState([
        { role: "system", content: SYSTEM_PROMPT },
    ]);
    const [currentMessage, setCurrentMessage] = useState("");

    const [progress, setProgress] = useState<InitProgressReport>({
        progress: 0,
        timeElapsed: 0,
        text: "",
    });

    const [engine, setEngine] = useState<MLCEngine>();



    const initProgressCallback: InitProgressCallback = async (initProgress) => {
        console.log(initProgress);
        setProgress(initProgress);
    };

    const pushMessage = (role: string, content: string) => {
        setMessages((messages) => [...messages, { role, content }]);
    };

    const generateResponse = async () => {
        const input: ChatCompletionRequestStreaming = {
            messages: [
                //@ts-ignore
                ...messages,
                //@ts-ignore
                { role: "user", content: currentMessage },
            ],
            max_tokens: 200,
            stream: true,
            stream_options: {
                include_usage: true,
            },
        };
        pushMessage("user", currentMessage);
        const chunks = await engine?.chat.completions.create(input);

        let message = "";
        pushMessage("assistant", "");

        if (chunks) {
            for await (const chunk of chunks) {
                if (chunk.choices[0]?.finish_reason) {
                    if (chunk.choices[0].finish_reason !== "stop")
                        engine?.interruptGenerate();
                }

                if (chunk.choices[0]?.delta){
                    message += chunk.choices[0].delta?.content || "";
                    setMessages((messages) => {
                        const newMessages = [...messages];
                        newMessages[newMessages.length - 1].content = message;
                        return newMessages;
                    })
                }

                if (chunk.usage) {
                    console.log(chunk.usage);
                }
            }
        }

        setIsGenerating(false);
    }

    const onSubmit = async () => {
        setCurrentMessage("");
        setIsGenerating(true);

        await generateResponse();
    };

    const clearChat = () => {
        setMessages([{ role: "system", content: SYSTEM_PROMPT }]);

        engine?.resetChat();
    };

    useEffect(() => {
        (async () => {
            CreateMLCEngine(selectedModel, {
                initProgressCallback,
            })
                .then((e) => {
                    setIsModelLoading(false);
                    setEngine(e);
                })
                .catch((error) => {
                    setError(error.message);
                });
        })();

        return () => {
            engine?.unload();
        };
    }, []);

    return (
        <section className="bg-slate-700 p-2 rounded-xl">
            {error && <p>{error}</p>}
            <ProgressIndicator progress={progress} />
            <section>
                <h1 className="text-3xl font-bold">
                    {selectedModel.split("-")[0]}
                </h1>
                <p className="text-sm">AI Assistant</p>
            </section>

            <button
                onClick={clearChat}
                className="p-2 hover:bg-slate-600 rounded-xl hover:scale-110 transition-all"
            >
                <IconTrashAlt className="size-6" />
            </button>

            <AutoScrollBox
                className="h-96 flex flex-col w-96 p-2 gap-2 rounded-xl overflow-y-auto"
                items={messages}
            >
                {messages.map((message, index) => {
                    return (
                        <div
                            key={index + message.role}
                            className={`p-2 rounded-xl max-w-[80%] ${
                                message.role === "assistant"
                                    ? "self-start rounded-bl-none bg-slate-500"
                                    : "self-end rounded-br-none bg-blue-500"
                            }`}
                        >
                            <p className={`text-sm text-left text-wrap`}>
                                {message.content}
                            </p>
                        </div>
                    );
                })}
            </AutoScrollBox>
            <div className="flex gap-2 items-center">
                <textarea
                    className="w-full p-2 rounded-xl resize-none overflow-hidden break-words transition-all focus-within:outline-none focus:outline-none outline-none"
                    placeholder="Type your message here"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    wrap="soft"
                    rows={2}
                    key="chat-input"
                ></textarea>
                <button
                    className="p-2 hover:bg-slate-600 rounded-xl hover:scale-110 transition-all"
                    onClick={() => {
                        onSubmit();
                    }}
                    disabled={isModelLoading || isGenerating}
                >
                    {isGenerating ? (
                        <Spinner className="size-6" />
                    ) : (
                        <IconMessage className="size-6" />
                    )}
                </button>
            </div>
        </section>
    );
}
