import type { PlayerProgression } from "@riw/shared";

/**
 * Progression joueur, serveur authoritative.
 *
 * Etat horizontal (voir 21-systeme-de-jeu) : souvenirs gagnes + quetes decouvertes.
 * Pas de puissance brute. Le client affiche seulement ce que le serveur envoie.
 *
 * Aucune dependance Colyseus / Three / DOM / reseau : pur etat + logique, testable seul
 * (meme contrat que CombatSystem). Dedup via Set ; le snapshot trie pour un rendu deterministe.
 */
interface ProgressionRuntime {
  readonly souvenirs: Set<string>;
  readonly quetes: Set<string>;
}

const MAX_SOUVENIRS = 200;
const MAX_QUETES = 100;

export class ProgressionStore {
  private readonly byPlayer = new Map<string, ProgressionRuntime>();

  /** Cree l'etat d'un joueur s'il n'existe pas encore. Idempotent. */
  ensure(playerId: string): void {
    if (!this.byPlayer.has(playerId)) {
      this.byPlayer.set(playerId, { souvenirs: new Set(), quetes: new Set() });
    }
  }

  /**
   * Enregistre un souvenir gagne. Retourne true seulement si c'est un nouvel ajout
   * (permet a la room de n'emettre un message que sur changement reel).
   */
  addSouvenir(playerId: string, souvenir: string): boolean {
    const state = this.resolve(playerId);
    const value = souvenir.trim();
    if (value.length === 0 || state.souvenirs.has(value)) {
      return false;
    }
    if (state.souvenirs.size >= MAX_SOUVENIRS) {
      return false;
    }
    state.souvenirs.add(value);
    return true;
  }

  /**
   * Marque une quete comme decouverte (joueur a parle au PNJ donneur).
   * Retourne true seulement sur premiere decouverte.
   */
  discoverQuest(playerId: string, questId: string): boolean {
    const state = this.resolve(playerId);
    const value = questId.trim();
    if (value.length === 0 || state.quetes.has(value)) {
      return false;
    }
    if (state.quetes.size >= MAX_QUETES) {
      return false;
    }
    state.quetes.add(value);
    return true;
  }

  /** Snapshot trie de la progression d'un joueur (souvenirs + quetes). */
  snapshot(playerId: string): PlayerProgression {
    const state = this.byPlayer.get(playerId);
    if (!state) {
      return { souvenirs: [], quetes: [] };
    }
    return {
      souvenirs: Array.from(state.souvenirs).sort(),
      quetes: Array.from(state.quetes).sort()
    };
  }

  /** Oublie un joueur (deconnexion). */
  forget(playerId: string): void {
    this.byPlayer.delete(playerId);
  }

  private resolve(playerId: string): ProgressionRuntime {
    this.ensure(playerId);
    // ensure garantit la presence.
    return this.byPlayer.get(playerId) as ProgressionRuntime;
  }
}
