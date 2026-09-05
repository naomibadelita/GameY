import { randomInt } from 'node:crypto';
import type { Experience } from './Experience';

export class ReplayBuffer {
    private readonly experiences: Experience[] = [];

    public constructor(private readonly capacity = 100_000) {}

    public add(experience: Experience): void {
        this.experiences.push(experience);
        if (this.experiences.length > this.capacity) {
            this.experiences.shift();
        }
    }

    public addMany(experiences: Experience[]): void {
        experiences.forEach((experience) => this.add(experience));
    }

    public sample(size: number): Experience[] {
        const result: Experience[] = [];
        const count = Math.min(Math.max(0, size), this.experiences.length);
        const available = [...this.experiences];

        for (let index = 0; index < count; index++) {
            result.push(available.splice(randomInt(available.length), 1)[0]);
        }

        return result;
    }

    public get size(): number {
        return this.experiences.length;
    }
}