import { router } from 'expo-router';

export const openAnnouncement = (id: string) => router.push({ pathname: '/announcement/[id]', params: { id } });
export const openEvent = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });
export const openOrg = (id: string) => router.push({ pathname: '/org/[id]', params: { id } });
