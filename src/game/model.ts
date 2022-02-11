import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Helper from "./helper";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Label3D from "./main/label3D";
import { BufferGeometry } from "three";


export default class Game extends THREE.EventDispatcher {
    constructor(container: Element) {
        super();
        this._container = container;
        this._init();
    }

    private _container;
    private _camera;
    private _scene;
    private _renderer;
    private _clock;
    private _helper;
    private _time = 0;
    private _animationID;
    private _gltfLoader;
    private _mixer;

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
        camera.position.set(0, 3, 5);
        camera.lookAt(scene.position);

        //render
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setClearColor(0x83dfee);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        this._container.appendChild(renderer.domElement);

        //clock
        const clock = new THREE.Clock();

        //control
        const controls = new OrbitControls(camera, renderer.domElement);

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

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/gltf/' );

        this._gltfLoader = new GLTFLoader();
        this._gltfLoader.setDRACOLoader( dracoLoader );

        this.loadModel('static/models/medieval_fantasy_book/scene.gltf');
        // this.loadModel('static/models/LittlestTokyo.glb')
        this.addlight();

        this.animate();

        this.addEventListener("gameEvent", (event) => {
            if(event.value == 'dispose'){
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
                cancelAnimationFrame(this._animationID);
                let gl = renderer.domElement.getContext("webgl");
                gl && gl.getExtension("WEBGL_lose_context").loseContext();
            }
        });
    }

    /**
     * 光照
     * @param path 
     */
    private addlight(){
        const light = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
        this._scene.add(light);

        //太阳
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLight.castShadow = true;
        // directionalLight.shadow.mapSize.width = 2048; // default
        // directionalLight.shadow.mapSize.height = 2048; // default
        // directionalLight.shadow.camera.top = 50;
        // directionalLight.shadow.camera.bottom = -50;
        // directionalLight.shadow.camera.left = -50;
        // directionalLight.shadow.camera.right = 50;
        directionalLight.position.set(10, 10, 10);
        this._scene.add( directionalLight );
    }

    /**
     * 加载模型
     * @param path
     */
    private loadModel(path){
        this._gltfLoader.load(path, (gltf) => {
            let model = gltf.scene;
            model.traverse((child) => {
                // if (child.type.indexOf("Mesh") != -1) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                // }
            });
            
            console.log('模型已加载')
            model.scale.set(0.1, 0.1, 0.1);
            this._scene.add(model);

            this._mixer = new THREE.AnimationMixer( model );
            this._mixer.clipAction( gltf.animations[ 0 ] ).play();
        });
    }


    private update(delta) {
        this._time += delta;
        this._renderer.render(this._scene, this._camera);
        this._helper.update();
        this._mixer && this._mixer.update( delta );
    }

    private animate() {
        this._animationID = requestAnimationFrame(this.animate.bind(this));
        const delta = this._clock.getDelta();
        this.update(delta);
    }
}
