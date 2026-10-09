import Link from "next/link";

const games = [
  { href: "/cards", number: "01", title: "วงไพ่", subtitle: "CARD GAME", description: "จั่วไพ่ ส่งต่อ แล้วปล่อยให้โชคชะตาเลือกว่าใครจะเป็นคนต่อไป", detail: "2–12 คน · ไพ่ 52 ใบ", kind: "cards" },
  { href: "/dice", number: "02", title: "ทอยลูกเต๋า", subtitle: "DICE ROLL", description: "เลือกจำนวนลูกเต๋า แล้วทอยให้โชคตัดสิน กติกาที่เหลือเป็นของคุณ", detail: "1–6 ลูก · ลูกเต๋า 3D", kind: "dice" },
];

export default function Home() {
  return <main className="site-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <div className="brand"><span className="brand-mark">✦</span><span>วงเล่น<span className="brand-dot">.</span></span></div>
      <span className="lobby-top-note">รวมเกมสำหรับวงเพื่อน</span>
    </header>
    <section className="setup-wrap lobby-wrap">
      <div className="eyebrow"><span className="eyebrow-line" /> พร้อมแล้วก็เลือกเลย <span className="eyebrow-line" /></div>
      <h1>คืนนี้ <em>เล่นอะไรดี?</em></h1>
      <p className="setup-intro">รวมเพื่อนให้พร้อม เลือกเกมที่อยากเล่น<br />แล้วให้ความสนุกเริ่มต้นที่โต๊ะนี้</p>
      <div className="game-selection">
        {games.map(game => <Link href={game.href} className={`game-choice game-choice-${game.kind}`} key={game.href}>
          <div className="setup-card-top"><span className="step-number">{game.number} / {game.subtitle}</span><span className="tiny-diamond">◆</span></div>
          <div className="choice-art" aria-hidden="true">
            {game.kind === "cards" ? <div className="choice-card-fan"><img src="/cards/1.png" alt="" /><img src="/cards/13.png" alt="" /></div> : <div className="choice-dice-pair"><span>⚄</span><span>⚂</span></div>}
          </div>
          <h2>{game.title}</h2>
          <p>{game.description}</p>
          <span className="choice-detail">{game.detail}</span>
          <span className="primary-button choice-start">เลือกเกมนี้ <span>↗</span></span>
        </Link>)}
      </div>
      <p className="footer-note">เลือกเกม · รวมวง · สนุกด้วยกัน</p>
    </section>
  </main>;
}
