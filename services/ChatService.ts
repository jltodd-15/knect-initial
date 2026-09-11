import { Conversation, Message, CalendarEvent } from '../types';
import { userStore } from '../utils/storage';

const CONVOS_KEY = 'knect_conversations';
const MSGS_KEY = 'knect_messages';

// Helper to get current user ID (mock)
const CURRENT_USER_ID = 'me';

const generateId = () => Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

export const ChatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const data = await userStore.getItem(CONVOS_KEY);
    const convos: Conversation[] = data ? JSON.parse(data) : [];
    // Deduplicate
    return Array.from(new Map(convos.map(c => [c.id, c])).values());
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const data = await userStore.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = data ? JSON.parse(data) : {};
    const msgs = allMessages[conversationId] || [];
    // Deduplicate
    return Array.from(new Map(msgs.map(m => [m.id, m])).values());
  },

  // Find a chat that matches the EXACT set of participants (excluding current user)
  findConversation: async (participantIds: string[]): Promise<Conversation | null> => {
    const convos = await ChatService.getConversations();
    // Filter out current user from the input list just in case
    const targetIds = participantIds.filter(id => id !== CURRENT_USER_ID).sort();

    return convos.find(c => {
      const cParticipants = c.participants.filter(id => id !== CURRENT_USER_ID).sort();
      return JSON.stringify(targetIds) === JSON.stringify(cParticipants);
    }) || null;
  },

  createConversation: async (participantIds: string[], title?: string, isGroup: boolean = false): Promise<Conversation> => {
    const convos = await ChatService.getConversations();

    // Ensure current user is in participants
    const allParticipants = Array.from(new Set([...participantIds, CURRENT_USER_ID]));

    const newConvo: Conversation = {
      id: generateId(),
      title: title || (isGroup ? 'New Group' : 'Chat'), // In real app, resolve names
      participants: allParticipants,
      lastMessage: 'Chat created',
      lastMessageTimestamp: Date.now(),
      isGroup: isGroup,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', // Default or first user avatar
      admins: [CURRENT_USER_ID]
    };

    convos.unshift(newConvo);
    await userStore.setItem(CONVOS_KEY, JSON.stringify(convos));
    return newConvo;
  },

  findOrCreateConversation: async (participantIds: string[], title?: string): Promise<Conversation> => {
    const existing = await ChatService.findConversation(participantIds);
    if (existing) return existing;

    // Determine if group based on participant count (excluding self)
    const others = participantIds.filter(id => id !== CURRENT_USER_ID);
    const isGroup = others.length > 1;

    return ChatService.createConversation(participantIds, title, isGroup);
  },

  updateConversationTitle: async (conversationId: string, newTitle: string): Promise<void> => {
    const convos = await ChatService.getConversations();
    const index = convos.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      convos[index].title = newTitle;
      await userStore.setItem(CONVOS_KEY, JSON.stringify(convos));
    }
  },

  updateMessageRSVP: async (conversationId: string, messageId: string, userId: string, status: 'going' | 'not_going'): Promise<Message | null> => {
    const allMessagesStr = await userStore.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = allMessagesStr ? JSON.parse(allMessagesStr) : {};
    const chatMsgs = allMessages[conversationId] || [];

    const msgIndex = chatMsgs.findIndex(m => m.id === messageId);
    if (msgIndex !== -1) {
      const msg = chatMsgs[msgIndex];
      if (msg.eventDetails) {
        const updatedRsvps = { ...msg.eventDetails.rsvps, [userId]: status };
        const updatedMsg = {
          ...msg,
          eventDetails: { ...msg.eventDetails, rsvps: updatedRsvps }
        };
        chatMsgs[msgIndex] = updatedMsg;
        allMessages[conversationId] = chatMsgs;
        await userStore.setItem(MSGS_KEY, JSON.stringify(allMessages));
        return updatedMsg;
      }
    }
    return null;
  },

  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    const allMessagesStr = await userStore.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = allMessagesStr ? JSON.parse(allMessagesStr) : {};
    const chatMsgs = allMessages[conversationId] || [];

    const newMsgs = chatMsgs.filter(m => m.id !== messageId);
    allMessages[conversationId] = newMsgs;
    await userStore.setItem(MSGS_KEY, JSON.stringify(allMessages));
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    // Remove messages first: if this write lands and the conversation write below
    // doesn't, the conversation stays visible and re-deletable. The reverse order
    // would orphan the message blob permanently on an interruption between the two.
    const allMessagesStr = await userStore.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = allMessagesStr ? JSON.parse(allMessagesStr) : {};
    delete allMessages[conversationId];
    await userStore.setItem(MSGS_KEY, JSON.stringify(allMessages));

    // Remove conversation
    const convos = await ChatService.getConversations();
    const newConvos = convos.filter(c => c.id !== conversationId);
    await userStore.setItem(CONVOS_KEY, JSON.stringify(newConvos));
  },

  sendMessage: async (conversationId: string, text: string, type: 'text' | 'event-proposal' = 'text', event?: CalendarEvent): Promise<Message> => {
    const allMessagesStr = await userStore.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = allMessagesStr ? JSON.parse(allMessagesStr) : {};

    const newMessage: Message = {
      id: generateId(),
      senderId: CURRENT_USER_ID,
      text,
      timestamp: Date.now(),
      type,
      eventId: event?.id,
      eventDetails: event ? {
        id: event.id,
        title: event.title,
        location: event.location,
        time: event.timestamp,
        endTime: event.endTime,
        color: event.color,
        proposerId: CURRENT_USER_ID,
        participants: event.participants,
        rsvps: event.participants.reduce((acc, id) => ({...acc, [id]: 'pending'}), {[CURRENT_USER_ID]: 'going'})
      } : undefined
    };

    // Update messages
    const chatMsgs = allMessages[conversationId] || [];
    allMessages[conversationId] = [...chatMsgs, newMessage];
    await userStore.setItem(MSGS_KEY, JSON.stringify(allMessages));

    // Update conversation last message
    const convos = await ChatService.getConversations();
    const convoIndex = convos.findIndex(c => c.id === conversationId);
    if (convoIndex >= 0) {
      convos[convoIndex].lastMessage = type === 'event-proposal' ? `📅 Event Proposed: ${event?.title}` : text;
      convos[convoIndex].lastMessageTimestamp = Date.now();
      // Move to top
      const updatedConvo = convos.splice(convoIndex, 1)[0];
      convos.unshift(updatedConvo);
      await userStore.setItem(CONVOS_KEY, JSON.stringify(convos));
    }

    return newMessage;
  }
};
