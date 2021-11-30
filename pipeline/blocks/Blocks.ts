import { Report } from "@pipeline/Analyzer";
import { process } from "./MessagesPerCycle";

export type BlockState = "no-data" | "ready" | "stale" | "loading" | "error";

export interface BlockData {}

export type BlockKey = string;

export type BlockProcessFn<T extends BlockData> = (source: Report) => T;

const blocks: {
    [key: BlockKey]: BlockProcessFn<any>;
} = {
    MessagesPerCycleBlock: process,
};

console.log(blocks);

// uberfile?