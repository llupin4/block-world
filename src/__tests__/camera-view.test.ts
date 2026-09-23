import { describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera } from 'three';
import { Sim, IdleController } from '../entity';
import { World } from '../world';
import { AIR_FOV, CameraView } from '../rendering/camera-view';

describe('camera view', () => {
  it('uses the viewed entity eye and look for local play', () => {
    const camera = new PerspectiveCamera(AIR_FOV);
    const view = new CameraView(camera);
    const sim = new Sim(new World(), {}, 1);
    const entity = sim.spawn({ x: 2, y: 3, z: 4 }, new IdleController(), { kindId: 'deer' });
    entity.yaw = 0.8;
    entity.pitch = 0.2;
    view.syncPose(entity, null);
    expect(camera.position.toArray()).toEqual([2, 3 + entity.kind.eye, 4]);
    expect(camera.rotation.order).toBe('YXZ');
    expect(camera.rotation.y).toBe(0.8);
    expect(camera.rotation.x).toBe(0.2);
    view.syncPose(undefined, null);
    expect(camera.position.x).toBe(2);
  });

  it('smooths only the client own-body position while keeping client look immediate', () => {
    const camera = new PerspectiveCamera(AIR_FOV);
    const view = new CameraView(camera);
    const sim = new Sim(new World(), {}, 1);
    const entity = sim.spawn({ x: 2, y: 3, z: 4 }, new IdleController());
    const client = {
      entityId: entity.id,
      displayPosition: { x: 8, y: 9, z: 10 },
      look: { yaw: 1, pitch: 0.3 },
    };
    view.syncPose(entity, client);
    expect(camera.position.toArray()).toEqual([8, 9 + entity.kind.eye, 10]);
    expect(camera.rotation.y).toBe(1);
    view.syncPose(entity, { ...client, entityId: -1 });
    expect(camera.position.x).toBe(2);
    expect(camera.rotation.x).toBe(0.3);
    view.syncPose(entity, { ...client, displayPosition: null });
    expect(camera.position.x).toBe(2);
  });

  it('updates projection only when entering or leaving water', () => {
    const camera = new PerspectiveCamera(AIR_FOV);
    const view = new CameraView(camera);
    const update = vi.spyOn(camera, 'updateProjectionMatrix');
    view.syncWater(false);
    expect(update).not.toHaveBeenCalled();
    view.syncWater(true);
    expect(view.mood).toBe('water');
    expect(camera.fov).toBe(62);
    view.syncWater(true);
    expect(update).toHaveBeenCalledTimes(1);
    view.syncWater(false);
    expect(view.mood).toBe('air');
    expect(camera.fov).toBe(AIR_FOV);
    expect(update).toHaveBeenCalledTimes(2);
  });
});
