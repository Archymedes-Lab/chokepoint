import { useEffect, useRef, useState } from "react";
import {
  STAGES,
  STAGE_BY_ID,
  type Archetype,
  type Outcome,
  type Posture,
  type SimResult,
} from "../sim";
import { Tile, fmtMoney } from "./components";

const OUTCOME_META: Record<Outcome, { label: string; win: boolean; text: string }> = {
  blocked: { label: "Blocked", win: true, text: "The adversary never established access." },
  evicted: { label: "Evicted", win: true, text: "Detected and removed before impact." },
  abandoned: { label: "Abandoned", win: true, text: "The adversary gave up — too hot or out of budget." },
  breached: { label: "Breached", win: false, text: "Reached impact — data stolen / systems encrypted." },
  cashed_out: { label: "Cashed out", win: false, text: "Reached impact and successfully monetised." },
};

export function SingleRun({
  result,
  agent,
  posture,
  onReseed,
}: {
  result: SimResult;
  agent: Archetype;
  posture: Posture;
  onReseed: () => void;
}) {
  const [shown, setShown] = useState(result.events.length);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // Reset playback whenever a new run arrives.
  useEffect(() => {
    setShown(result.events.length);
    setPlaying(false);
  }, [result]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setShown((s) => {
        if (s >= result.events.length) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 480);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, result]);

  function play() {
    setShown(1);
    setPlaying(true);
  }

  const visible = result.events.slice(0, shown);
  const last = visible[visible.length - 1];
  const currentStageIdx = last ? STAGE_BY_ID[last.stage].index : 0;
  const finished = shown >= result.events.length;
  const terminalEvent = result.events.find((e) => e.kind === "terminal" || e.kind === "response");
  const meta = OUTCOME_META[result.outcome];
  const heat = last ? last.heat : 0;

  return (
    <>
      <section className="panel">
        <div className="hd">
          <h2>Intrusion Path</h2>
          <span className="sub">one simulated operation</span>
          <div className="spacer" style={{ flex: 1 }} />
        </div>
        <div className="bd">
          <div className="killchain">
            {STAGES.map((s) => {
              const reached = result.reachedIndex >= s.index && isStageTouched(result, s.index, shown);
              const current = finished ? false : s.index === currentStageIdx && last?.kind !== "terminal";
              const stopped =
                finished &&
                meta.win &&
                s.index === result.reachedIndex &&
                (result.outcome === "evicted" || result.outcome === "blocked" || result.outcome === "abandoned");
              return (
                <div
                  key={s.id}
                  className={`kc-stage ${reached ? "reached" : ""} ${current ? "current" : ""} ${
                    stopped ? "stopped" : ""
                  }`}
                >
                  <span className="kc-dot" />
                  <div className="kc-idx">0{s.index + 1}</div>
                  <div className="kc-name">{s.name}</div>
                  <div className="kc-tactic">{s.tactic}</div>
                </div>
              );
            })}
          </div>

          <div className="mt" style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <span className="eyebrow" style={{ whiteSpace: "nowrap" }}>
              detection heat
            </span>
            <div className="heatbar" style={{ flex: 1 }}>
              <span style={{ width: `${Math.round(heat * 100)}%` }} />
            </div>
            <span className="mono" style={{ fontSize: "0.72rem", width: 38, textAlign: "right" }}>
              {Math.round(heat * 100)}%
            </span>
          </div>

          <div className="mt row-split">
            <button className="btn primary" onClick={onReseed}>
              New run
            </button>
            <button className="btn" onClick={play} disabled={playing}>
              ▶ Replay step-by-step
            </button>
            {playing && (
              <button className="btn" onClick={() => setPlaying(false)}>
                Pause
              </button>
            )}
            {!finished && !playing && (
              <button className="btn" onClick={() => setShown(result.events.length)}>
                Skip to end
              </button>
            )}
            <span className="muted" style={{ fontSize: "0.72rem" }}>
              seed {result.seed.toString(16).slice(0, 8)}
            </span>
          </div>
        </div>
      </section>

      {finished && (
        <section className={`outcome ${meta.win ? "win" : "loss"} mt`}>
          <span className="o-pill">{meta.label}</span>
          <span>{meta.text}</span>
          {terminalEvent && (
            <span className="muted" style={{ marginLeft: "auto", fontSize: "0.74rem" }}>
              stopped at {STAGE_BY_ID[terminalEvent.stage].name}
            </span>
          )}
        </section>
      )}

      <section className="panel mt">
        <div className="hd">
          <h2>Event Log</h2>
          <span className="sub">{agent.name} vs. your posture</span>
        </div>
        <div className="bd">
          <div className="log">
            {visible.map((e) => (
              <div key={e.step} className={`log-row k-${e.kind}`}>
                <span className="st">{STAGE_BY_ID[e.stage].index + 1}·{e.step}</span>
                <span className="txt">
                  <span className="kdot" />
                  {e.text}
                </span>
                <span className="heat">{Math.round(e.heat * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tiles mt">
        <Tile label="Dwell time" value={`${result.dwellHours}h`} sub="hours in the environment" />
        <Tile
          label="Adversary spend"
          value={`${result.adversaryCost}u`}
          sub="abstract resource units"
          tone="attacker"
        />
        <Tile
          label="Adversary net"
          value={fmtMoney(result.adversaryNet)}
          sub="profit after laundering"
          tone="attacker"
        />
        <Tile
          label="Defender loss"
          value={fmtMoney(result.defenderLoss)}
          sub={`of ${fmtMoney(posture.targetValue)} at stake`}
          tone="advantage"
        />
      </section>
    </>
  );
}

/** A stage is lit only if the visible events have reached it. */
function isStageTouched(result: SimResult, stageIdx: number, shown: number): boolean {
  for (let i = 0; i < Math.min(shown, result.events.length); i++) {
    if (STAGE_BY_ID[result.events[i].stage].index >= stageIdx) return true;
  }
  return false;
}
