import { supabase } from "./supabaseClient";

// ─── Identidad ────────────────────────────────────────────
// Guardamos un id del dispositivo para que la MISMA persona pueda
// editar su voto desde su celu, pero otro celu no pueda votar con
// un nombre ya usado.
export function getDeviceId() {
  let id = localStorage.getItem("psh_device_id");
  if (!id) {
    id =
      "d_" +
      (crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem("psh_device_id", id);
  }
  return id;
}

// Normaliza "Ana  Pérez " -> "ana perez" para comparar sin duplicar.
export function normName(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// ─── Config ───────────────────────────────────────────────
export async function fetchConfig() {
  const { data, error } = await supabase.from("config").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function updateConfig(patch) {
  const { error } = await supabase.from("config").update(patch).eq("id", 1);
  if (error) throw error;
}

// ─── Platos ───────────────────────────────────────────────
export async function fetchDishes() {
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addDish(name) {
  const { error } = await supabase.from("dishes").insert({ name });
  if (error) throw error;
}

export async function deleteDish(id) {
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Votos (un voto por persona, identificado por nombre) ──
// Cada persona = una fila en "ballots", con su asignación de puntos.
export async function fetchBallotByName(nameKey) {
  const { data, error } = await supabase
    .from("ballots")
    .select("*")
    .eq("name_key", nameKey)
    .maybeSingle();
  if (error) throw error;
  return data; // null si no existe
}

export async function saveBallot({ nameKey, voterName, deviceId, alloc, existing }) {
  if (existing) {
    // Solo el dueño (mismo dispositivo) puede editar su voto.
    if (existing.device_id && existing.device_id !== deviceId) {
      const e = new Error("DUP");
      e.code = "DUP";
      throw e;
    }
    const { error } = await supabase
      .from("ballots")
      .update({ voter_name: voterName, alloc, updated_at: new Date().toISOString() })
      .eq("name_key", nameKey);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("ballots")
      .insert({ name_key: nameKey, voter_name: voterName, device_id: deviceId, alloc });
    if (error) {
      // 23505 = violación de clave única (alguien votó con ese nombre al mismo tiempo)
      if (error.code === "23505") {
        const e = new Error("DUP");
        e.code = "DUP";
        throw e;
      }
      throw error;
    }
  }
}

export async function fetchTally() {
  const { data, error } = await supabase.from("ballots").select("name_key, voter_name, alloc");
  if (error) throw error;
  const totals = {};
  let voterCount = 0;
  const voters = [];
  (data || []).forEach((b) => {
    const alloc = b.alloc || {};
    const sum = Object.values(alloc).reduce((a, p) => a + (p || 0), 0);
    if (sum > 0) {
      voterCount += 1;
      voters.push(b.voter_name);
    }
    for (const [id, p] of Object.entries(alloc)) {
      totals[id] = (totals[id] || 0) + (p || 0);
    }
  });
  voters.sort((a, b) => a.localeCompare(b));
  return { totals, voterCount, voters };
}

export async function resetVotes() {
  const { error } = await supabase.from("ballots").delete().neq("name_key", "___none___");
  if (error) throw error;
}
