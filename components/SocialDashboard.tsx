import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Conversation, Message } from '../types';

interface Props { isDarkMode: boolean; }

const SocialDashboard: React.FC<Props> = ({ isDarkMode }) => {
  const styles = getStyles(isDarkMode);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');

  // Mock Data
  const convos: Conversation[] = [
      { id: '1', title: 'Sarah', participants: ['sarah'], lastMessage: 'See you there!', isGroup: false, image: 'https://picsum.photos/100' },
      { id: '2', title: 'Hiking Group', participants: ['sarah', 'mike'], lastMessage: 'Mike: 9am works.', isGroup: true, image: 'https://picsum.photos/101' },
  ];

  const messages: Message[] = [
      { id: '1', senderId: 'sarah', text: 'Hey! Are we still on?', timestamp: new Date() },
      { id: '2', senderId: 'me', text: 'Yes, heading out now.', timestamp: new Date() },
  ];

  if (selectedConvo) {
      return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
              <View style={styles.chatHeader}>
                  <TouchableOpacity onPress={() => setSelectedConvo(null)} style={styles.backButton}>
                      <Text style={styles.backText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.chatTitle}>{selectedConvo.title}</Text>
              </View>
              
              <FlatList
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                    <View style={[styles.msgBubble, item.senderId === 'me' ? styles.msgMe : styles.msgOther]}>
                        <Text style={[styles.msgText, item.senderId === 'me' && styles.msgTextMe]}>{item.text}</Text>
                    </View>
                )}
              />

              <View style={styles.inputArea}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Message..." 
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText} 
                  />
                  <TouchableOpacity style={styles.sendButton}>
                      <Text style={styles.sendText}>→</Text>
                  </TouchableOpacity>
              </View>
          </KeyboardAvoidingView>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Circle</Text>
        <Text style={styles.headerSubtitle}>INBOX</Text>
      </View>

      <FlatList 
        data={convos}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.convoItem} onPress={() => setSelectedConvo(item)}>
                <Image source={{ uri: item.image }} style={styles.avatar} />
                <View style={styles.convoInfo}>
                    <Text style={styles.convoTitle}>{item.title}</Text>
                    <Text style={styles.convoLast}>{item.lastMessage}</Text>
                </View>
            </TouchableOpacity>
        )}
      />
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { padding: 24, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#10b981' },
  headerSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#71717a', letterSpacing: 1, marginTop: 4 },
  convoItem: { flexDirection: 'row', padding: 16, backgroundColor: isDark ? '#1E1E1E' : 'white', marginBottom: 12, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  convoInfo: { marginLeft: 16, flex: 1 },
  convoTitle: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : '#18181b' },
  convoLast: { fontSize: 13, color: isDark ? '#888' : '#666', marginTop: 2 },
  
  // Chat View
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDark ? '#222' : '#f0f0f0', backgroundColor: isDark ? '#1E1E1E' : 'white' },
  backButton: { marginRight: 16 },
  backText: { fontSize: 24, color: '#10b981' },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: isDark ? 'white' : 'black' },
  msgBubble: { padding: 12, borderRadius: 20, marginBottom: 10, maxWidth: '80%' },
  msgMe: { alignSelf: 'flex-end', backgroundColor: '#10b981', borderBottomRightRadius: 4 },
  msgOther: { alignSelf: 'flex-start', backgroundColor: isDark ? '#1E1E1E' : '#f4f4f5', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: isDark ? 'white' : 'black' },
  msgTextMe: { color: 'white' },
  inputArea: { flexDirection: 'row', padding: 16, backgroundColor: isDark ? '#1E1E1E' : 'white', alignItems: 'center', paddingBottom: 40 }, // Safe Area
  input: { flex: 1, height: 44, backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderRadius: 22, paddingHorizontal: 16, color: isDark ? 'white' : 'black' },
  sendButton: { marginLeft: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  sendText: { color: 'white', fontSize: 20 }
});

export default SocialDashboard;