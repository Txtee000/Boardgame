"use client";

import Link from "next/link";
import HomeButton from "@/components/home-button";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";

const DiceScene = dynamic(() => import("@/components/dice-scene"), {
  ssr: false,
  loading: () => <div className="dice-scene dice-loading">กำลังเตรียมลูกเต๋า 3D…</div>,
});

function rollDie() {
  const random = new Uint32Array(1);
  // Reject the remainder so every face has the same probability.
  do { crypto.getRandomValues(random); } while (random[0] >= 4294967292);
  return random[0] % 6 + 1;
}

export default function DicePage() {
  const [count, setCount] = useState(2);
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState<number[]>([]);
  const [rollId, setRollId] = useState(0);
  const [rolling, setRolling] = useState(false);
  const rollLock = useRef(false);
  const settled = useCallback(() => {
    rollLock.current = false;
    setRolling(false);
  }, []);

  function roll() {
    if (rollLock.current) return;
    rollLock.current = true;
    setRolling(true);
    setValues(Array.from({ length: count }, rollDie));
    setRollId(id => id + 1);
  }

  return <main className="site-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <Link href="/" className="brand brand-link"><span className="brand-mark">✦</span><span>วงเล่น<span className="brand-dot">.</span></span></Link>
      <HomeButton />
    </header>
    {!started ? <section className="setup-wrap">
      <div className="eyebrow"><span className="eyebrow-line" /> DICE ROLL <span className="eyebrow-line" /></div>
      <h1>ปล่อยให้ <em>ลูกเต๋าตัดสิน</em></h1>
      <p className="setup-intro">เลือกจำนวนลูกเต๋า แล้วทอยได้เลย<br />กติกาเป็นของคุณ โชคเป็นของลูกเต๋า</p>
      <div className="setup-card">
        <div className="setup-card-top"><span className="step-number">01 / เตรียมลูกเต๋า</span><span className="tiny-diamond">◆</span></div>
        <h2>อยากทอยกี่ลูก?</h2>
        <p>เลือกได้ตั้งแต่ 1 ถึง 6 ลูก</p>
        <div className="counter" role="group" aria-label="จำนวนลูกเต๋า">
          <button aria-label="ลดจำนวนลูกเต๋า" disabled={count <= 1} onClick={() => setCount(n => n - 1)}>−</button>
          <div><strong>{count}</strong><span>ลูก</span></div>
          <button aria-label="เพิ่มจำนวนลูกเต๋า" disabled={count >= 6} onClick={() => setCount(n => n + 1)}>+</button>
        </div>
        <div className="dice-presets" role="group" aria-label="เลือกจำนวนลูกเต๋าอย่างรวดเร็ว">
          {[1, 2, 3, 4, 5, 6].map(n => <button key={n} aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>)}
        </div>
        <button className="primary-button" onClick={() => {
          setValues(Array.from({ length: count }, (_, i) => i % 6 + 1));
          setRollId(0);
          setStarted(true);
        }}>เริ่มทอยลูกเต๋า <span>↗</span></button>
      </div>
      <p className="footer-note">ลูกเต๋า 6 หน้า · โมเดล 3D · ทอยได้ไม่จำกัด</p>
    </section> : <section className="dice-game-wrap">
      <div className="game-toolbar">
        <div className="round-pill"><span className="status-dot" /> DICE <strong>{count} ลูก</strong></div>
        <button className="info-button" disabled={rolling} onClick={() => { setStarted(false); setRollId(0); }}>เปลี่ยนจำนวนลูก</button>
      </div>
      <div className="dice-table">
        <div className="dice-table-heading"><span className="table-kicker">DICE ROLL</span><h1>ทอยให้ <em>รู้กัน</em></h1><p>{rolling ? "ลูกเต๋ากำลังเลือกคำตอบ…" : rollId ? "โชคออกมาแล้ว พร้อมทอยอีกครั้งไหม?" : "ลูกเต๋าพร้อมแล้ว กดปุ่มเพื่อทอย"}</p></div>
        <DiceScene values={values} rollId={rollId} onSettled={settled} />
        <div className="dice-result" aria-live="polite" aria-atomic="true">
          {rolling ? <p className="dice-result-wait">กำลังทอย…</p> : rollId > 0 ? <>
            <div className="dice-result-values">{values.map((value, i) => <div key={i}><span>ลูกที่ {i + 1}</span><strong>{value}</strong></div>)}</div>
            <div className="dice-total"><span>แต้มรวม</span><strong>{values.reduce((sum, n) => sum + n, 0)}</strong></div>
          </> : <p className="dice-result-wait">ผลทอยจะแสดงที่นี่</p>}
        </div>
        <button className="primary-button dice-roll-button" onClick={roll} disabled={rolling}><span aria-hidden="true">⚄</span>{rolling ? "กำลังทอย…" : rollId ? "ทอยอีกครั้ง" : "ทอยลูกเต๋า"}<span aria-hidden="true">↗</span></button>
      </div>
      <p className="footer-note dice-footnote">ทอยกี่ครั้งก็ได้ ให้ลูกเต๋าช่วยตัดสิน</p>
    </section>}
  </main>;
}
