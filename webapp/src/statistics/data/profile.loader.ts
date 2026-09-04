import { loadProfile as loadProfileHttp, setProfilePhotoUrl as setProfilePhotoUrlHttp } from "../../api";
import type { Profile } from "../domain/profile.entity";

export function loadProfile(uid: string): Promise<Profile> {
    return loadProfileHttp(uid);
}

export function setPhotoUrl(photoUrl: string | null): Promise<Profile> {
    return setProfilePhotoUrlHttp(photoUrl);
}
