export default null as any;

import { Platform, StepInfo } from "@pipeline/Types";
import { Parser } from "@pipeline/parse/Parser";
import { DiscordParser } from "@pipeline/parse/DiscordParser";
import { WhatsAppParser } from "@pipeline/parse/WhatsAppParser";
import { TelegramParser } from "@pipeline/parse/TelegramParser";

export interface InitMessage {
    platform: Platform;
    files: File[];
}

export interface ReportResult {
    type: "result";
    blob: Blob;
    time: number;
    title: string;
    counts: {
        authors: number;
        channels: number;
        messages: number;
    };
}

async function* run(msg: InitMessage): AsyncGenerator<StepInfo | ReportResult> {
    //
    // 1. Parse files
    //
    // Create parser
    let parser: Parser | null;
    switch (msg.platform) {
        case "discord":
            parser = new DiscordParser();
            break;
        case "whatsapp":
            parser = new WhatsAppParser();
            break;
        case "telegram":
            parser = new TelegramParser();
            break;
        default:
            throw new Error(`Unknown platform: ${msg.platform}`);
    }
    // Read files and parse
    yield { type: "new", title: "Read and parse files", total: msg.files.length };
    for (let i = 0; i < msg.files.length; i++) {
        const content = await msg.files[i].text();
        try {
            parser.parse(content);
        } catch (ex) {
            throw new Error(`Error parsing file "${msg.files[i].name}":\n${(ex as Error).message}`);
        }
        yield { type: "progress", progress: i + 1 };
    }
    yield { type: "done" };

    const database = parser.database;
    parser = null;

    //
    // 2. Preprocess database
    //
    console.log(database);

    // TEMPORAL
    // GENERATE RANDOM STUFF
    for (let j = 0; j < 15; j++) {
        const total = Math.floor(Math.random() * 50);
        yield { type: "new", title: "thing " + j, total };
        for (let i = 0; i < total; i++) {
            yield { type: "progress", progress: i + 1 };
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 70));
        }
        yield { type: "done" };
    }

    const blob = new Blob(["Aqui pondria un reporte si lo hubiera generado"], { type: "text/html" });

    yield {
        type: "result",
        blob,
        time: Date.now(),
        title: database.title,
        counts: {
            authors: database.authors.size,
            channels: database.channels.size,
            messages: Object.values(database.messages).reduce((acc, val) => acc + val.length, 0),
        },
    };
}

self.onmessage = async (ev: MessageEvent<InitMessage>) => {
    try {
        const gen = run(ev.data);
        for await (const packet of gen) {
            self.postMessage(packet);
        }
    } catch (ex) {
        // handle exceptions
        if (ex instanceof Error) {
            self.postMessage({ type: "error", error: ex.message });
        } else {
            self.postMessage({ type: "error", error: ex + "" });
        }
        console.log("Error ahead ↓");
        console.error(ex);
    }
};

console.log("WorkerApp started");