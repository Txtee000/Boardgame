"use client";

import { useEffect, useState } from "react";
import { advanceTurn, basicRules, cardInfo, newGame, randomRule, type Game, type Rank, type Rule } from "@/lib/game";

const STORAGE_KEY = "cardgame-table-v1";

function Card({ rank, back = false, large = false }: { rank?: Rank; back?: boolean; large?: boolean }) {
  return <div className={`card-frame ${large ? "card-large" : ""}`}>
    {/* Using img keeps the supplied card artwork exactly as provided. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={back ? "/cards/back card.png" : `/cards/${rank}.png`} alt={back ? "หลังไพ่" : `ไพ่ ${cardInfo.find(c => c.rank === rank)?.label}`} draggable={false} />
  </div>;
}

function RuleText({ rule }: { rule: Rule }) {
  return <span><strong>{rule.who}</strong> → <strong>{rule.action}</strong> → <strong>{rule.condition}</strong> <span className="text-amber-200">(จนกว่าจะได้ K ใหม่)</span></span>;
}

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [playerCount, setPlayerCount] = useState(4);
  const [modal, setModal] = useState<"rules" | "cards" | "reset" | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [slot, setSlot] = useState<Rule | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Game & { rules?: Rule[]; currentRule?: Rule | null };
        if (parsed && parsed.playerCount >= 2 && parsed.playerCount <= 12 && Array.isArray(parsed.deck)) {
          // Older saved games stored every K rule in an array. Keep only the latest.
          const activeRule = parsed.activeRule ?? parsed.currentRule ?? parsed.rules?.at(-1) ?? null;
          const { rules: _oldRules, currentRule: _oldCurrentRule, ...rest } = parsed;
          setGame({ ...rest, activeRule });
        }
      }
    } catch { /* Ignore invalid saved data. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (game) localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    else localStorage.removeItem(STORAGE_KEY);
  }, [game, loaded]);

  function draw() {
    if (!game || game.phase !== "draw" || spinning) return;
    const [rank, ...deck] = game.deck;
    if (!rank) return;
    if (rank === 13) {
      const rule = randomRule(game.playerCount);
      setSpinning(true);
      let ticks = 0;
      const timer = window.setInterval(() => {
        setSlot(randomRule(game.playerCount));
        ticks++;
        if (ticks >= 12) {
          window.clearInterval(timer);
          setSlot(rule);
          setSpinning(false);
        }
      }, 85);
      setGame({ ...game, deck, drawn: game.drawn + 1, currentCard: rank, activeRule: rule, phase: "result" });
    } else {
      setGame({ ...game, deck, drawn: game.drawn + 1, currentCard: rank, phase: "result" });
    }
  }

  if (!loaded) return <main className="min-h-screen bg-[#111b19]" />;

  return <main className="site-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <div className="brand"><span className="brand-mark">✦</span><span>วงไพ่<span className="brand-dot">.</span></span></div>
      <div className="top-actions">
        {game && <button className="text-action" onClick={() => setModal("reset")}>เริ่มใหม่</button>}
        <button className="icon-button" aria-label="ดูกฎการเล่น" onClick={() => setModal("rules")}>?</button>
      </div>
    </header>

    {!game ? <section className="setup-wrap">
      <div className="eyebrow"><span className="eyebrow-line" /> เกมไพ่สำหรับวงเพื่อน <span className="eyebrow-line" /></div>
      <h1>คืนนี้ <em>ใครจะโดน?</em></h1>
      <p className="setup-intro">จั่วไพ่ ส่งต่อ แล้วปล่อยให้โชคชะตาเลือก<br className="hidden sm:block" /> ว่าใครจะเป็นคนต่อไป</p>
      <div className="setup-card">
        <div className="setup-card-top"><span className="step-number">01 / เริ่มเกม</span><span className="tiny-diamond">◆</span></div>
        <h2>คืนนี้มากันกี่คน?</h2>
        <p>เลือกจำนวนผู้เล่นที่นั่งอยู่รอบโต๊ะ</p>
        <div className="counter" role="group" aria-label="จำนวนผู้เล่น">
          <button aria-label="ลดจำนวนผู้เล่น" disabled={playerCount <= 2} onClick={() => setPlayerCount(n => n - 1)}>−</button>
          <div><strong>{playerCount}</strong><span>คน</span></div>
          <button aria-label="เพิ่มจำนวนผู้เล่น" disabled={playerCount >= 12} onClick={() => setPlayerCount(n => n + 1)}>+</button>
        </div>
        <button className="primary-button" onClick={() => setGame(newGame(playerCount))}>เริ่มเกม <span>↗</span></button>
        <button className="under-button" onClick={() => setModal("rules")}>อ่านกฎการเล่น <span>↗</span></button>
      </div>
      <p className="footer-note">หนึ่งสำรับ · 52 ใบ · ความสนุกไม่จำกัด</p>
    </section> : <section className="game-wrap">
      <div className="game-toolbar">
        <div className="round-pill"><span className="status-dot" /> ROUND <strong>{String(game.round).padStart(2, "0")}</strong></div>
        <button className="info-button" onClick={() => setModal("cards")}><span>ⓘ</span> ความหมายไพ่</button>
      </div>
      <div className="table-area">
        <div className="table-rim"><div className="table-surface">
          <span className="table-ornament ornament-left">✦</span><span className="table-ornament ornament-right">✦</span>
          <div className="table-content">
            {game.phase === "ready" ? <>
              <span className="table-kicker">ตาต่อไป</span>
              <h2>ผู้เล่นคนที่ <em>{game.playerIndex + 1}</em></h2>
              <p>ส่งหน้าจอให้ผู้เล่นคนนี้ แล้วแตะเพื่อยืนยัน</p>
              <button className="ready-button" onClick={() => setGame({ ...game, phase: "draw" })}>ฉันพร้อมแล้ว <span>→</span></button>
            </> : game.phase === "draw" ? <>
              <span className="table-kicker">ผู้เล่นคนที่ {game.playerIndex + 1}</span>
              <h2>ถึงตาของคุณ</h2>
              <p>แตะกองไพ่เพื่อจั่ว 1 ใบ</p>
              <button className="deck-button" aria-label="จั่วไพ่" onClick={draw}><Card back large /><span className="deck-shadow" /></button>
              <span className="tap-hint">แตะเพื่อจั่วไพ่ ↑</span>
            </> : game.phase === "result" ? <>
              <span className="table-kicker">ผู้เล่นคนที่ {game.playerIndex + 1} จั่วได้</span>
              <div className="result-layout"><Card rank={game.currentCard ?? undefined} large /><div className="result-copy">
                <span className="result-label">ไพ่ใบนี้คือ</span>
                <h2>{cardInfo.find(c => c.rank === game.currentCard)?.label}</h2>
                <p className="result-meaning">{cardInfo.find(c => c.rank === game.currentCard)?.meaning}</p>
              </div></div>
              {game.currentCard === 13 && game.activeRule && <div className="king-rule"><span>✦ กฎใหม่จาก K {spinning ? "กำลังสุ่ม..." : ""}</span><div className={spinning ? "slot-spin" : ""}><RuleText rule={slot ?? game.activeRule} /></div></div>}
              <button className="ready-button" disabled={spinning} onClick={() => { setSlot(null); setGame(advanceTurn(game)); }}>{game.deck.length ? "ส่งต่อผู้เล่นถัดไป" : "ดูผลจบเกม"} <span>→</span></button>
            </> : <>
              <span className="table-kicker">ไพ่หมดสำรับแล้ว</span><h2>จบเกมแล้ว!</h2>
              <p>เล่นครบ 52 ใบ ยินดีด้วยกับทุกคนที่อยู่รอด</p>
              <button className="ready-button" onClick={() => setGame(newGame(game.playerCount))}>เล่นอีกครั้ง <span>↗</span></button>
            </>}
          </div>
        </div></div>
      </div>
      <div className="game-bottom"><span>ผู้เล่น {game.playerIndex + 1} / {game.playerCount}</span><span>ไพ่ที่เหลือ {game.deck.length} ใบ</span></div>
      {game.activeRule && <div className="active-rules"><div className="active-heading"><span>✦</span> กฎ K ที่กำลังใช้ <strong>จนกว่าจะได้ K ใหม่</strong></div><div className="active-rule"><span className="rule-index">K</span><RuleText rule={game.activeRule} /></div></div>}
    </section>}

    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}><div className="modal-panel" role="dialog" aria-modal="true" aria-label={modal === "cards" ? "ความหมายไพ่" : modal === "reset" ? "เริ่มเกมใหม่" : "กฎการเล่น"}>
      <div className="modal-head"><div><span className="modal-kicker">วงไพ่ / คู่มือ</span><h2>{modal === "cards" ? "ความหมายไพ่" : modal === "reset" ? "เริ่มเกมใหม่?" : "กฎการเล่น"}</h2></div><button className="close-button" aria-label="ปิด" onClick={() => setModal(null)}>×</button></div>
      {modal === "rules" ? <><p className="modal-lead">กฎพื้นฐานของคืนนี้ เล่นง่าย จำง่าย แต่ห้ามแหกกฎ</p><div className="basic-rules">{basicRules.map((rule, i) => <div key={rule}><span>{String(i + 1).padStart(2, "0")}</span><strong>{rule}</strong></div>)}</div><p className="modal-foot">ผลของไพ่และกฎจาก K ให้ตกลงกันในวงตามความเหมาะสม</p></> : modal === "cards" ? <div className="card-list">{cardInfo.map(card => <div key={card.rank}><span className="list-rank">{card.label}</span><span>{card.meaning}</span></div>)}</div> : <><p className="modal-lead">เริ่มใหม่จะลบความคืบหน้าและกฎที่สุ่มไว้ทั้งหมด</p><button className="primary-button reset-confirm" onClick={() => { setGame(null); setModal(null); setSpinning(false); setSlot(null); }}>เริ่มเกมใหม่ <span>↗</span></button></>}
    </div></div>}
  </main>;
}
