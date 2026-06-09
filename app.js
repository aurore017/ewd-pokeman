// =============================================
//  app.js — Handles both index.html & details.html
// =============================================

const API_BASE = "https://pokeapi.co/api/v2";

// ---- Detect which page we're on ----
const isDetailsPage = document.getElementById("details-container") !== null;

if (isDetailsPage) {
  loadDetailsPage();
} else {
  loadIndexPage();
}

// =============================================
//  INDEX PAGE — fetch 50 Pokémon & show grid
// =============================================
async function loadIndexPage() {
  const grid = document.getElementById("pokemon-grid");
  const loading = document.getElementById("loading");

  try {
    // Step 1: Fetch the list of 50 Pokémon
    const response = await fetch(`${API_BASE}/pokemon?limit=50&offset=0`);
    const data = await response.json();

    // Step 2: Fetch each Pokémon's details (image + id)
    const pokemonList = await Promise.all(
      data.results.map(async (pokemon) => {
        const res = await fetch(pokemon.url);
        return await res.json();
      })
    );

    // Step 3: Hide loading, show cards
    loading.classList.add("hidden");

    pokemonList.forEach((pokemon) => {
      const card = createCard(pokemon);
      grid.appendChild(card);
    });

  } catch (error) {
    loading.textContent = "Failed to load Pokémon. Please check your connection.";
    console.error("Error fetching Pokémon list:", error);
  }
}

// Build a single Pokémon card element
function createCard(pokemon) {
  const card = document.createElement("div");
  card.classList.add("card");

  const imageUrl =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;

  card.innerHTML = `
    <img src="${imageUrl}" alt="${pokemon.name}" />
    <p class="pokemon-id">#${String(pokemon.id).padStart(3, "0")}</p>
    <p class="pokemon-name">${pokemon.name}</p>
    <a class="details-btn" href="details.html?name=${pokemon.name}">View Details</a>
  `;

  return card;
}

// =============================================
//  DETAILS PAGE — read ?name= and fetch data
// =============================================
async function loadDetailsPage() {
  const loading = document.getElementById("loading");
  const container = document.getElementById("details-container");

  // Read the Pokémon name from the URL query parameter
  const params = new URLSearchParams(window.location.search);
  const pokemonName = params.get("name");

  if (!pokemonName) {
    loading.textContent = "No Pokémon specified. Go back and choose one.";
    return;
  }

  try {
    // Fetch full Pokémon data
    const response = await fetch(`${API_BASE}/pokemon/${pokemonName}`);
    const pokemon = await response.json();

    // Update page title
    document.title = `${pokemon.name} — Pokédex`;

    // Hide loading, show container
    loading.classList.add("hidden");
    container.classList.remove("hidden");

    // Build the details UI
    container.innerHTML = buildDetailsHTML(pokemon);

  } catch (error) {
    loading.textContent = "Could not load Pokémon details. Please try again.";
    console.error("Error fetching Pokémon details:", error);
  }
}

// Build the full details HTML
function buildDetailsHTML(pokemon) {
  const imageUrl =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;

  // Types
  const typesHTML = pokemon.types
    .map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`)
    .join("");

  // Stats
  const statsHTML = pokemon.stats
    .map(s => {
      const percent = Math.min((s.base_stat / 255) * 100, 100);
      return `
        <div class="stat-row">
          <span class="stat-label">${s.stat.name}</span>
          <div class="stat-bar-bg">
            <div class="stat-bar" style="width: ${percent}%"></div>
          </div>
          <span class="stat-value">${s.base_stat}</span>
        </div>
      `;
    })
    .join("");

  // Abilities
  const abilitiesHTML = pokemon.abilities
    .map(a => `<span class="ability-badge">${a.ability.name}</span>`)
    .join("");

  return `
    <img src="${imageUrl}" alt="${pokemon.name}" />
    <p class="poke-id">#${String(pokemon.id).padStart(3, "0")}</p>
    <h2>${pokemon.name}</h2>

    <div class="types">${typesHTML}</div>

    <div class="info-row">
      <div class="info-item">
        <span>Height</span>
        <strong>${(pokemon.height / 10).toFixed(1)} m</strong>
      </div>
      <div class="info-item">
        <span>Weight</span>
        <strong>${(pokemon.weight / 10).toFixed(1)} kg</strong>
      </div>
      <div class="info-item">
        <span>Base XP</span>
        <strong>${pokemon.base_experience ?? "?"}</strong>
      </div>
    </div>

    <div class="stats">
      <h3>Base Stats</h3>
      ${statsHTML}
    </div>

    <div class="abilities">
      <h3>Abilities</h3>
      <div class="ability-list">${abilitiesHTML}</div>
    </div>
  `;
}
