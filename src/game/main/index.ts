import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Helper from "../helper";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Ocean from "./ocean";
import  ShaderSky  from "./sky";
import Label3D from "./label3D";
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import Menu from "./menu";
import { LinearFilter } from "three";

export default class Game extends THREE.EventDispatcher {
    constructor(container: Element) {
        super()
        this._container = container;
        this._init();
    }

    private _animationID;
    private _container;
    private _camera;
    private _scene;
    private _renderer;
    private _clock;
    private _helper;
    private _ocean;
    private _sky;
    private _time = -10;
    private _menu;
    private _label3D;
    private _renderRate = 0;

    /**
     * 初始化
     */
    private _init() {
        let width = this._container.clientWidth;
        let height = this._container.clientHeight;
        //scene
        const scene = new THREE.Scene();

        //camera
        const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            10000
        );
        camera.position.set(30, 30, 100);
        camera.lookAt(scene.position);

        //render
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setClearColor(0xffffff);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        this._container.appendChild(renderer.domElement);

        //clock
        const clock = new THREE.Clock();

        //control
        // const controls = new OrbitControls(camera, renderer.domElement);

        //helper
        const helper = new Helper();
        helper.init(this._container, scene);
        

        //resize
        window.addEventListener("resize", () => {
            width = this._container.clientWidth;
            height = this._container.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

        this._camera = camera;
        this._scene = scene;
        this._renderer = renderer;
        this._clock = clock;
        this._helper = helper;

        this.addOcean();
        this.addSky();
        this.addLabel();
        this.addMenu();
        this.animate();

        this.addEventListener("gameEvent", (event) => {
            if(event.value == 'dispose'){
                this,this._menu.dispose();
                this._scene.traverse((child)=>{
                    console.log(child)
                    if(child.type.indexOf('Mesh') !== -1){
                        child.geometry.dispose();
                        child.material.dispose();
                    }
                })
                console.log('遍历完成')
                this._scene.clear();
                renderer.dispose();
                renderer.forceContextLoss();
                cancelAnimationFrame(this._animationID)
                let gl = renderer.domElement.getContext("webgl");
                gl && gl.getExtension("WEBGL_lose_context").loseContext();
            }
        });
    }

    /**
     * 添加填空+太阳
     */
    private addSky(){
        const sky = new ShaderSky();
        sky.init(this._scene, this._renderer);
        this._sky = sky;
    }

    /**
     * 添加海洋
     */
    private addOcean(){
        const ocean = new Ocean();
        ocean.init(this._scene, this._renderer);
        this._ocean = ocean;
    }

    /**
     * 添加3Dlabel
     */
    private addLabel(){
        const label3D = new Label3D();
        this._label3D = label3D;
        label3D.init(this._scene, this._renderer, 'Three.js');
        label3D.setPosition(-20, 20, 0);
    }

    private addMenu(){
        const menu = new Menu();
        menu.init(this._scene, this._renderer, this._container, this._camera, this);
        this._menu = menu;
    }

    private update(delta) {
        this._time += delta;
        if(this._renderRate % 2 == 0){
            this._renderer.render(this._scene, this._camera);
            if(this._sky &&  this._ocean){
                this._sky.updateSun(this._time * 0.1, 180 - this._time * 0.1);
                let sunDirection = this._sky.sun.normalize()
    
                //设置海洋的time
                this._ocean.setUniforms({
                    time: this._time,
                    sunDirection
                })
        
                this._scene.environment = this._sky.environment;
            }
        }
        this._renderRate++;
        this._menu && this._menu.update(delta);
        this._helper.update();
    }

    private animate() {
        this._animationID = requestAnimationFrame(this.animate.bind(this));
        const delta = this._clock.getDelta();
        this.update(delta);
    }
}
