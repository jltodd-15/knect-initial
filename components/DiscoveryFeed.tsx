import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ScrollView, Animated, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DiscoveryItem } from '../types';
import { MOCK_ACTIVITIES } from '../services/mockActivities';
import SkeletonCard from './shared/SkeletonCard';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

// Maps the schema-shaped Activity mock to the DiscoveryItem contract this component
// (and onPlanActivity's callers, App.tsx / EventPlanner.tsx) already expect.
const getDiscoveryFeed = async (): Promise<DiscoveryItem[]> => {
  return MOCK_ACTIVITIES.map(activity => ({
    id: activity.id,
    title: activity.name,
    description: activity.description,
    image: activity.pictures[0],
    isAd: false,
    category: activity.tags[0] ?? '',
  }));
};

interface Props { 
  onPlanActivity?: (item: DiscoveryItem) => void;
}

const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const DiscoveryFeed: React.FC<Props> = ({ onPlanActivity }) => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);
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
         <AnimatedView style={[styles.headerTitleBlock, { opacity: headerTitleOpacity }]}>
             <Text style={styles.title}>Discover</Text>
             <Text style={styles.subtitle}>Curated local experiences</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <TouchableOpacity style={styles.filterChip}><Text style={styles.filterText}>2-4 PEOPLE</Text></TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}><Text style={styles.filterText}>$$ MODERATE</Text></TouchableOpacity>
             </ScrollView>
         </AnimatedView>

         {/* Sticky Header Content */}
         <AnimatedView style={[styles.stickyHeader, { opacity: stickyHeaderOpacity }]}>
             <TouchableOpacity onPress={handleScrollToTop} style={styles.stickyRow}>
                 <Text style={styles.stickyTitle}>Discover</Text>
                 <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="3" style={styles.stickyArrow}>
                     <Path d="M12 19V5M5 12l7-7 7 7" />
                 </Svg>
             </TouchableOpacity>
         </AnimatedView>
      </AnimatedView>
      
      {loading ? (
        <View style={styles.skeletons}>
          <SkeletonCard variant="activity" />
          <SkeletonCard variant="activity" />
        </View>
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
                  <ScrollView style={styles.detailScroll}>
                      <Image source={{ uri: selectedItem.image }} style={styles.detailImage} />
                      <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth="2"><Path d="M18 6L6 18M6 6l12 12" /></Svg>
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

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, zIndex: 10, overflow: 'hidden' },
  headerTitleBlock: { position: 'absolute', top: spacing.xl, left: spacing.xl, right: spacing.xl },
  stickyHeader: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HEADER_MIN_HEIGHT, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  stickyRow: { flexDirection: 'row', alignItems: 'center' },
  stickyArrow: { marginLeft: spacing.sm },
  stickyTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Inter' },
  
  title: { ...typography.display, color: colors.primary, fontFamily: 'Inter' },
  subtitle: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.xs, fontFamily: 'Inter' },
  filterRow: { marginTop: spacing.base, flexDirection: 'row' },
  filterChip: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  filterText: { fontSize: typography.micro.fontSize, fontWeight: '700', textTransform: 'uppercase', color: colors.textPrimary, fontFamily: 'Inter', letterSpacing: 0.5 },
  
  list: { padding: spacing.xl, paddingBottom: 100, paddingTop: spacing.xl },
  skeletons: { padding: spacing.xl, gap: spacing.xl },
  // Text and buttons on a card sit on a photo under a dark scrim, so they stay white in both modes.
  card: { height: 500, borderRadius: radius.xl, marginBottom: spacing.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: colors.scrim }, 
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing['2xl'], paddingBottom: spacing['2xl'] },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.base },
  tagText: { color: colors.onPrimary, fontSize: typography.micro.fontSize, fontWeight: '700', textTransform: 'uppercase', fontFamily: 'Inter' },
  cardTitle: { ...typography.display, color: colors.onPrimary, marginBottom: spacing.md, fontFamily: 'Inter' },
  cardDesc: { color: colors.onPrimary, fontSize: typography.label.fontSize, fontWeight: '600', marginBottom: spacing['2xl'], fontFamily: 'Inter', opacity: 0.9 },
  viewButton: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.xl, alignItems: 'center' },
  viewButtonText: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.caption.fontSize, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Inter' },

  // Detail Styles
  detailContainer: { flex: 1, backgroundColor: colors.surface },
  detailScroll: { flex: 1 },
  detailImage: { width: '100%', height: 400 },
  closeBtn: { position: 'absolute', top: 40, right: spacing.xl, width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center' },
  detailContent: { padding: spacing.xl, paddingBottom: 100 },
  detailTitle: { ...typography.display, color: colors.textPrimary, fontFamily: 'Inter', marginBottom: spacing.base },
  detailDesc: { fontSize: typography.body.fontSize, lineHeight: 24, color: colors.textSecondary, fontFamily: 'Inter', marginBottom: spacing['2xl'] },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.base, borderBottomWidth: 1, borderColor: colors.border },
  infoLabel: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textSecondary, fontFamily: 'Inter', letterSpacing: 1 },
  infoValue: { fontSize: typography.label.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: 'Inter' },
  detailFooter: { padding: spacing.xl, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  planBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.xl, alignItems: 'center' },
  planBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: typography.label.fontSize, letterSpacing: 1, fontFamily: 'Inter' }
});

export default DiscoveryFeed;
