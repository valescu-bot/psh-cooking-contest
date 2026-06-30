# 🍳 PSH Cooking Contest

App de votación para el concurso de cocina. Los platos son anónimos, cada persona reparte una cantidad de puntos limitada entre sus favoritos, y se arma un podio de 3 en vivo.

Stack: **React + Vite + Supabase**, deploy en **Vercel**. Pensado para subir sin usar la terminal (igual que For Mummies & Daddies).

---

## Paso a paso (sin terminal)

### 1) Crear la base en Supabase
1. Entrá a [supabase.com](https://supabase.com) → **New project**. Ponele nombre y una contraseña (anotala, no la vas a necesitar para esto).
2. Cuando termine de crearse, andá a **SQL Editor** (ícono `</>` en la barra izquierda) → **New query**.
3. Abrí el archivo `supabase-setup.sql`, copiá **todo** el contenido, pegalo y tocá **Run**. Esto crea las tablas y deja los 23 platos precargados.
4. Andá a **Project Settings → API** y copiá dos cosas:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** key (la clave larga `eyJ...`)

### 2) Subir el código a GitHub
1. En [github.com](https://github.com) creá un **repositorio nuevo** (vacío, sin README).
2. En la página del repo, tocá **uploading an existing file** (o **Add file → Upload files**).
3. Arrastrá **todos los archivos y la carpeta `src`** de este proyecto a la ventana. **Importante:** no subas `node_modules` (no existe acá, perfecto) ni ningún `.env`.
4. Tocá **Commit changes**.

### 3) Deployar en Vercel
1. Entrá a [vercel.com](https://vercel.com) → **Add New → Project** → importá tu repo de GitHub.
2. Vercel detecta Vite solo. Antes de deployar, abrí **Environment Variables** y agregá:
   - `VITE_SUPABASE_URL` → la Project URL del paso 1
   - `VITE_SUPABASE_ANON_KEY` → la anon key del paso 1
3. Tocá **Deploy**. En un minuto te da una URL pública (ej. `psh-cooking-contest.vercel.app`).

¡Listo! Esa URL es la que compartís (con un QR el día del evento).

---

## Cómo se usa

- **Votar:** cada persona entra desde su celu, reparte sus puntos con los `+` / `−` y toca **Guardar**. Puede volver y editar cuando quiera desde el mismo dispositivo (un celu = un voto).
- **Resultados:** muestra el podio de 3 y el ranking completo, y se actualiza solo cada 4 segundos (ideal para proyectar en la premiación).
- **Panel ⚙︎ (arriba a la derecha):** código `cocina`. Desde acá cambiás el nombre del contest, los puntos por persona, el máximo por plato, abrís/cerrás la votación, editás los platos y podés borrar todos los votos.

### Ajustes rápidos
- El código del panel se cambia en `src/App.jsx`, línea con `const ADMIN_PIN`.
- Los puntos por defecto (10 por persona, máx 3 por plato) ya quedan listos, pero los cambiás desde el panel sin tocar código.

## Nota de seguridad
Es una app para un evento interno: el acceso es por link público y el código del panel es solo del lado del navegador (no es seguridad real). Para lo que necesitás, alcanza de sobra. No metas datos sensibles.
