import type { Profile } from "../domain/profile.entity";

export function loadProfile(uid: string): Promise<Profile> {
    return Promise.resolve({
        photoUrl: undefined,
        displayName: 'Old Peleus | '+uid,
    });
}