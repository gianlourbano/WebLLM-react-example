import { useRef } from "react";
import { InitProgressReport } from "@mlc-ai/web-llm";

export default function ProgressIndicator(props: { progress: InitProgressReport }) {
    const { progress } = props;

    const isCached = useRef(false);
    const currentCacheProgress = useRef(0);
    if (progress.text.includes("cache")) {
        isCached.current = true;
        // current cache progress in the text in the form [number/number]
        const prg = progress.text.match(/\[[0-9]+\/[0-9]+\]/g);

        if (prg) {
            const [current, total] = prg[0].slice(1, -1).split("/");
            currentCacheProgress.current = parseInt(current) / parseInt(total);
            progress.progress = currentCacheProgress.current;
        }
    }

    const barStyle = {
        width: `${progress.progress * 100}%`,
        transition: "width 0.5s ease-in-out",
    };

    return (
        <div className="w-96">
            <div className="w-full h-1 bg-slate-500 rounded-xl">
                <div
                    className="h-full bg-blue-500 rounded-xl"
                    style={barStyle}
                ></div>
            </div>
            <div>
                <p className="text-xs text-center">{progress.text}</p>
            </div>
        </div>
    );
}