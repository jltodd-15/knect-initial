import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated, Dimensions, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DiscoveryItem, CalendarEvent } from '../types';
import { getDiscoveryFeed } from '../services/geminiService';

interface Props { 
  isDarkMode: boolean;
  onPlanActivity?: (item: DiscoveryItem) => void;
}

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const DiscoveryFeed: React.FC<Props> = ({ isDarkMode, onPlanActivity }) => {
  const styles = getStyles(isDarkMode);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await getDiscoveryFeed();
        setItems(data);
      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchFeed();
  }, []);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleScrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const AnimatedView = Animated.View as any;

  const renderItem = ({ item }: { item: DiscoveryItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
         <View style={styles.tag}><Text style={styles.tagText}>{item.category || 'PARKS'}</Text></View>
         <Text style={styles.cardTitle}>{item.title}</Text>
         <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
         <TouchableOpacity style={styles.viewButton} onPress={() => setSelectedItem(item)}>
            <Text style={styles.viewButtonText}>VIEW SPOT</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <AnimatedView style={[styles.header, { height: headerHeight }]}>
         <AnimatedView style={{ opacity: headerTitleOpacity, position: 'absolute', top: 24, left: 24, right: 24 }}>
             <Text style={styles.title}>Discover</Text>
             <Text style={styles.subtitle}>Curated local experiences</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <TouchableOpacity style={styles.filterChip}><Text style={styles.filterText}>2-4 PEOPLE</Text></TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}><Text style={styles.filterText}>$$ MODERATE</Text></TouchableOpacity>
             </ScrollView>
         </AnimatedView>

         {/* Sticky Header Content */}
         <AnimatedView style={[styles.stickyHeader, { opacity: stickyHeaderOpacity }]}>
             <TouchableOpacity onPress={handleScrollToTop} style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Text style={styles.stickyTitle}>Discover</Text>
                 <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="3" style={{marginLeft: 8}}>
                     <Path d="M12 19V5M5 12l7-7 7 7" />
                 </Svg>
             </TouchableOpacity>
         </AnimatedView>
      </AnimatedView>
      
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{marginTop: 150}} />
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedItem(null)}>
          {selectedItem && (
              <View style={styles.detailContainer}>
                  <ScrollView style={{flex: 1}}>
                      <Image source={{ uri: selectedItem.image }} style={styles.detailImage} />
                      <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><Path d="M18 6L6 18M6 6l12 12" /></Svg>
                      </TouchableOpacity>
                      
                      <View style={styles.detailContent}>
                          <View style={styles.tag}><Text style={styles.tagText}>{selectedItem.category || 'ACTIVITY'}</Text></View>
                          <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                          <Text style={styles.detailDesc}>{selectedItem.description}</Text>
                          
                          <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>LOCATION</Text>
                              <Text style={styles.infoValue}>{selectedItem.location || 'San Francisco, CA'}</Text>
                          </View>
                          
                          <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>PRICE</Text>
                              <Text style={styles.infoValue}>$$ Moderate</Text>
                          </View>
                      </View>
                  </ScrollView>
                  
                  <View style={styles.detailFooter}>
                      <TouchableOpacity 
                          style={styles.planBtn}
                          onPress={() => {
                              setSelectedItem(null);
                              if (onPlanActivity) onPlanActivity(selectedItem);
                          }}
                      >
                          <Text style={styles.planBtnText}>PLAN THIS ACTIVITY</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          )}
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { backgroundColor: isDark ? '#121212' : '#FDFCFB', zIndex: 10, overflow: 'hidden' },
  stickyHeader: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HEADER_MIN_HEIGHT, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: isDark ? '#333' : '#eee', backgroundColor: isDark ? '#121212' : 'rgba(255,255,255,0.95)' },
  stickyTitle: { fontSize: 16, fontWeight: '900', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  
  title: { fontSize: 32, fontWeight: '900', color: '#10b981', fontFamily: 'Inter' },
  subtitle: { fontSize: 12, fontWeight: 'bold', color: '#71717a', marginTop: 4, fontFamily: 'Inter' },
  filterRow: { marginTop: 16, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isDark ? '#1E1E1E' : '#333', borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#444' },
  filterText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: 'white', fontFamily: 'Inter', letterSpacing: 0.5 },
  
  list: { padding: 24, paddingBottom: 100, paddingTop: 24 },
  card: { height: 500, borderRadius: 40, marginBottom: 24, overflow: 'hidden', backgroundColor: '#333', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(0,0,0,0.5)' }, 
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32, paddingBottom: 32 },
  tag: { alignSelf: 'flex-start', backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  tagText: { color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', fontFamily: 'Inter' },
  cardTitle: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 12, fontFamily: 'Inter' },
  cardDesc: { color: '#e4e4e7', fontSize: 14, fontWeight: '500', marginBottom: 32, fontFamily: 'Inter', opacity: 0.9 },
  viewButton: { backgroundColor: 'white', padding: 20, borderRadius: 24, alignItems: 'center' },
  viewButtonText: { color: 'black', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Inter' },

  // Detail Styles
  detailContainer: { flex: 1, backgroundColor: isDark ? '#121212' : 'white' },
  detailImage: { width: '100%', height: 400 },
  closeBtn: { position: 'absolute', top: 40, right: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  detailContent: { padding: 24, paddingBottom: 100 },
  detailTitle: { fontSize: 32, fontWeight: '900', color: isDark ? 'white' : 'black', fontFamily: 'Inter', marginBottom: 16 },
  detailDesc: { fontSize: 16, lineHeight: 24, color: isDark ? '#ccc' : '#555', fontFamily: 'Inter', marginBottom: 32 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: isDark ? '#333' : '#eee' },
  infoLabel: { fontSize: 12, fontWeight: '900', color: '#71717a', fontFamily: 'Inter', letterSpacing: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  detailFooter: { padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: isDark ? '#333' : '#eee', backgroundColor: isDark ? '#121212' : 'white' },
  planBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 24, alignItems: 'center' },
  planBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1, fontFamily: 'Inter' }
});

export default DiscoveryFeed;