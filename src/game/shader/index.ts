
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from 'three';
import Helper from "../helper";

export default class Game{
    constructor(container){
        this._container = container;
        this._init();
    }

    private _container;
    private _camera;
    private _scene;
    private _renderer;
    private _clock;
    private _helper;
    private _actions;

    private _init(){
        let width = this._container.clientWidth;
        let height = this._container.clientHeight;
        //scene
        const scene = new THREE.Scene();

        //camera
        const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000
        );
        camera.position.set(1, 1, 3);
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
        const controls = new OrbitControls(camera, renderer.domElement);

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

        this.addHelper();
        this.addGround();
        this.addLight();
        this.addModel();


        this.animate();
    }

    private addHelper() {
        const helper = new Helper();
        helper.init(this._container, this._scene);
        this._helper = helper;
    }
    
    private addModel(){
        const loader = new GLTFLoader();
        loader.load( 'models/gltf/RobotExpressive/RobotExpressive.glb', function ( gltf ) {
            this._scene.add( gltf.scene ); 
        }, undefined, function ( e ) {
            console.error( e );
        } );
    }

    private addGround(){
        const geometry = new THREE.PlaneGeometry( 100, 100 );
        const material = new THREE.MeshPhongMaterial( {color: 0x888888, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( geometry, material );
        plane.rotateX(-Math.PI * 0.5);
        plane.receiveShadow = true;
        this._scene.add( plane );
    }

    private addLight() {
        const light = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
        this._scene.add(light);

        //太阳
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        directionalLight.castShadow = true;
        this._scene.add( directionalLight );
    }

    private update(delta) {
        this._renderer.render(this._scene, this._camera);
        this._helper.update();
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this._clock.getDelta();
        this.update(delta);
    }
}