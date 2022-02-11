import {Water} from 'three/examples/jsm/objects/Water2.js';
import * as THREE from "three";
export default class WaterPlane{
    constructor(){

    }

    public init(scene){
        const geometry = new THREE.PlaneGeometry(3.7, 3);
        // const material = new THREE.MeshPhongMaterial( {color: 0x888888, side: THREE.DoubleSide} );
        // const plane = new THREE.Mesh( geometry, material );
        // plane.rotateX(-Math.PI * 0.5);
        // scene.add( plane );



        const flowMap = new THREE.TextureLoader().load('textures/water/Water_1_M_Flow.jpg');
        const normalMap0 = new THREE.TextureLoader().load('textures/water/Water_1_M_Normal.jpg');
        const normalMap1 = new THREE.TextureLoader().load('textures/water/Water_2_M_Normal.jpg');
        const water = new Water(geometry, {
            scale: 1,
            textureHeight: 1024,
            textureWidth: 1024,
            flowMap,
            normalMap0,
            normalMap1,
            flowSpeed: 0.02,
            color: 0x164b6c
        });

        water.rotation.x = -Math.PI * 0.5;
        water.position.set(0.15, 0.02, -0.1);
        scene.add(water);
    }
}