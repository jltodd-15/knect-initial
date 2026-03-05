import React, { useRef, useState, useEffect } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Option {
    id: string;
    text: string;
}

interface Props {
    options: Option[];
    onReorder: (newOrder: string[]) => void;
    isDarkMode: boolean;
}

const ITEM_HEIGHT = 60;
const SLOT_HEIGHT = ITEM_HEIGHT + 8; // height + margin

interface DraggableItemProps {
    item: Option;
    index: number;
    totalItems: number;
    onDragEnd: (from: number, to: number) => void;
    isDarkMode: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ 
    item, 
    index, 
    totalItems, 
    onDragEnd, 
    isDarkMode 
}) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [isDragging, setIsDragging] = useState(false);
    
    // Store latest props in ref to access them in PanResponder callbacks
    const propsRef = useRef({ index, totalItems, onDragEnd });
    useEffect(() => {
        propsRef.current = { index, totalItems, onDragEnd };
    }, [index, totalItems, onDragEnd]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                pan.setOffset({
                    x: 0, // pan.x._value
                    y: 0 // pan.y._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                setIsDragging(false);
                pan.flattenOffset();

                const { index, totalItems, onDragEnd } = propsRef.current;
                const movedSlots = Math.round(gestureState.dy / SLOT_HEIGHT);
                let newIndex = index + movedSlots;

                // Clamp
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= totalItems) newIndex = totalItems - 1;

                if (newIndex !== index) {
                    onDragEnd(index, newIndex);
                }
                
                // Reset position visually
                pan.setValue({ x: 0, y: 0 });
            }
        })
    ).current;

    const AnimatedView = Animated.View as any;

    return (
        <AnimatedView
            style={[
                styles.item,
                { 
                    backgroundColor: isDarkMode ? '#1c1c1e' : '#f9f9f9',
                    borderColor: isDarkMode ? '#333' : '#eee',
                    transform: [{ translateY: pan.y }],
                    zIndex: isDragging ? 999 : 1,
                    opacity: isDragging ? 0.8 : 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDragging ? 0.2 : 0,
                    shadowRadius: isDragging ? 4 : 0,
                    elevation: isDragging ? 5 : 0,
                }
            ]}
            {...panResponder.panHandlers}
        >
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                <Text style={[styles.text, { color: isDarkMode ? 'white' : 'black' }]}>{item.text}</Text>
            </View>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#666' : '#ccc'} strokeWidth="2">
                <Path d="M8 6h8M8 12h8M8 18h8" />
            </Svg>
        </AnimatedView>
    );
};

const DraggableVoteList: React.FC<Props> = ({ options, onReorder, isDarkMode }) => {
    const [items, setItems] = useState(options);

    useEffect(() => {
        setItems(options);
    }, [options]);

    const handleDragEnd = (from: number, to: number) => {
        if (from === to) return;
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(from, 1);
        newItems.splice(to, 0, movedItem);
        
        setItems(newItems);
        onReorder(newItems.map(i => i.id));
    };

    return (
        <View style={styles.container}>
            {items.map((item, index) => (
                <DraggableItem 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    totalItems={items.length} 
                    onDragEnd={handleDragEnd}
                    isDarkMode={isDarkMode}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        zIndex: 10,
    },
    item: {
        height: ITEM_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    text: {
        fontSize: 16,
        fontWeight: '500',
    }
});

export default DraggableVoteList;
