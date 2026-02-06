import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { DiscoveryItem } from '../types';
import { getDiscoveryFeed } from '../services/geminiService';

interface Props { isDarkMode: boolean; }

const DiscoveryFeed: React.FC<Props> = ({ isDarkMode }) => {
  const styles = getStyles(isDarkMode);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await getDiscoveryFeed();
        setItems(data);
      } catch (error) { 
        console.error(error); 
        // Mock data fallback if API fails (common in preview)
        setItems([
            { id: '1', title: 'Neon Night Market', description: 'Late night eats and beats.', category: 'Food', image: 'https://picsum.photos/600/800', isAd: false },
            { id: '2', title: 'Sunset Yoga', description: 'Free flow by the bay.', category: 'Wellness', image: 'https://picsum.photos/600/801', isAd: false },
        ]);
      } finally { 
        setLoading(false); 
      }
    };
    fetchFeed();
  }, []);

  const renderItem = ({ item }: { item: DiscoveryItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay}>
         <View style={styles.tag}><Text style={styles.tagText}>{item.category}</Text></View>
         <Text style={styles.title}>{item.title}</Text>
         <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>CURATED LOCAL EXPERIENCES</Text>
      </View>
      
      {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
      )}
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { padding: 24, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#10b981' },
  headerSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#71717a', letterSpacing: 1, marginTop: 4 },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { height: 400, borderRadius: 32, marginBottom: 24, overflow: 'hidden', backgroundColor: isDark ? '#1E1E1E' : 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 32, backgroundColor: 'rgba(0,0,0,0.4)' },
  tag: { backgroundColor: '#10b981', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  tagText: { color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  desc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500', lineHeight: 18 }
});

export default DiscoveryFeed;