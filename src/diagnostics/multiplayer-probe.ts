import { Block } from '../blocks';
import type { Entity, Sim } from '../entity';
import type { World } from '../world';

interface ProbeFrame {
  mode: 'host' | 'client' | null;
  tick: number;
  sim: Pick<Sim, 'all' | 'viewed' | 'viewedId'>;
  world: Pick<World, 'setBlock' | 'getBlock'>;
  rigCount: number;
  meshedChunks: number;
  otherTransports: readonly { transport: { disconnect(): void } }[];
}

function roundedPosition(position: Entity['pos']) {
  return {
    x: Math.round(position.x * 10) / 10,
    y: Math.round(position.y * 10) / 10,
    z: Math.round(position.z * 10) / 10,
  };
}

function playerReport(entity: Entity) {
  return { id: entity.id, ...roundedPosition(entity.pos), name: entity.name ?? null };
}

export class MultiplayerProbe {
  private readonly firstPositions = new Map<number, { x: number; z: number }>();
  private leaveFired = false;

  constructor(
    private readonly loopbackMode: 'host' | 'client' | null,
    private readonly bots: number,
  ) {}

  update(frame: ProbeFrame, reportPublished: boolean): Record<string, unknown> | null {
    this.disconnectTestPeer(frame);
    const players = frame.sim
      .all()
      .filter((entity) => entity.kind.id === 'player' && entity.id !== frame.sim.viewedId);
    if (this.loopbackMode === 'host') this.rememberPositions(players);
    if (!frame.mode || frame.tick < 300 || reportPublished) return null;
    const common = {
      mode: frame.mode,
      tick: frame.tick,
      bots: this.bots,
      rigCount: frame.rigCount,
    };
    return frame.mode === 'host'
      ? { ...common, ...this.hostReport(frame, players) }
      : { ...common, ...this.clientReport(frame, players) };
  }

  private disconnectTestPeer(frame: ProbeFrame): void {
    if (this.loopbackMode !== 'client' || this.leaveFired || frame.tick < 250) return;
    const peer = frame.otherTransports[1];
    if (!peer) return;
    // Frames may skip over tick 250; fire once on the first eligible frame.
    this.leaveFired = true;
    peer.transport.disconnect();
  }

  private rememberPositions(players: Entity[]): void {
    for (const entity of players) {
      if (!this.firstPositions.has(entity.id)) {
        this.firstPositions.set(entity.id, { x: entity.pos.x, z: entity.pos.z });
      }
    }
  }

  private hostReport(frame: ProbeFrame, players: Entity[]) {
    const remotePlayers = players.map((entity) => {
      const first = this.firstPositions.get(entity.id);
      const moved = first
        ? Math.hypot(entity.pos.x - first.x, entity.pos.z - first.z) > 0.25
        : false;
      return { ...playerReport(entity), moved };
    });
    // Preserve the existing host smoke check's edit in the spawn ring.
    frame.world.setBlock(10, 40, 10, Block.Planks);
    return {
      hostMeshedChunks: frame.meshedChunks,
      remotePlayers,
      editReflected: frame.world.getBlock(10, 40, 10) === Block.Planks,
    };
  }

  private clientReport(frame: ProbeFrame, players: Entity[]) {
    const viewed = frame.sim.viewed();
    return {
      otherPlayers: players.map(playerReport),
      camera: viewed ? roundedPosition(viewed.pos) : null,
      clientMeshedChunks: frame.meshedChunks,
      headlessHostMeshedChunks: 0,
      leaveRigRemoved:
        frame.otherTransports.length > 1 ? frame.rigCount < frame.otherTransports.length + 1 : true,
    };
  }
}
