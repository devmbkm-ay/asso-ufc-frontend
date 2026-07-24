# Audit UX/UI — Phase 0

**Périmètre** : `assos-ufc-frontend` (Next.js App Router, Tailwind v4, shadcn/ui "base-nova").
**Méthode** : lecture exhaustive de `src/app`, `src/components`, `globals.css`, `package.json`. Aucune modification de code à cette étape.
**Vision produit à garder en tête pour la suite** : cette base doit pouvoir devenir une plateforme multi-associations (multi-tenant). Chaque recommandation de ce document est écrite en gardant cette contrainte en tête — favoriser des tokens/composants réutilisables plutôt que des valeurs codées en dur par page.

Légende gravité : 🔴 Critique · 🟠 Majeur · 🟡 Mineur

---

## 1. Identité visuelle

**🔴 Deux noms de marque coexistent.** Le produit s'appelle "Mboka" dans toute l'UI visible (`layout.tsx:11`, les deux sidebars, les deux topbars mobile, l'écran de login) alors que le dépôt technique s'appelle `assos-ufc-frontend`/`assos-ufc` et que la cible réelle est "Fondation Météo Assistance". Impact : rebranding = trouver/remplacer dans ~12 fichiers, pas un simple changement de variable — il n'existe aujourd'hui aucune constante centralisée de nom d'app.
→ Concernés : `layout.tsx`, `Sidebar.tsx`, `MemberSidebar.tsx`, `(admin)/layout.tsx`, `mon-espace/layout.tsx`, `(auth)/login/page.tsx`, `globals.css` (classes `.mboka-*`).

**🟠 Aucun logo, uniquement un monogramme "M" en dégradé.** Le "logo" actuel est un cercle CSS (`bg-linear-to-br from-[#6366F1] to-[#4F46E5]`) avec la lettre "M" — pas un asset SVG réutilisable, pas de favicon de marque, pas de variante icône seule pour mobile/PWA. Impact : rien à adapter, tout est à créer.
→ Concernés : `Sidebar.tsx:47-51`, `MemberSidebar.tsx`, `favicon.ico` (par défaut Next.js, jamais remplacé).

**🟡 Pas de vocabulaire de marque défini** (ton, ligne éditoriale — ex. "Bienvenue dans votre espace" reste générique). À traiter en même temps que le branding.

---

## 2. Cohérence graphique

**🔴 Deux jeux de tokens couleur incompatibles cohabitent dans `globals.css`.** Le fichier définit des variables sémantiques (`--violet:#6366F1`, `--cyan:#06B6D4`, utilisées par `@theme inline`) **et** des classes utilitaires manuelles avec des valeurs différentes pour les mêmes noms (`.text-violet{color:#5B4FFF}`, `.text-cyan{color:#00D9FF}`, lignes 256-278). Selon qu'une page utilise `text-[#6366F1]` en dur, `text-primary` (token), ou `.text-violet` (classe maison), la teinte de "violet" change réellement à l'écran. Impact utilisateur : incohérence visuelle subtile mais réelle sur les accents de couleur d'une page à l'autre.

**🔴 168 occurrences de `#6366F1` et 41 de `#4F46E5` codées en dur** dans 25 fichiers, au lieu d'utiliser les tokens `--primary`/`--sidebar-ring` déjà définis. Conséquence directe : changer la couleur de marque (étape imminente pour le rebranding) demande une opération de recherche/remplacement risquée sur 25 fichiers plutôt qu'une seule ligne dans `globals.css`. C'est **le blocage n°1 pour tout ce qui suit** (branding, dark mode, thème par association).
→ Concernés : quasiment toutes les pages `(admin)/*` et `mon-espace/*`, `components/admin/Sidebar.tsx`, `components/member/MemberSidebar.tsx`.

**🟠 `next-themes` et `recharts` sont installés mais jamais utilisés.** Les tokens `.dark{}` existent dans `globals.css` mais rien n'active jamais la classe `dark`, et `:root` contient déjà des valeurs de thème sombre (`--background:#0F1419`) alors que 100% des pages "métier" forcent des fonds clairs en dur (`bg-white`, `bg-[#F8FAFF]`). Le thème sombre "existe" dans le CSS mais n'a jamais été branché ni testé — probablement du code généré (scaffolding shadcn) jamais nettoyé ni activé.

**🟡 Radius et spacing** : pas d'échelle custom, Tailwind par défaut + un seul token `--radius`. Correct comme base mais à formaliser explicitement dans un Design System (Phase 2) pour garantir que boutons/cards/inputs partagent un radius cohérent au lieu que chaque fichier choisisse `rounded-lg`/`rounded-xl`/`rounded-full` au jugé.

---

## 3. Hiérarchie visuelle

**🟠 Le Dashboard n'a aucune hiérarchie forte entre ses blocs.** 4 `KpiCard` de taille identique, puis une succession de blocs (événement en avant, derniers membres, événements à venir, alertes) sans distinction visuelle de priorité — tout est au même niveau de gris/blanc/bordure fine. Rien n'attire l'œil vers "ce qui nécessite une action" (ex. paiements en attente) vs "ce qui est informatif".
→ `dashboard/page.tsx`.

**🟠 Les tableaux (membres, cotisations) traitent chaque colonne au même poids visuel** (`text-slate-500` uniforme), sans distinction entre donnée primaire (nom) et donnée secondaire (téléphone, date) — pas de gradation de contraste délibérée.

**🟡 Emphase par la couleur plutôt que par la taille/le poids** : le violet `#6366F1` est utilisé à la fois pour les liens, les accents actifs de sidebar, les montants, les icônes — sans hiérarchie claire entre "élément interactif" et "élément décoratif".

---

## 4. Expérience utilisateur

**🟠 Erreurs de formulaire non normalisées.** Chaque formulaire réimplémente son propre `error`/`formError`/`inviteError` avec un `<p>` rouge local — pas de validation champ par champ, pas de retour immédiat, l'utilisateur découvre l'erreur seulement après soumission. Aucune notification globale (pas de toast) : une action réussie (ex. "membre créé") n'a souvent aucun retour visuel au-delà de la fermeture de la modale.
→ `membres/page.tsx`, `cotisations/page.tsx`, `(auth)/login/page.tsx`, `(auth)/register/page.tsx`, `mon-espace/parametres/page.tsx`, `roles/page.tsx`.

**🟠 États de chargement minimalistes et incohérents.** Uniquement du texte "Chargement…" (aucun composant `Skeleton`), formulation et placement différents selon les pages (`dashboard/page.tsx` vs `membres/page.tsx` vs `historique/page.tsx`) — l'utilisateur perçoit une app "qui charge" plutôt qu'une app qui anticipe le contenu.

**🟡 États vides purement textuels** ("Aucun membre trouvé", "Aucune collecte pour le moment") sans illustration, sans action suggérée (ex. bouton "Créer le premier événement" absent d'un état vide qui pourrait le proposer).

---

## 5. Navigation

**🟠 Sidebar admin et sidebar membre dupliquées à l'identique** (structure, largeur `w-56`, logo, footer utilisateur) avec des styles partiellement divergents (l'une 100% hex en dur, l'autre mélange tokens sémantiques et hex) — deux fichiers à maintenir en parallèle pour un seul composant conceptuel "shell de navigation avec variante de menu".
→ `components/admin/Sidebar.tsx`, `components/member/MemberSidebar.tsx`.

**🟠 Pas de Navbar/Header dédié.** La topbar mobile (bouton menu + logo) est dupliquée inline dans `(admin)/layout.tsx` et `mon-espace/layout.tsx` plutôt qu'extraite en composant partagé — le pattern "ouvrir le Sheet mobile" est copié-collé entre les deux layouts avec le même spinner, la même largeur de drawer en dur (`224px`).

**🟡 Aucun fil d'Ariane**, aucune recherche globale, aucun raccourci clavier — attendu vu l'étape actuelle du produit, mais à anticiper dans le Design System (Phase 7 de votre plan).

---

## 6. Responsive

**🔴 `membres/page.tsx` — le tableau le plus consulté de l'app n'est pas utilisable sur mobile.** Le wrapper est en `overflow-hidden` (pas `overflow-x-auto`) : sur petit écran, les colonnes sont simplement coupées, aucun scroll horizontal possible, aucune vue "carte" alternative. C'est la page que l'association utilisera le plus souvent (gestion des 32 membres) — c'est le point de friction mobile le plus grave identifié.

**🟠 Usage très inégal des breakpoints** : `membres/page.tsx` (11 occurrences) est traité avec soin, mais `historique/page.tsx` et `notifications/page.tsx` n'ont **aucun** breakpoint — mise en page fixe non testée en mobile.

**🟡 Les 3 autres pages tableau** (`cotisations`, `membres/[id]`, `ma-cotisation`) gèrent le scroll horizontal (`overflow-x-auto`) mais sans réflexion de priorisation de colonnes sur petit écran (aucune colonne masquée en mobile, contrairement à `membres/page.tsx` qui masque déjà intelligemment téléphone/date via `hidden md:table-cell`/`hidden lg:table-cell` — bonne pratique existante mais non généralisée aux autres tableaux).

---

## 7. Accessibilité

**🟠 Boutons icône-only sans `aria-label`.** Seuls 2 boutons sur l'ensemble de l'app ont un `aria-label` (les deux boutons "Ouvrir le menu" mobile). Le bouton de déconnexion (icône `LogOut`) et les boutons d'action dans les tableaux/dialogs n'ont qu'un `title` (non lu de façon fiable par tous les lecteurs d'écran) ou rien du tout.
→ `Sidebar.tsx:103-109`, `MemberSidebar.tsx`, boutons d'action des tableaux.

**🟡 Contraste non audité formellement** : le violet `#6366F1` sur fond blanc (texte de lien/accent) est à vérifier au ratio WCAG AA — probable mais non confirmé pour tous les usages (ex. `text-slate-400` sur `bg-white` pour du texte informatif, potentiellement sous le seuil AA pour petit texte).

**🟡 `<img>` natif au lieu de `next/image`** (7 fichiers, photos de collectes/événements) : `alt` toujours renseigné (point positif), mais pas d'optimisation de chargement (lazy loading natif géré par le navigateur seulement, pas de `srcset` responsive).

---

## 8. Performances perçues

**🟠 Aucun Skeleton** — chaque chargement de données affiche un texte ou un espace vide puis un "pop" brutal du contenu final, ce qui donne une impression de latence plus grande que la réalité (l'absence de squelette de mise en page fait percevoir le chargement comme plus long).

**🟡 `recharts` installé mais jamais utilisé** — le Dashboard n'a aucune visualisation de tendance (évolution des cotisations dans le temps par ex.), alors que la dépendance est déjà là. Actuellement 100% listes/chiffres bruts, ce qui limite la lecture rapide de tendances (un des objectifs explicitement demandés : "évolution des cotisations").

---

## 9. Qualité des composants

**🟠 Le composant `Table` shadcn existe (`components/ui/table.tsx`) mais n'est utilisé nulle part** — les 4 pages avec tableaux (membres, cotisations, membres/[id], ma-cotisation) réinventent chacune leur propre balisage `<table>` avec des tailles de texte différentes (`text-sm` vs `text-xs`) et une gestion d'overflow incohérente (cf. §6). Résultat : 4 implémentations divergentes d'un même besoin, aucune ne bénéficiant des correctifs qu'on pourrait faire une seule fois sur le composant partagé.

**🟠 Pas de composants de formulaire réutilisables** — chaque page redéfinit sa propre constante `FIELD_CLASS`/`FIELD` en dur plutôt que d'utiliser un composant `FormField` unique. Une modification du style des champs de formulaire nécessite de toucher N fichiers.

**🟡 Composants manquants pour une UI moderne** : pas de `Skeleton`, pas de `Toast`/notification globale, pas de `EmptyState` réutilisable, pas de `ErrorState` réutilisable, pas de composant `StatCard`/`KpiCard` générique utilisé au-delà du dashboard (le `KpiCard` actuel est correct mais isolé — pas repris ailleurs où un chiffre-clé pourrait être affiché, ex. page collectes).

---

## 10. Dette UI

Résumé priorisé de la dette technique qui **bloque ou complique directement** les phases suivantes de votre plan :

| Dette | Bloque quoi | Fichiers |
|---|---|---|
| Couleurs en dur (168+ occurrences `#6366F1` seul) | Rebranding (Phase 1), Design System (Phase 2), thème par association (vision multi-tenant) | ~25 fichiers |
| Deux jeux de tokens violet/cyan incompatibles | Design System (Phase 2) | `globals.css` |
| Dark mode câblé mais jamais activé | Décision produit à trancher avant Phase 2 (le garder et l'activer, ou le retirer proprement) | `globals.css`, `next-themes` inutilisé |
| Sidebars dupliquées (admin/membre) | Refonte Navigation (Phase 3) | `Sidebar.tsx`, `MemberSidebar.tsx` |
| Layouts admin/membre dupliqués à l'identique | Refonte Navigation (Phase 3) | `(admin)/layout.tsx`, `mon-espace/layout.tsx` |
| `Table` shadcn non utilisé, 4 tableaux réinventés | Refonte Composants (Phase 5) | `membres/page.tsx`, `cotisations/page.tsx`, `membres/[id]/page.tsx`, `ma-cotisation/page.tsx` |
| Pas de composant formulaire partagé | Refonte Composants (Phase 5) | tous les formulaires |
| Tableau membres non scrollable mobile | Urgent en soi, indépendant du calendrier de refonte | `membres/page.tsx:568` |

---

## Roadmap proposée (reprend et affine votre plan en 7 phases)

L'ordre ci-dessous respecte votre découpage, avec une justification tirée de l'audit :

1. **Phase 1 — Branding.** Prérequis pour tout le reste, mais **ne peut pas être appliqué proprement tant que les 168 couleurs en dur existent** : une partie du travail de cette phase consiste donc à centraliser d'abord les couleurs dans les tokens `globals.css` existants (sans encore changer les valeurs), puis à changer les valeurs une seule fois.
2. **Phase 2 — Design System.** Trancher explicitement le sort du dark mode (activer proprement via `next-themes`, ou retirer le CSS mort) et unifier les deux jeux de tokens violet/cyan avant de documenter le Design Token final.
3. **Phase 3 — Navigation.** Fusionner Sidebar admin/membre en un seul composant paramétrable (variante de menu), extraire la topbar mobile dupliquée en composant `Header` partagé.
4. **Phase 4 — Dashboard.** Ajouter la hiérarchie visuelle manquante + activer enfin `recharts` pour le graphique d'évolution des cotisations demandé.
5. **Phase 5 — Composants.** Adopter `components/ui/table.tsx` sur les 4 tableaux existants (corrige au passage le bug mobile critique de `membres/page.tsx`), créer `FormField`, `Skeleton`, `EmptyState`, `Toast`.
6. **Phase 6 — Animations.** Sur base stable uniquement (aucune dépendance d'animation n'est installée aujourd'hui — à ajouter à ce moment-là).
7. **Phase 7 — UX avancée.** Recherche globale, raccourcis clavier, etc. — aucun prérequis technique bloquant identifié, à faire en dernier comme prévu.

**Point d'attention transverse (vision multi-tenant)** : à chaque phase, préférer un token/variable (couleur, libellé "Fondation Météo Assistance", logo) à une valeur en dur — c'est la condition technique pour qu'une future association B puisse un jour utiliser la même base avec sa propre identité sans dupliquer le code.

---

*Aucun fichier applicatif n'a été modifié pour produire ce document. Prochaine étape suggérée : valider ce diagnostic, puis passer à la Phase 1 (propositions de branding, présentées avant toute implémentation).*
