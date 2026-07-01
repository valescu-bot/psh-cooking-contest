import { useState, useEffect, useCallback, useRef } from "react";
import { supabaseReady } from "./supabaseClient";
import {
  getVoterId,
  fetchConfig,
  updateConfig,
  fetchDishes,
  addDish,
  deleteDish,
  fetchMyBallot,
  saveBallot,
  fetchTally,
  resetVotes,
} from "./db";

// ─── Ajustes que podés editar a mano ───────────────────────────────
const ADMIN_PIN = "cocina"; // código del panel (solo del lado del navegador)
// ────────────────────────────────────────────────────────────────────

// Paleta: celeste y blanco de la bandera + rojo PSH de acento.
const C = {
  bg: "#EAF4FC",
  bg2: "#DCEBF7",
  surface: "#FFFFFF",
  surface2: "#F2F8FD",
  line: "#CFE2F2",
  ink: "#182C3E",
  muted: "#6A8299",
  celeste: "#5AA9E6",
  celesteDk: "#3E86C4",
  red: "#E31E24",
  redDk: "#C0161B",
  gold: "#F2B12E",
  silver: "#A9B7C4",
  bronze: "#CB8A54",
  green: "#2FA36B",
};

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const body = "'Inter', system-ui, sans-serif";

function PshLogo({ size = 60 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: C.red,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 20px rgba(227,30,36,0.30)",
      }}
    >
      <span
        style={{
          fontFamily: display,
          fontWeight: 800,
          color: "#fff",
          fontSize: size * 0.42,
          letterSpacing: -1.5,
          lineHeight: 1,
          paddingBottom: size * 0.04,
        }}
      >
        psh
      </span>
    </div>
  );
}

// Franja celeste-blanco-celeste, como la bandera.
function FlagStripe() {
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", width: 72, margin: "0 auto" }}>
      <div style={{ flex: 1, background: C.celeste }} />
      <div style={{ flex: 1, background: "#fff" }} />
      <div style={{ flex: 1, background: C.celeste }} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [config, setConfig] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadCore = useCallback(async () => {
    try {
      const [cfg, d] = await Promise.all([fetchConfig(), fetchDishes()]);
      setConfig(cfg);
      setDishes(d);
      setErr("");
    } catch (e) {
      setErr(e.message || "Error al conectar con la base.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supabaseReady) loadCore();
    else setLoading(false);
  }, [loadCore]);

  const wrap = (children) => (
    <div
      style={{
        fontFamily: body,
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 100%)`,
        color: C.ink,
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 64px" }}>{children}</div>
    </div>
  );

  if (!supabaseReady) {
    return wrap(
      <div style={{ paddingTop: 60 }}>
        <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: 26 }}>Falta configurar Supabase</h2>
        <p style={{ color: C.muted, lineHeight: 1.6, marginTop: 12 }}>
          Definí <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en Vercel y volvé a deployar.
        </p>
      </div>
    );
  }

  if (loading) return wrap(<div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>Cargando…</div>);

  if (err)
    return wrap(
      <div style={{ paddingTop: 60 }}>
        <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: 24, color: C.red }}>Algo falló</h2>
        <p style={{ color: C.muted, lineHeight: 1.6, marginTop: 12 }}>{err}</p>
        <div style={{ marginTop: 20 }}>
          <Btn onClick={loadCore}>Reintentar</Btn>
        </div>
      </div>
    );

  return wrap(
    view === "home" ? (
      <Home config={config} dishes={dishes} setView={setView} />
    ) : view === "vote" ? (
      <Vote config={config} dishes={dishes} setView={setView} />
    ) : view === "results" ? (
      <Results config={config} dishes={dishes} setView={setView} />
    ) : (
      <Admin config={config} setConfig={setConfig} dishes={dishes} setView={setView} reload={loadCore} />
    )
  );
}

function Pill({ children }) {
  return (
    <span
      style={{
        fontFamily: body,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: C.celesteDk,
        background: "rgba(90,169,230,0.14)",
        border: `1px solid ${C.celeste}`,
        borderRadius: 999,
        padding: "4px 12px",
      }}
    >
      {children}
    </span>
  );
}

function Btn({ children, onClick, kind = "primary", disabled, full }) {
  const styles = {
    primary: { background: C.red, color: "#fff", border: "none", boxShadow: "0 6px 16px rgba(227,30,36,0.28)" },
    celeste: { background: C.celeste, color: "#fff", border: "none", boxShadow: "0 6px 16px rgba(90,169,230,0.30)" },
    ghost: { background: "#fff", color: C.ink, border: `1.5px solid ${C.line}` },
    gold: { background: C.gold, color: "#3A2A00", border: "none", boxShadow: "0 6px 16px rgba(242,177,46,0.30)" },
    danger: { background: "#fff", color: C.red, border: `1.5px solid ${C.red}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[kind],
        fontFamily: display,
        fontWeight: 700,
        fontSize: 16,
        padding: "14px 20px",
        borderRadius: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        width: full ? "100%" : "auto",
      }}
    >
      {children}
    </button>
  );
}

function Home({ config, dishes, setView }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Pill>⚽ Mitad de año</Pill>
        <button
          onClick={() => setView("admin")}
          aria-label="Panel"
          style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}
        >
          ⚙︎
        </button>
      </div>

      <div style={{ textAlign: "center", margin: "28px 0 44px" }}>
        <PshLogo size={64} />
        <div style={{ margin: "18px 0 14px" }}>
          <FlagStripe />
        </div>
        <div style={{ fontSize: 40, lineHeight: 1, letterSpacing: 4 }}>⚽ 🍽️ 🏆</div>
        <h1
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.02,
            margin: "16px 0 12px",
            letterSpacing: -1,
          }}
        >
          {config.contest_name}
        </h1>
        <p style={{ color: C.muted, fontSize: 15, maxWidth: 380, margin: "0 auto", lineHeight: 1.55 }}>
          Tenés <b style={{ color: C.ink }}>{config.points_per_voter} puntos</b> para repartir entre tus platos
          favoritos —no te alcanzan para todos, así que elegí bien. Quién cocinó cada plato es secreto hasta la
          premiación.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Btn full kind="primary" onClick={() => setView("vote")}>
          Votar →
        </Btn>
        <Btn full kind="ghost" onClick={() => setView("results")}>
          Ver resultados
        </Btn>
      </div>

      <p style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 24 }}>
        {dishes.length} {dishes.length === 1 ? "plato" : "platos"} en la mesa
        {" · "}
        {config.voting_open ? "votación abierta" : "votación cerrada"}
      </p>
    </div>
  );
}

