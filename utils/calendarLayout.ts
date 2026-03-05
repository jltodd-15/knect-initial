import { CalendarEvent } from '../types';

interface LayoutEvent extends CalendarEvent {
  layout: {
    top: number;
    height: number;
    left: number;
    width: number;
  };
}

export const calculateEventLayouts = (
  events: CalendarEvent[], 
  slotHeight: number, 
  containerWidth: number = 100
): LayoutEvent[] => {
  // 1. Sort events by start time, then end time (longer first)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      return b.endTime - a.endTime;
    }
    return a.timestamp - b.timestamp;
  });

  // 2. Group overlapping events
  const columns: LayoutEvent[][] = [];
  const processedEvents: LayoutEvent[] = [];

  sortedEvents.forEach(event => {
    // Calculate vertical position
    const start = new Date(event.timestamp);
    const end = new Date(event.endTime);
    
    // Normalize to minutes from start of day (assuming 00:00 start for simplicity of calculation, 
    // but the view might start at 5AM. We'll handle offset in the view)
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    let endMinutes = end.getHours() * 60 + end.getMinutes();

    // If the event ends on a different day than it starts, it means it ends at midnight (or later)
    // relative to the start day. Since we are in a single-day view context (events are clamped),
    // we treat this as 24:00 (1440 minutes).
    if (end.getDate() !== start.getDate()) {
        endMinutes = 24 * 60;
    }

    const durationMinutes = endMinutes - startMinutes;

    const top = (startMinutes / 60) * slotHeight;
    const height = (durationMinutes / 60) * slotHeight;

    const layoutEvent: LayoutEvent = {
      ...event,
      layout: { top, height, left: 0, width: 0 }
    };

    // Find the first column where this event fits
    let columnIndex = 0;
    while (true) {
      const column = columns[columnIndex];
      if (!column) {
        columns[columnIndex] = [layoutEvent];
        break;
      }

      // Check for overlap with the last event in this column
      // Since we sorted by start time, we only need to check if the last event ends after this one starts
      const lastEventInColumn = column[column.length - 1];
      const lastEventEnd = new Date(lastEventInColumn.endTime);
      const lastEventEndMinutes = lastEventEnd.getHours() * 60 + lastEventEnd.getMinutes();

      if (lastEventEndMinutes <= startMinutes) {
        // No overlap, fits in this column
        column.push(layoutEvent);
        break;
      }
      
      // Overlap, try next column
      columnIndex++;
    }
    
    // Store column index temporarily to calculate width later
    (layoutEvent as any)._colIndex = columnIndex;
    processedEvents.push(layoutEvent);
  });

  // 3. Calculate width and left position
  // This is a simplified "waterfall" layout. 
  // For a true Google Calendar layout, we need to know the max columns in a "cluster".
  
  // Group events into clusters (groups of events that are connected via overlaps)
  const clusters: LayoutEvent[][] = [];
  let currentCluster: LayoutEvent[] = [];
  let clusterEnd = -1;

  processedEvents.forEach(event => {
    const start = new Date(event.timestamp);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const end = new Date(event.endTime);
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    if (currentCluster.length === 0) {
      currentCluster.push(event);
      clusterEnd = endMinutes;
    } else {
      if (startMinutes < clusterEnd) {
        // Overlaps with cluster
        currentCluster.push(event);
        clusterEnd = Math.max(clusterEnd, endMinutes);
      } else {
        // New cluster
        clusters.push(currentCluster);
        currentCluster = [event];
        clusterEnd = endMinutes;
      }
    }
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  // Process each cluster
  clusters.forEach(cluster => {
    // Find max column index in this cluster
    let maxCol = 0;
    cluster.forEach(ev => {
      maxCol = Math.max(maxCol, (ev as any)._colIndex);
    });
    
    const numCols = maxCol + 1;
    const colWidth = containerWidth / numCols;

    cluster.forEach(ev => {
      ev.layout.width = colWidth;
      ev.layout.left = (ev as any)._colIndex * colWidth;
      delete (ev as any)._colIndex;
    });
  });

  return processedEvents;
};
