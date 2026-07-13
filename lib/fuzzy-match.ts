interface Person { id: string; name: string }

export interface MatchResult {
  personId: string | null;
  personName: string | null;
}

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[,;.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function editDist(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from(
    { length: n + 1 }, (_, i) => i
  );
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function tokenSim(a: string, b: string): number {
  if (a === b) return 1;
  if (a.startsWith(b) || b.startsWith(a)) return 0.8;
  const dist = editDist(a, b);
  if (dist <= 1) return 0.7;
  const maxLen = Math.max(a.length, b.length);
  if (dist <= 2 && maxLen >= 5) return 0.5;
  return 0;
}

function scoreMatch(
  query: string[], candidate: string[]
): number {
  if (!query.length || !candidate.length) return 0;
  let total = 0;
  for (const qt of query) {
    let best = 0;
    for (const ct of candidate) {
      best = Math.max(best, tokenSim(qt, ct));
    }
    total += best;
  }
  const maxLen = Math.max(
    query.length, candidate.length
  );
  return total / maxLen;
}

export function findBestMatch(
  name: string,
  people: Person[],
  threshold = 0.6
): MatchResult {
  const qt = tokenize(name);
  let bestScore = 0;
  let bestPerson: Person | null = null;

  for (const p of people) {
    const ct = tokenize(p.name);
    const score = scoreMatch(qt, ct);
    if (score > bestScore) {
      bestScore = score;
      bestPerson = p;
    }
  }

  if (bestScore >= threshold && bestPerson) {
    return {
      personId: bestPerson.id,
      personName: bestPerson.name,
    };
  }
  return { personId: null, personName: null };
}
