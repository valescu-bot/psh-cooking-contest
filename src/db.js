import { supabase } from "./supabaseClient";

// ─── Voter ID: un identificador por dispositivo, guardado en el navegador.
// Esto hace que cada persona tenga UN voto que puede retomar y editar.
export function getVoterId() {
  let id = localStorage.getItem("psh_voter_id");
  if (!id) {
    id =
      "v_" +
      (crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem("psh_voter_id", id);
  }
  return id;
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

// ─── Votos ────────────────────────────────────────────────
export async function fetchMyBallot(voterId) {
  const { data, error } = await supabase
    .from("votes")
    .select("dish_id, points")
    .eq("voter_id", voterId);
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => {
    map[r.dish_id] = r.points;
  });
  return map;
}

// Guarda el voto completo: borra los míos y reinserta solo los > 0.
export async function saveBallot(voterId, alloc) {
  const del = await supabase.from("votes").delete().eq("voter_id", voterId);
  if (del.error) throw del.error;
  const rows = Object.entries(alloc)
    .filter(([, p]) => p > 0)
    .map(([dish_id, points]) => ({ voter_id: voterId, dish_id, points }));
  if (rows.length) {
    const ins = await supabase.from("votes").insert(rows);
    if (ins.error) throw ins.error;
  }
}

export async function fetchTally() {
  const { data, error } = await supabase.from("votes").select("dish_id, points, voter_id");
  if (error) throw error;
  const totals = {};
  const voters = new Set();
  (data || []).forEach((r) => {
    totals[r.dish_id] = (totals[r.dish_id] || 0) + r.points;
    voters.add(r.voter_id);
  });
  return { totals, voterCount: voters.size };
}

export async function resetVotes() {
  const { error } = await supabase.from("votes").delete().neq("voter_id", "___none___");
  if (error) throw error;
}
