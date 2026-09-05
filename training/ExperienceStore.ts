import { appendFile, readFile, writeFile } from 'node:fs/promises';
import type { Experience } from './Experience';

const experiencePath = new URL('./experiences.jsonl', import.meta.url);
export const MAX_EXPERIENCES = 100_000;

function experienceKey(experience: Experience): string {
    return [experience.board, experience.boardSize, experience.botColor,
        experience.move.row, experience.move.column, experience.nextBoard].join(':');
}

function compactExperiences(experiences: Experience[]): Experience[] {
    const unique = new Map<string, Experience>();
    experiences.forEach((experience) => unique.set(experienceKey(experience), experience));
    return [...unique.values()].slice(-MAX_EXPERIENCES);
}

export async function appendExperience(experience: Experience): Promise<void> {
    await appendFile(experiencePath, `${JSON.stringify(experience)}\n`, 'utf8');
}

export async function appendExperiences(experiences: Experience[]): Promise<void> {
    if (experiences.length === 0) {
        return;
    }

    await appendFile(
        experiencePath,
        experiences.map((experience) => JSON.stringify(experience)).join('\n') + '\n',
        'utf8',
    );
}

export async function writeExperiences(experiences: Experience[]): Promise<void> {
    const compacted = compactExperiences(experiences);
    await writeFile(
        experiencePath,
        compacted.map((experience) => JSON.stringify(experience)).join('\n') +
            (compacted.length > 0 ? '\n' : ''),
        'utf8',
    );
}

export async function loadExperiences(): Promise<Experience[]> {
    try {
        const contents = await readFile(experiencePath, 'utf8');
        const loaded = contents
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line) as Experience);
        return compactExperiences(loaded);
    } catch (error: unknown) {
        const code = error instanceof Error && 'code' in error
            ? (error as NodeJS.ErrnoException).code
            : undefined;
        if (code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}