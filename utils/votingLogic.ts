import { PollOption, Vote } from '../types';

export const calculatePickOneResult = (options: PollOption[], votes: Vote[]): { winnerId: string; isTie: boolean } => {
  const counts: Record<string, number> = {};
  options.forEach(o => counts[o.id] = 0);

  votes.forEach(v => {
    if (v.optionId && counts[v.optionId] !== undefined) {
      counts[v.optionId]++;
    }
  });

  let maxVotes = -1;
  let winners: string[] = [];

  Object.entries(counts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      winners = [id];
    } else if (count === maxVotes) {
      winners.push(id);
    }
  });

  if (winners.length === 0) return { winnerId: options[0].id, isTie: false }; // Fallback

  const isTie = winners.length > 1;
  // Randomly select if tie
  const winnerId = winners[Math.floor(Math.random() * winners.length)];

  return { winnerId, isTie };
};

export const calculateRankedChoiceResult = (options: PollOption[], votes: Vote[]): { winnerId: string; isTie: boolean } => {
  let activeOptions = new Set(options.map(o => o.id));
  let currentVotes = votes.map(v => ({ ...v, currentRankIndex: 0 }));

  while (activeOptions.size > 1) {
    const counts: Record<string, number> = {};
    activeOptions.forEach(id => counts[id] = 0);

    // Count first choices
    currentVotes.forEach(v => {
      if (!v.rankedOptionIds) return;
      
      // Find the highest ranked option that is still active
      let found = false;
      for (let i = 0; i < v.rankedOptionIds.length; i++) {
        const optId = v.rankedOptionIds[i];
        if (activeOptions.has(optId)) {
          counts[optId]++;
          found = true;
          break;
        }
      }
    });

    // Check for majority > 50%
    const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
    let winner: string | null = null;
    let minVotes = Infinity;
    let losers: string[] = [];

    Object.entries(counts).forEach(([id, count]) => {
      if (count > totalVotes / 2) {
        winner = id;
      }
      if (count < minVotes) {
        minVotes = count;
        losers = [id];
      } else if (count === minVotes) {
        losers.push(id);
      }
    });

    if (winner) return { winnerId: winner, isTie: false };

    // Eliminate loser(s)
    // In strict RCV, we might have specific tie-breaking rules for elimination.
    // Here, if multiple have min votes, we eliminate ALL of them unless it eliminates everyone.
    
    if (losers.length === activeOptions.size) {
        // Everyone is tied with same votes (or 0). Randomly pick one winner.
        // Requirement: "If there is a tie in 'ranked-choice', randomly select a winner without announcing the tie."
        const randomWinner = losers[Math.floor(Math.random() * losers.length)];
        return { winnerId: randomWinner, isTie: false }; // isTie false to hide it
    }

    // Eliminate
    losers.forEach(l => activeOptions.delete(l));
  }

  // Only one left
  return { winnerId: Array.from(activeOptions)[0], isTie: false };
};
