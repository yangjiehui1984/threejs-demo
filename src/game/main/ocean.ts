import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import BaseObject from "./base";

export default class Ocean extends BaseObject {
    constructor() {
        super()
    }

    private _water;

    public init(scene, renderer) {
        super.init(scene, renderer);
        //定义海洋平面
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
        const water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                "static/demo/textures/waternormals.jpg",
                (texture) => {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //重复采样
                }
            ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xcccccc, //太阳光颜色
            waterColor: 0x001e0f, //水面颜色
            distortionScale: 3.7, //扭曲度
            fog: scene.fog !== undefined, //雾
        });
        water.rotation.x = -Math.PI * 0.5;
        scene.add(water);
        this._water = water;
    }

    /**
     * 设置uniforms
     */
    public setUniforms(props: any) {
        for (let key in props) {
            this._water.material.uniforms[key].value = props[key];
        }
    }

    public dispose(){
        this._water.geometry.dispose();
        this._water.material.dispose();
        this._water.paprent = null;
    }
}
