import { Conversation, Message, CalendarEvent } from '../types';
import { localStorage} from '../utils/storage';

const CONVOS_KEY = 'knect_conversations';
const MSGS_KEY = 'knect_messages';

// Helper to get current user ID (mock)
const CURRENT_USER_ID = 'me';

const generateId = () => Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

export const ChatService = {
  getConversations: (): Conversation[] => {
    const data = localStorage.getItem(CONVOS_KEY);
    const convos: Conversation[] = data ? JSON.parse(data) : [];
    // Deduplicate
    return Array.from(new Map(convos.map(c => [c.id, c])).values());
  },

  getMessages: (conversationId: string): Message[] => {
    const data = localStorage.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = data ? JSON.parse(data) : {};
    const msgs = allMessages[conversationId] || [];
    // Deduplicate
    return Array.from(new Map(msgs.map(m => [m.id, m])).values());
  },

  // Find a chat that matches the EXACT set of participants (excluding current user)
  findConversation: (participantIds: string[]): Conversation | null => {
    const convos = ChatService.getConversations();
    // Filter out current user from the input list just in case
    const targetIds = participantIds.filter(id => id !== CURRENT_USER_ID).sort();

    return convos.find(c => {
      const cParticipants = c.participants.filter(id => id !== CURRENT_USER_ID).sort();
      return JSON.stringify(targetIds) === JSON.stringify(cParticipants);
    }) || null;
  },

  createConversation: (participantIds: string[], title?: string, isGroup: boolean = false): Conversation => {
    const convos = ChatService.getConversations();
    
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
    localStorage.setItem(CONVOS_KEY, JSON.stringify(convos));
    return newConvo;
  },

  findOrCreateConversation: (participantIds: string[], title?: string): Conversation => {
    const existing = ChatService.findConversation(participantIds);
    if (existing) return existing;
    
    // Determine if group based on participant count (excluding self)
    const others = participantIds.filter(id => id !== CURRENT_USER_ID);
    const isGroup = others.length > 1;
    
    return ChatService.createConversation(participantIds, title, isGroup);
  },

  updateConversationTitle: (conversationId: string, newTitle: string): void => {
    const convos = ChatService.getConversations();
    const index = convos.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      convos[index].title = newTitle;
      localStorage.setItem(CONVOS_KEY, JSON.stringify(convos));
    }
  },

  updateMessageRSVP: (conversationId: string, messageId: string, userId: string, status: 'going' | 'not_going'): Message | null => {
    const allMessagesStr = localStorage.getItem(MSGS_KEY);
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
        localStorage.setItem(MSGS_KEY, JSON.stringify(allMessages));
        return updatedMsg;
      }
    }
    return null;
  },

  deleteMessage: (conversationId: string, messageId: string): void => {
    const allMessagesStr = localStorage.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = allMessagesStr ? JSON.parse(allMessagesStr) : {};
    const chatMsgs = allMessages[conversationId] || [];
    
    const newMsgs = chatMsgs.filter(m => m.id !== messageId);
    allMessages[conversationId] = newMsgs;
    localStorage.setItem(MSGS_KEY, JSON.stringify(allMessages));
  },

  deleteConversation: (conversationId: string): void => {
    // Remove conversation
    const convos = ChatService.getConversations();
    const newConvos = convos.filter(c => c.id !== conversationId);
    localStorage.setItem(CONVOS_KEY, JSON.stringify(newConvos));

    // Remove messages
    const allMessagesStr = localStorage.getItem(MSGS_KEY);
    const allMessages: Record<string, Message[]> = allMessagesStr ? JSON.parse(allMessagesStr) : {};
    delete allMessages[conversationId];
    localStorage.setItem(MSGS_KEY, JSON.stringify(allMessages));
  },

  sendMessage: (conversationId: string, text: string, type: 'text' | 'event-proposal' = 'text', event?: CalendarEvent): Message => {
    const allMessagesStr = localStorage.getItem(MSGS_KEY);
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
    localStorage.setItem(MSGS_KEY, JSON.stringify(allMessages));

    // Update conversation last message
    const convos = ChatService.getConversations();
    const convoIndex = convos.findIndex(c => c.id === conversationId);
    if (convoIndex >= 0) {
      convos[convoIndex].lastMessage = type === 'event-proposal' ? `📅 Event Proposed: ${event?.title}` : text;
      convos[convoIndex].lastMessageTimestamp = Date.now();
      // Move to top
      const updatedConvo = convos.splice(convoIndex, 1)[0];
      convos.unshift(updatedConvo);
      localStorage.setItem(CONVOS_KEY, JSON.stringify(convos));
    }

    return newMessage;
  }
};
