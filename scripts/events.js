/* =========================================================================
   AGENDA — chargé depuis data/events.json
   -------------------------------------------------------------------------
   Pour ajouter, modifier ou supprimer un événement : éditez UNIQUEMENT le
   fichier data/events.json. Les pages Actualités et Accueil se mettent à jour
   automatiquement, et le tri « à venir / passés » se fait selon la date du jour.

   Remarque : le chargement du JSON nécessite que le site soit servi par un
   serveur (GitHub Pages, ou « python3 -m http.server » en local). En ouvrant
   un fichier directement (double-clic), le navigateur bloque la lecture du JSON.
   ========================================================================= */

const EVENTS_URL = "data/events.json";

function parseDate(iso) { return new Date(iso + "T00:00:00"); }

/* Formatage d'une date (ou d'une plage) en français */
function frDate(startISO, endISO) {
    const opts = { day: "numeric", month: "long", year: "numeric" };
    const s = parseDate(startISO);
    if (endISO && endISO !== startISO) {
        const e = parseDate(endISO);
        const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
        if (sameMonth) return `du ${s.getDate()} au ${e.toLocaleDateString("fr-FR", opts)}`;
        return `du ${s.toLocaleDateString("fr-FR", opts)} au ${e.toLocaleDateString("fr-FR", opts)}`;
    }
    return s.toLocaleDateString("fr-FR", opts);
}

/* Un élément d'agenda (réutilise le style .news__item) */
function eventCard(ev) {
    const dateLabel = frDate(ev.start, ev.end);
    const meta = [ev.location, ev.access, ev.audience].filter(Boolean).join(" · ");
    return `
    <li class="news__item">
      <div class="news__date">
        ${dateLabel}
        ${ev.time ? `<span class="event-time">${ev.time}</span>` : ""}
      </div>
      <div>
        ${ev.tag ? `<span class="tag">${ev.tag}</span>` : ""}
        <h3>${ev.title}</h3>
        ${ev.description ? `<p>${ev.description}</p>` : ""}
        ${meta ? `<p class="event-meta">${meta}</p>` : ""}
        ${ev.link ? `<p class="event-link"><a href="${ev.link}" target="_blank" rel="noopener">${ev.linkLabel || "En savoir plus"} →</a></p>` : ""}
      </div>
    </li>`;
}

async function loadEvents() {
    const upEl   = document.getElementById("agenda-upcoming");
    const pastEl = document.getElementById("agenda-past");
    const homeEl = document.getElementById("home-events");
    if (!upEl && !pastEl && !homeEl) return; // rien à remplir sur cette page

    let events;
    try {
        const res = await fetch(EVENTS_URL, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status);
        events = await res.json();
    } catch (err) {
        const msg = `<li class="news__item"><div><p class="event-meta">L'agenda n'a pas pu être chargé. Assurez-vous que le site est bien servi par un serveur web.</p></div></li>`;
        [upEl, pastEl, homeEl].forEach((el) => { if (el) el.innerHTML = msg; });
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const keyDate = (ev) => parseDate(ev.end || ev.start);

    const upcoming = events
        .filter((ev) => keyDate(ev) >= today)
        .sort((a, b) => parseDate(a.start) - parseDate(b.start));
    const past = events
        .filter((ev) => keyDate(ev) < today)
        .sort((a, b) => parseDate(b.start) - parseDate(a.start));

    if (upEl) {
        upEl.innerHTML = upcoming.length
            ? upcoming.map(eventCard).join("")
            : `<li><div><p class="justified" style="font-style: oblique">Aucun rendez-vous programmé pour l'instant</p></div></li>`;
    }
    if (pastEl) {
        pastEl.innerHTML = past.length
            ? past.map(eventCard).join("")
            : `<li class="news__item"><div><p class="event-meta">Aucun événement passé pour le moment.</p></div></li>`;
    }
    if (homeEl) {
        const latest = [...events].sort((a, b) => keyDate(b) - keyDate(a)).slice(0, 3);
        homeEl.innerHTML = latest.map(eventCard).join("");
    }
}

document.addEventListener("DOMContentLoaded", loadEvents);