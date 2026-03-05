import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CalendarEvent } from '../types';

interface Props {
  event: CalendarEvent;
  layout: {
    top: number;
    height: number;
    left: number;
    width: number;
  };
  slotHeight: number;
  gridStartHour?: number;
  onDragEnd: (eventId: string, newStartTime: number) => void;
  onResizeEnd: (eventId: string, durationChange: number) => void;
  onPress: (event: CalendarEvent) => void;
  isDarkMode: boolean;
  allowResize?: boolean;
  isMultiDay?: boolean;
  onDragAttemptBlocked?: () => void;
}

const DraggableEvent: React.FC<Props> = (props) => {
  const { event, layout, slotHeight, gridStartHour = 0, onDragEnd, onResizeEnd, onPress, isDarkMode, allowResize = true, isMultiDay = false, onDragAttemptBlocked } = props;
  
  // Keep track of latest props to avoid stale closures in PanResponder
  const propsRef = useRef(props);
  propsRef.current = props;

  const panY = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(layout.height)).current;
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const interactionMode = useRef<'none' | 'drag' | 'resize'>('none');

  useEffect(() => {
    if (!isResizing) {
      heightAnim.setValue(layout.height);
    }
  }, [layout.height, isResizing]);

  useEffect(() => {
    if (!isDragging) {
      panY.setValue(0);
    }
  }, [layout.top, isDragging]);

  const [displayTime, setDisplayTime] = useState({ start: event.timestamp, end: event.endTime });

  useEffect(() => {
    setDisplayTime({ start: event.timestamp, end: event.endTime });
  }, [event.timestamp, event.endTime]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt: any, gestureState) => {
        const { locationY } = evt.nativeEvent;
        const currentLayout = propsRef.current.layout;
        const currentAllowResize = propsRef.current.allowResize;
        const currentIsMultiDay = propsRef.current.isMultiDay;
        const currentOnDragAttemptBlocked = propsRef.current.onDragAttemptBlocked;

        if (currentIsMultiDay) {
            if (currentOnDragAttemptBlocked) {
                currentOnDragAttemptBlocked();
            }
            return;
        }
        
        const resizeHitArea = 30; 
        
        if (currentAllowResize && locationY >= currentLayout.height - resizeHitArea) {
            interactionMode.current = 'resize';
            setIsResizing(true);
        } else {
            interactionMode.current = 'drag';
            setIsDragging(true);
            panY.setValue(0);
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const { slotHeight, layout, isMultiDay, gridStartHour = 0, event } = propsRef.current;
        
        if (isMultiDay) return;

        if (interactionMode.current === 'resize') {
             const newHeight = Math.max(slotHeight / 4, layout.height + gestureState.dy);
             heightAnim.setValue(newHeight);

             // Calculate new end time for display
             const pixelHeight = newHeight;
             const durationMs = (pixelHeight / slotHeight) * 60 * 60 * 1000;
             // Snap to 15 min for display
             const SNAP_MS = 15 * 60 * 1000;
             const snappedDuration = Math.round(durationMs / SNAP_MS) * SNAP_MS;
             
             setDisplayTime(prev => ({
                 ...prev,
                 end: prev.start + snappedDuration
             }));

        } else if (interactionMode.current === 'drag') {
             panY.setValue(gestureState.dy);

             // Calculate new start/end time for display
             const currentVisualTop = layout.top + gestureState.dy;
             const hoursFromGridStart = currentVisualTop / slotHeight;
             const absoluteHours = gridStartHour + hoursFromGridStart;
             
             const baseDate = new Date(event.timestamp);
             baseDate.setHours(0, 0, 0, 0);
             
             const rawNewTime = baseDate.getTime() + (absoluteHours * 60 * 60 * 1000);
             const SNAP_MS = 15 * 60 * 1000;
             const snappedTime = Math.round(rawNewTime / SNAP_MS) * SNAP_MS;
             const duration = event.endTime - event.timestamp;

             setDisplayTime({
                 start: snappedTime,
                 end: snappedTime + duration
             });
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        const { 
            event, 
            layout, 
            slotHeight, 
            gridStartHour = 0, 
            onDragEnd, 
            onResizeEnd, 
            onPress,
            isMultiDay
        } = propsRef.current;

        if (isMultiDay) {
            // Just treat as press if it was a tap
            if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
                onPress(event);
            }
            return;
        }

        if (interactionMode.current === 'resize') {
            setIsResizing(false);
            const totalChangeY = gestureState.dy;
            
            const snapStep = slotHeight / 4;
            const slotsAdded = Math.round(totalChangeY / snapStep);
            const pixelsAdded = slotsAdded * snapStep;
            
            const finalHeight = Math.max(snapStep, layout.height + pixelsAdded);

            // Reset display time to prop value until parent updates
            // Actually, we should keep it or let effect reset it
            
            Animated.spring(heightAnim, {
                toValue: finalHeight,
                useNativeDriver: false,
                tension: 80,
                friction: 12
            }).start(() => {
                const durationChangeMs = (pixelsAdded / slotHeight) * 60 * 60 * 1000;
                onResizeEnd(event.id, durationChangeMs);
            });

        } else if (interactionMode.current === 'drag') {
            if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
                setIsDragging(false);
                panY.setValue(0);
                onPress(event);
                interactionMode.current = 'none';
                return;
            }

            setIsDragging(false);
            
            const currentVisualTop = layout.top + gestureState.dy;
            const hoursFromGridStart = currentVisualTop / slotHeight;
            const absoluteHours = gridStartHour + hoursFromGridStart;
            
            const baseDate = new Date(event.timestamp);
            baseDate.setHours(0, 0, 0, 0);
            
            const rawNewTime = baseDate.getTime() + (absoluteHours * 60 * 60 * 1000);
            
            const SNAP_MS = 15 * 60 * 1000;
            const snappedTime = Math.round(rawNewTime / SNAP_MS) * SNAP_MS;
            
            const snappedHoursFromGridStart = (snappedTime - baseDate.getTime()) / (60 * 60 * 1000) - gridStartHour;
            const snappedVisualTop = snappedHoursFromGridStart * slotHeight;
            const pixelDiff = snappedVisualTop - layout.top;

            Animated.spring(panY, {
                toValue: pixelDiff,
                useNativeDriver: false,
                tension: 80,
                friction: 12
            }).start(() => {
                onDragEnd(event.id, snappedTime);
            });
        }
        
        interactionMode.current = 'none';
      },
      
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setIsResizing(false);
        panY.setValue(0);
        heightAnim.setValue(propsRef.current.layout.height);
        interactionMode.current = 'none';
        setDisplayTime({ start: propsRef.current.event.timestamp, end: propsRef.current.event.endTime });
      }
    })
  ).current;

  const AnimatedView = Animated.View as any;
  const startTime = new Date(displayTime.start);
  const endTime = new Date(displayTime.end);
  const isProposed = event.status === 'proposed';

  return (
    <AnimatedView
      style={[
        styles.container,
        {
          top: layout.top,
          left: `${layout.left}%`,
          width: `${layout.width}%`,
          height: heightAnim,
          transform: [{ translateY: panY }],
          zIndex: isDragging || isResizing ? 100 : 1,
          backgroundColor: isProposed ? `${event.color}33` : (event.color || '#10b981'), // 20% opacity for proposed
          opacity: isDragging ? 0.9 : 1,
          borderColor: isProposed ? event.color : (isResizing ? 'white' : 'rgba(255,255,255,0.2)'),
          borderWidth: isProposed ? 2 : 1,
          borderStyle: isProposed ? 'dashed' : 'solid',
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={() => onPress(event)}
        activeOpacity={0.9}
      >
        <Text style={[styles.title, isProposed && { color: event.color }]} numberOfLines={1}>{event.title}</Text>
        <Text style={[styles.time, isProposed && { color: event.color }]} numberOfLines={1}>
          {startTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
        </Text>
        {event.participants && event.participants.length > 0 && (
            <Text style={[styles.participants, isProposed && { color: event.color }]} numberOfLines={1}>
                with {event.participants.length} others
            </Text>
        )}
      </TouchableOpacity>
      
      {/* Resize Handle */}
      {allowResize && (
        <View style={styles.resizeHandleContainer} />
      )}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter',
    marginBottom: 2
  },
  time: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500'
  },
  participants: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontFamily: 'Inter',
    marginTop: 4,
    fontStyle: 'italic'
  },
  resizeHandleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10
  }
});

export default DraggableEvent;
