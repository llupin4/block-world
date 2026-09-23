import { parseReplayParam } from '../replay';

function integerParam(
  params: URLSearchParams,
  name: string,
  fallback: number,
  minimum: number,
): number {
  return Math.max(minimum, parseInt(params.get(name) ?? String(fallback), 10) || fallback);
}

export function parseStartupOptions(search: string) {
  const params = new URLSearchParams(search);
  const phase = params.get('phase');
  const startPhase = phase !== null && phase !== '' && Number.isFinite(+phase) ? +phase : 0;
  const profMode = params.get('prof') === 'remesh';
  const mpMode = params.get('mp');
  const mpActive = mpMode === 'host' || mpMode === 'client';
  const defaultBots = mpMode === 'host' ? 2 : 1;
  const lobbyHost = params.has('host');
  const lobbyJoinCode = params.get('join');

  return {
    startPhase,
    profMode,
    profNoRender: profMode && params.has('norender'),
    mpMode,
    mpActive,
    mpBots: mpActive ? integerParam(params, 'bots', defaultBots, 1) : 0,
    mpDelay: mpActive ? integerParam(params, 'delay', 0, 0) : 0,
    lobbyHost,
    lobbyJoinCode,
    lobbyActive: lobbyHost || lobbyJoinCode !== null,
    hostCode: params.get('host'),
    name: params.get('name') ?? '',
    replayKey: parseReplayParam(search),
    debug: params.has('dbg'),
  };
}
