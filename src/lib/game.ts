export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Phase = "ready" | "draw" | "result" | "finished";
export type Rule = { id: string; who: string; action: string; condition: string };
export type Game = { playerCount: number; playerIndex: number; round: number; deck: Rank[]; drawn: number; currentCard: Rank | null; phase: Phase; activeRule: Rule | null };

export const cardInfo: { rank: Rank; label: string; meaning: string }[] = [
  { rank: 1, label: "A", meaning: "กินคนเดียว" },
  { rank: 2, label: "2", meaning: "หาเพื่อนกิน 1 คน" },
  { rank: 3, label: "3", meaning: "หาเพื่อนกิน 2 คน" },
  { rank: 4, label: "4", meaning: "คนทางขวากิน" },
  { rank: 5, label: "5", meaning: "กินทั้งโต๊ะ" },
  { rank: 6, label: "6", meaning: "คนทางซ้ายกิน" },
  { rank: 7, label: "7", meaning: "หาบัดดี้" },
  { rank: 8, label: "8", meaning: "พัก" },
  { rank: 9, label: "9", meaning: "เกม" },
  { rank: 10, label: "10", meaning: "ห้ามพูด 1 รอบ" },
  { rank: 11, label: "J", meaning: "จับหน้า ใครจับช้าสุดโดน" },
  { rank: 12, label: "Q", meaning: "คนอื่นห้ามตอบ" },
  { rank: 13, label: "K", meaning: "สร้างกฎใหม่แทนกฎ K เดิม" },
];

export const basicRules = ["เล่นให้จบ", "ห้ามแบมือ", "ห้ามเข้าห้องน้ำ"];
const pick = <T,>(values: T[]) => values[Math.floor(Math.random() * values.length)];

export function newDeck(): Rank[] {
  const cards = Array.from({ length: 52 }, (_, index) => ((index % 13) + 1) as Rank);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function newGame(playerCount: number): Game {
  return { playerCount, playerIndex: 0, round: 1, deck: newDeck(), drawn: 0, currentCard: null, phase: "ready", activeRule: null };
}

export function randomRule(playerCount: number): Rule {
  const who = ["เลือกใครก็ได้", "คนเปิดไพ่", "คนที่อายุมากที่สุด", "คนที่อายุน้อยที่สุด", ...Array.from({ length: playerCount }, (_, i) => `ผู้เล่นคนที่ ${i + 1}`)];
  return {
    id: `${Date.now()}-${Math.random()}`,
    who: pick(who),
    action: pick(["ดื่ม 1 ครั้ง", "ชนแก้วกับ 1 คน", "เลือกคนอื่นทำแทน"]),
    condition: pick(["ถ้าหัวเราะ", "ถ้าคนข้าง ๆ ดื่ม", "ถ้ามีคนอื่นดื่ม", "ถ้าใครทำผิดกฎ"]),
  };
}

export function advanceTurn(game: Game): Game {
  if (game.deck.length === 0) return { ...game, phase: "finished", currentCard: null };
  const playerIndex = (game.playerIndex + 1) % game.playerCount;
  const round = game.round + (playerIndex === 0 ? 1 : 0);
  return {
    ...game, playerIndex, round, currentCard: null, phase: "ready",
  };
}
