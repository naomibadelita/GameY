import { loadProfile as loadProfileHttp } from "../../api";
import type { Profile } from "../domain/profile.entity";

export function loadProfile(uid: string): Promise<Profile> {
    return loadProfileHttp(uid);
}