function Vote({ config, dishes, setView }) {
  const voterId = getVoterId();
  const [alloc, setAlloc] = useState({});
  const [loadingBallot, setLoadingBallot] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const total = config.points_per_voter;
  const used = Object.values(alloc).reduce((a, b) => a + (b || 0), 0);
  const remaining = total - used;
  const maxPer = config.max_per_dish > 0 ? config.max_per_dish : total;

  useEffect(() => {
    (async () => {
      try {
        const mine = await fetchMyBallot(voterId);
        setAlloc(mine);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingBallot(false);
      }
    })();
  }, [voterId]);

  function setDish(id, val) {
    const v = Math.max(0, Math.min(val, maxPer));
    const others = used - (alloc[id] || 0);
    const capped = Math.min(v, total - others);
    setAlloc((a) => ({ ...a, [id]: capped }));
    setSaved(false);
  }

  async function submit() {
    setSaving(true);
    setErr("");
    try {
      await saveBallot(voterId, alloc);
      setSaved(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!config.voting_open) {
    return (
      <Shell title="Votación cerrada" setView={setView}>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>
          La votación ya está cerrada. Andá a <b style={{ color: C.ink }}>Resultados</b> para ver el podio.
        </p>
        <div style={{ marginTop: 24 }}>
          <Btn kind="gold" onClick={() => setView("results")}>
            Ver podio →
          </Btn>
        </div>
      </Shell>
    );
  }

  if (loadingBallot)
    return (
      <Shell title="Tu voto" setView={setView}>
        <p style={{ color: C.muted }}>Cargando tu voto…</p>
      </Shell>
    );

  if (dishes.length === 0) {
    return (
      <Shell title="Tu voto" setView={setView}>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>
          Todavía no hay platos cargados. Avisale a quien organiza para que los sume desde el panel ⚙︎.
        </p>
      </Shell>
    );
  }

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: C.bg,
          paddingTop: 8,
          paddingBottom: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button
            onClick={() => setView("home")}
            style={{ background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", padding: 0 }}
          >
            ← Inicio
          </button>
          <span style={{ color: C.muted, fontSize: 13 }}>tu voto ⚽</span>
        </div>
        <div
          style={{
            background: C.surface,
            border: `1.5px solid ${remaining === 0 ? C.green : C.line}`,
            borderRadius: 16,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 14px rgba(24,44,62,0.06)",
          }}
        >
          <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Puntos sin repartir</span>
          <span style={{ fontFamily: display, fontSize: 32, fontWeight: 800, color: remaining === 0 ? C.green : C.red }}>
            {remaining}
            <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}> / {total}</span>
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {dishes.map((d) => {
          const v = alloc[d.id] || 0;
          return (
            <div
              key={d.id}
              style={{
                background: C.surface,
                border: `1.5px solid ${v > 0 ? C.celeste : C.line}`,
                borderRadius: 16,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                boxShadow: v > 0 ? "0 4px 14px rgba(90,169,230,0.15)" : "0 2px 8px rgba(24,44,62,0.04)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{d.name}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                  {v > 0 ? `${v} ${v === 1 ? "punto" : "puntos"}` : "sin puntos"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Stepper label="−" onClick={() => setDish(d.id, v - 1)} disabled={v <= 0} />
                <span style={{ fontFamily: display, fontWeight: 800, fontSize: 22, minWidth: 26, textAlign: "center" }}>
                  {v}
                </span>
                <Stepper label="+" onClick={() => setDish(d.id, v + 1)} disabled={remaining <= 0 || v >= maxPer} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn full kind="gold" onClick={submit} disabled={saving}>
          {saving ? "Guardando…" : saved ? "✓ Voto guardado" : "Guardar mi voto"}
        </Btn>
        {saved && (
          <p style={{ textAlign: "center", color: C.green, fontSize: 13, marginTop: 12 }}>
            Listo, tu voto quedó guardado. Podés volver cuando quieras desde este mismo celu y editarlo.
          </p>
        )}
        {err && <p style={{ textAlign: "center", color: C.red, fontSize: 13, marginTop: 12 }}>{err}</p>}
        {config.max_per_dish > 0 && (
          <p style={{ textAlign: "center", color: C.muted, fontSize: 12, marginTop: 10 }}>
            Máximo {config.max_per_dish} puntos por plato.
          </p>
        )}
      </div>
    </div>
  );
}

function Stepper({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        border: `1.5px solid ${C.line}`,
        background: C.surface2,
        color: C.ink,
        fontSize: 22,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

function Results({ config, dishes, setView }) {
  const [totals, setTotals] = useState({});
  const [voters, setVoters] = useState(0);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const { totals, voterCount } = await fetchTally();
      setTotals(totals);
      setVoters(voterCount);
    } catch (e) {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 4000);
    return () => clearInterval(timer.current);
  }, [load]);

  const ranked = dishes
    .map((d) => ({ ...d, points: totals[d.id] || 0 }))
    .sort((a, b) => b.points - a.points);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const medals = ["🥇", "🥈", "🥉"];
  const podiumColors = [C.gold, C.silver, C.bronze];

  return (
    <Shell title="Resultados 🏆" setView={setView} onRefresh={load}>
      {loading ? (
        <p style={{ color: C.muted }}>Sumando puntos…</p>
      ) : ranked.every((d) => d.points === 0) ? (
        <p style={{ color: C.muted, lineHeight: 1.6 }}>Todavía no hay votos cargados. ¡Que arranque la cata!</p>
      ) : (
        <>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
            {voters} {voters === 1 ? "persona votó" : "personas votaron"} · se actualiza solo
          </p>

          <div style={{ display: "grid", gap: 10, marginBottom: rest.length ? 28 : 0 }}>
            {podium.map((d, i) => (
              <div
                key={d.id}
                style={{
                  background: C.surface,
                  border: `2px solid ${podiumColors[i]}`,
                  borderRadius: 16,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 6px 18px rgba(24,44,62,0.08)",
                }}
              >
                <span style={{ fontSize: 34 }}>{medals[i]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 20, lineHeight: 1.15 }}>{d.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 28, color: podiumColors[i] }}>
                    {d.points}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>puntos</div>
                </div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              {rest.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span style={{ color: C.muted, fontFamily: display, fontWeight: 700, minWidth: 22 }}>{i + 4}</span>
                  <span style={{ flex: 1, fontSize: 15 }}>{d.name}</span>
                  <span style={{ fontFamily: display, fontWeight: 700, color: C.ink }}>{d.points}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

function Admin({ config, setConfig, dishes, setView, reload }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [local, setLocal] = useState(config);
  const [newDish, setNewDish] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function flash(m) {
    setMsg(m);
    setTimeout(() => setMsg(""), 2200);
  }

  async function saveConfig(next) {
    const merged = { ...local, ...next };
    setLocal(merged);
    try {
      await updateConfig({
        contest_name: merged.contest_name,
        points_per_voter: merged.points_per_voter,
        max_per_dish: merged.max_per_dish,
        voting_open: merged.voting_open,
      });
      setConfig(merged);
      flash("Guardado");
    } catch (e) {
      flash("Error al guardar");
    }
  }

  async function onAddDish() {
    const name = newDish.trim();
    if (!name) return;
    setBusy(true);
    try {
      await addDish(name);
      setNewDish("");
      await reload();
    } catch (e) {
      flash("Error al sumar");
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveDish(id) {
    try {
      await deleteDish(id);
      await reload();
    } catch (e) {
      flash("Error al borrar");
    }
  }

  async function onReset() {
    if (!window.confirm("¿Borrar TODOS los votos? Esto no se puede deshacer.")) return;
    try {
      await resetVotes();
      flash("Votos borrados");
    } catch (e) {
      flash("Error al borrar votos");
    }
  }

  if (!unlocked) {
    return (
      <Shell title="Panel" setView={setView}>
        <p style={{ color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>Ingresá el código de organización.</p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="código"
          style={inputStyle}
        />
        <div style={{ marginTop: 16 }}>
          <Btn full onClick={() => pin === ADMIN_PIN && setUnlocked(true)}>
            Entrar
          </Btn>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Panel de organización" setView={setView}>
      {msg && <div style={{ color: C.green, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>✓ {msg}</div>}

      <Section title="El concurso">
        <Field label="Nombre del contest">
          <input
            value={local.contest_name}
            onChange={(e) => setLocal({ ...local, contest_name: e.target.value })}
            onBlur={() => saveConfig({})}
            style={inputStyle}
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Puntos por persona">
            <input
              type="number"
              min={1}
              value={local.points_per_voter}
              onChange={(e) => setLocal({ ...local, points_per_voter: Math.max(1, +e.target.value || 1) })}
              onBlur={() => saveConfig({})}
              style={inputStyle}
            />
          </Field>
          <Field label="Máx. por plato (0 = libre)">
            <input
              type="number"
              min={0}
              value={local.max_per_dish}
              onChange={(e) => setLocal({ ...local, max_per_dish: Math.max(0, +e.target.value || 0) })}
              onBlur={() => saveConfig({})}
              style={inputStyle}
            />
          </Field>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.surface,
            border: `1.5px solid ${C.line}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginTop: 4,
          }}
        >
          <span style={{ fontWeight: 600 }}>Votación {local.voting_open ? "abierta" : "cerrada"}</span>
          <Btn
            kind={local.voting_open ? "ghost" : "primary"}
            onClick={() => saveConfig({ voting_open: !local.voting_open })}
          >
            {local.voting_open ? "Cerrar" : "Abrir"}
          </Btn>
        </div>
      </Section>

      <Section title={`Platos (${dishes.length})`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={newDish}
            onChange={(e) => setNewDish(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddDish()}
            placeholder="Nombre del plato (sin autor)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <Btn onClick={onAddDish} disabled={busy}>
            Sumar
          </Btn>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {dishes.map((d, i) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <span style={{ color: C.muted, fontFamily: display, fontWeight: 700 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{d.name}</span>
              <button
                onClick={() => onRemoveDish(d.id)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}
              >
                ×
              </button>
            </div>
          ))}
          {dishes.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Todavía no hay platos.</p>}
        </div>
      </Section>

      <Section title="Zona de riesgo">
        <Btn kind="danger" onClick={onReset}>
          Borrar todos los votos
        </Btn>
      </Section>
    </Shell>
  );
}

const inputStyle = {
  width: "100%",
  fontFamily: body,
  fontSize: 15,
  background: C.surface,
  border: `1.5px solid ${C.line}`,
  borderRadius: 12,
  color: C.ink,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14, flex: 1 }}>
      <span style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: C.celesteDk,
          marginBottom: 14,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Shell({ title, setView, children, onRefresh }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button
          onClick={() => setView("home")}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", padding: 0 }}
        >
          ← Inicio
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{ background: "none", border: "none", color: C.red, fontSize: 14, cursor: "pointer", fontWeight: 600 }}
            >
              ↻ Actualizar
            </button>
          )}
          <PshLogo size={30} />
        </div>
      </div>
      <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: 32, letterSpacing: -0.5, marginBottom: 24 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
