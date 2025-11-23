declare const __DEV_TOOLS__: boolean;

declare module 'three/examples/jsm/loaders/FBXLoader' {
  import { Loader, LoadingManager, Object3D } from 'three';

  export class FBXLoader extends Loader {
    constructor(manager?: LoadingManager);
    loadAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void): Promise<Object3D>;
  }
}
