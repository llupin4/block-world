import { describe, expect, it } from 'vitest';
import { parseStartupOptions } from '../startup/options';

describe('startup options', () => {
  it('defaults to a normal world with no loopback clients', () => {
    expect(parseStartupOptions('')).toMatchObject({
      startPhase: 0,
      profMode: false,
      profNoRender: false,
      mpActive: false,
      mpBots: 0,
      mpDelay: 0,
      lobbyActive: false,
      replayKey: null,
      debug: false,
    });
  });

  it.each([
    ['?mp=host', 2, 0],
    ['?mp=client', 1, 0],
    ['?mp=host&bots=0&delay=-3', 2, 0],
    ['?mp=client&bots=-4&delay=3', 1, 3],
    ['?mp=host&bots=bad&delay=bad', 2, 0],
    ['?mp=client&bots=3.9&delay=2.9', 3, 2],
  ])('preserves numeric defaults and bounds for %s', (search, bots, delay) => {
    expect(parseStartupOptions(search)).toMatchObject({ mpBots: bots, mpDelay: delay });
  });

  it('retains conflicting flags for the existing lobby-first startup dispatch', () => {
    expect(
      parseStartupOptions('?host=&join=room&mp=client&replay=saved&prof=remesh&norender&dbg'),
    ).toMatchObject({
      lobbyHost: true,
      lobbyJoinCode: 'room',
      lobbyActive: true,
      hostCode: '',
      mpActive: true,
      mpMode: 'client',
      replayKey: 'saved',
      profMode: true,
      profNoRender: true,
      debug: true,
    });
    expect(parseStartupOptions('?join=')).toMatchObject({ lobbyActive: true, lobbyJoinCode: '' });
  });

  it.each([
    ['?phase=', 0],
    ['?phase=NaN', 0],
    ['?phase=Infinity', 0],
    ['?phase=-0.5', -0.5],
  ])('parses phase in %s without changing its range', (search, startPhase) => {
    expect(parseStartupOptions(search).startPhase).toBe(startPhase);
  });
});
