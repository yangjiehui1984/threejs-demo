import Stats from "three/examples/jsm/libs/stats.module";
import * as THREE from 'three'

export default class Helper{
    constructor(){
    }

    private _stats;

    public init(container, scene){
        //stats
        const stats = Stats();
        stats.setMode(0);
        container.appendChild(stats.domElement);
        stats.domElement.style.position = 'absolute';
        this._stats = stats;
        const gridHelper = new THREE.GridHelper( 100, 100, 0xffffff, 0xaaaaaa);
        scene.add( gridHelper );
        const axes = new THREE.AxesHelper(10);
        scene.add(axes);
    }

    public update(){
        this._stats.update();
    }
}