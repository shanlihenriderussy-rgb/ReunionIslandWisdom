import {
  combatConfig,
  type CombatTargetDefinition,
  type CombatantSnapshotDto
} from "@riw/shared";

// Etat minimal d'un joueur necessaire au combat.
// PlayerSnapshotDto du serveur est structurellement compatible.
export interface CombatPlayer {
  id: string;
  x: number;
  z: number;
  health: number;
  maxHealth: number;
  alive: boolean;
}

export type CombatEvent =
  | { type: "targetDamaged"; targetId: string; byPlayerId: string }
  | { type: "targetKilled"; targetId: string; byPlayerId: string }
  | { type: "playerDamaged"; playerId: string; byTargetId: string }
  | { type: "playerKilled"; playerId: string; byTargetId: string };

export type AttackResult =
  | { ok: true; killed: boolean }
  | { ok: false; reason: "cooldown" | "dead-player" | "no-target" | "dead-target" | "out-of-range" };

interface TargetRuntime {
  readonly def: CombatTargetDefinition;
  health: number;
  alive: boolean;
  respawnAt: number;
  lastAttackAt: number;
  // Aggro sur coup : id de l'attaquant + echeance. Hors aggro -> cible passive.
  aggroPlayerId: string | null;
  aggroUntil: number;
}

function distance(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

/**
 * Combat PvE leger, serveur authoritative.
 * - le joueur envoie une intention d'attaque ciblee ;
 * - le serveur valide portee + cooldown puis applique les degats ;
 * - les cibles stationnaires ripostent sur les joueurs a portee ;
 * - mort/respawn decides ici (cibles) ou signales a la room (joueurs).
 *
 * Aucune dependance Three / DOM / reseau : pur etat + logique, testable seul.
 */
export class CombatSystem {
  private readonly targets = new Map<string, TargetRuntime>();
  private readonly lastPlayerAttackAt = new Map<string, number>();

  constructor(definitions: readonly CombatTargetDefinition[]) {
    for (const def of definitions) {
      this.targets.set(def.id, {
        def,
        health: def.maxHealth,
        alive: true,
        respawnAt: 0,
        lastAttackAt: 0,
        aggroPlayerId: null,
        aggroUntil: 0
      });
    }
  }

  /** Intention d'attaque joueur -> cible. Le serveur tranche. */
  attack(player: CombatPlayer, targetId: string, now: number): AttackResult {
    if (!player.alive) {
      return { ok: false, reason: "dead-player" };
    }

    const previous = this.lastPlayerAttackAt.get(player.id) ?? 0;
    if (now - previous < combatConfig.attackCooldownMs) {
      return { ok: false, reason: "cooldown" };
    }

    const target = this.targets.get(targetId);
    if (!target) {
      return { ok: false, reason: "no-target" };
    }
    if (!target.alive) {
      return { ok: false, reason: "dead-target" };
    }

    const reach = distance(player.x, player.z, target.def.position.x, target.def.position.z);
    if (reach > combatConfig.attackRange) {
      return { ok: false, reason: "out-of-range" };
    }

    // Cooldown consomme seulement sur une attaque valide.
    this.lastPlayerAttackAt.set(player.id, now);
    target.health = Math.max(0, target.health - combatConfig.attackDamage);

    if (target.health === 0) {
      target.alive = false;
      target.respawnAt = now + target.def.respawnMs;
      target.aggroPlayerId = null;
      target.aggroUntil = 0;
      return { ok: true, killed: true };
    }

    // Aggro sur coup : la cible ne ripostera que sur cet attaquant, et seulement
    // pendant la fenetre d'aggro. Pas de degats par simple proximite.
    target.aggroPlayerId = player.id;
    target.aggroUntil = now + combatConfig.targetAggroDurationMs;
    return { ok: true, killed: false };
  }

  /**
   * Tick combat : respawn des cibles puis riposte sur les joueurs a portee.
   * Mute player.health / player.alive. Le respawn joueur est gere par la room.
   * Retourne les evenements survenus (broadcast / feedback).
   */
  update(now: number, players: Iterable<CombatPlayer>): CombatEvent[] {
    const events: CombatEvent[] = [];
    const livingById = new Map<string, CombatPlayer>();
    for (const player of players) {
      if (player.alive) {
        livingById.set(player.id, player);
      }
    }

    for (const target of this.targets.values()) {
      // Respawn cible (aggro remis a zero).
      if (!target.alive) {
        if (now >= target.respawnAt) {
          target.alive = true;
          target.health = target.def.maxHealth;
          target.lastAttackAt = now;
          target.aggroPlayerId = null;
          target.aggroUntil = 0;
        }
        continue;
      }

      // Passive si pas d'aggro, aggro expiree, ou cible inoffensive.
      if (target.def.contactDamage <= 0 || target.aggroPlayerId === null || now >= target.aggroUntil) {
        target.aggroPlayerId = null;
        continue;
      }

      const victim = livingById.get(target.aggroPlayerId);
      if (!victim) {
        // Attaquant mort ou parti : fin du combat.
        target.aggroPlayerId = null;
        continue;
      }

      // Leash : si l'attaquant sort de portee, on garde l'aggro mais on ne frappe pas.
      const reach = distance(victim.x, victim.z, target.def.position.x, target.def.position.z);
      if (reach > combatConfig.targetAggroRange) {
        continue;
      }
      if (now - target.lastAttackAt < target.def.attackCooldownMs) {
        continue;
      }

      target.lastAttackAt = now;
      victim.health = Math.max(0, victim.health - target.def.contactDamage);
      events.push({ type: "playerDamaged", playerId: victim.id, byTargetId: target.def.id });

      if (victim.health === 0) {
        victim.alive = false;
        target.aggroPlayerId = null;
        events.push({ type: "playerKilled", playerId: victim.id, byTargetId: target.def.id });
      }
    }

    return events;
  }

  /** Reinitialise le cooldown d'attaque d'un joueur + purge l'aggro le visant (deconnexion / respawn). */
  forgetPlayer(playerId: string): void {
    this.lastPlayerAttackAt.delete(playerId);
    for (const target of this.targets.values()) {
      if (target.aggroPlayerId === playerId) {
        target.aggroPlayerId = null;
        target.aggroUntil = 0;
      }
    }
  }

  snapshots(): CombatantSnapshotDto[] {
    const out: CombatantSnapshotDto[] = [];
    for (const target of this.targets.values()) {
      out.push({
        id: target.def.id,
        name: target.def.name,
        zoneId: target.def.zoneId,
        x: target.def.position.x,
        z: target.def.position.z,
        health: target.health,
        maxHealth: target.def.maxHealth,
        alive: target.alive
      });
    }
    return out;
  }
}
