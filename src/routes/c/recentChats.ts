export type HistoryChunk = {question: string, response: string, hidden: boolean};
export type SerialisedHistory = {id: string, title: string, created_at: number, body: string, updated_at: number};

export const RECENT_CHATS_KEY = 'chat.recent.v1';
export const RECENT_CHAT_TTL = 7 * 24 * 60 * 60 * 1000;

export function parseHistory(body: string): HistoryChunk[] {
    const value: unknown = JSON.parse(body);
    if (!Array.isArray(value) || !value.every(chunk => chunk &&
        typeof chunk.question === 'string' && typeof chunk.response === 'string' &&
        typeof chunk.hidden === 'boolean')) {
        throw new Error('Invalid conversation');
    }
    return value;
}

export function readRecentChats(storage: Storage, now = Date.now()): SerialisedHistory[] {
    const value: unknown = JSON.parse(storage.getItem(RECENT_CHATS_KEY) || '[]');
    if (!Array.isArray(value)) throw new Error('Invalid recent history');
    return value.filter((chat): chat is SerialisedHistory => {
        if (!chat || typeof chat.id !== 'string' || typeof chat.title !== 'string' ||
            typeof chat.created_at !== 'number' || typeof chat.updated_at !== 'number' ||
            typeof chat.body !== 'string' || chat.updated_at <= now - RECENT_CHAT_TTL) return false;
        try { parseHistory(chat.body); return true; } catch { return false; }
    }).sort((a, b) => b.updated_at - a.updated_at);
}

export function writeRecentChats(storage: Storage, chats: SerialisedHistory[], now = Date.now()) {
    storage.setItem(RECENT_CHATS_KEY, JSON.stringify(chats.filter(chat => chat.updated_at > now - RECENT_CHAT_TTL)));
}
