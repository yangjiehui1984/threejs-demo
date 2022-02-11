import * as THREE from "three";
import { PMREMGenerator } from "three";
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import BaseObject from "./base";

export default class ShaderSky extends BaseObject{
    constructor(){
        super()
    }

    private _sky;
    private _sun = new THREE.Vector3();//太阳方向
    private _pmremGenerator;  //环境纹理生成器
    private _environment;  //生成的环境贴图
    private _scene;

    /**
     * 太阳，海洋需要太阳的位置
     */
    public get sun(){
        return this._sun;
    }

    /**
     * 环境贴图
     */
    public get environment(){
        return this._environment;
    }

    public init(scene, renderer){
        super.init(scene, renderer);
        this._scene = scene;
        const sky = new Sky();
        sky.scale.setScalar(10000);
        scene.add(sky);
        this._sky = sky;

        const skyUniforms = sky.material.uniforms;
        skyUniforms[ 'turbidity' ].value = 1;  
        skyUniforms[ 'rayleigh' ].value = 2;
        skyUniforms[ 'mieCoefficient' ].value = 0.001;
        skyUniforms[ 'mieDirectionalG' ].value = 0.8;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        this._pmremGenerator = pmremGenerator;
    }

    /**
     * 更新太阳
     * @param elevation 仰角
     * @param azimuth  方位角
     */
    public updateSun(elevation, azimuth){
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        this._sun.setFromSphericalCoords(1, phi, theta);
        this._sky.material.uniforms['sunPosition'].value.copy(this._sun);
        this._environment = this._pmremGenerator.fromScene(this._sky).texture;
    }

    public dispose(){
        this._sky.geometry.dispose();
        this._sky.material.dispose();
        this._sky.parent = null;
    }
}