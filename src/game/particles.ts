import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Helper from "./helper";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Label3D from "./main/label3D";
import { BufferGeometry } from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { FocusShader } from 'three/examples/jsm/shaders/FocusShader.js';

export default class Game extends THREE.EventDispatcher {
    constructor(container: Element) {
        super();
        this._container = container;
        this._init();
    }

    private _countdown = false;
    private _particleCount = 0;
    private _container;
    private _camera;
    private _scene;
    private _renderer;
    private _clock;
    private _helper;
    private _time = 0;
    private _bufArrays = []; //模型顶点数组，存储几个模型的顶点
    private _geometry = new THREE.BufferGeometry();
    private _tweenList = []; //每个点的缓动
    private _vertices = []; //所有的点
    private _points;
    private _current = 0; //当前模型索引
    private _material; //材质
    private _composer;  //后处理混合器
    private _animationID;
    private _gltfLoader;
    private _renderRate = 0;  //渲染频率

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
        camera.position.set(0, 0, 6);
        camera.lookAt(scene.position);

        //render
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setClearColor(0);
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

        this.loadModels();

        const composer = new EffectComposer( renderer );
        const renderModel = new RenderPass( scene, camera );
        const bloomPass = new UnrealBloomPass( new THREE.Vector2( width, height), 1.5, 0.4, 0.85 );
        bloomPass.threshold = 0;
        bloomPass.strength = 1;
        bloomPass.radius = 1;
        const effectFilm = new FilmPass( 0.5, 0.5, 1448 );

        const effectFocus = new ShaderPass( FocusShader );

        effectFocus.uniforms[ "screenWidth" ].value = window.innerWidth * window.devicePixelRatio;
        effectFocus.uniforms[ "screenHeight" ].value = window.innerHeight * window.devicePixelRatio;

        composer.addPass( renderModel );
        composer.addPass( bloomPass );
        // composer.addPass( effectFilm );
        composer.addPass( effectFocus );

        this._composer = composer;

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
     * 初始化point
     */
    private initPoints() {
        for (let i = 0; i < this._particleCount; i++) {
            let position = THREE.MathUtils.randFloat(-4, 4);
            let color = 0xffffff;
            this._tweenList.push(
                new TWEEN.Tween({ position, color }).easing(
                    TWEEN.Easing.Exponential.In
                )
            );
            this._vertices.push(position);
        }

        this._geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(new Float32Array(this._vertices), 3)
        );

        const material = new THREE.PointsMaterial({
            size: 0.05,
            color: 0xffffff,
            map: new THREE.TextureLoader().load("static/textures/circle.png"),
            alphaTest: 0.1,
            opacity: 1,
            transparent: true,
            depthTest: true,
        });

        this._points = new THREE.Points(this._geometry, material);

        this._material = material;

        this._scene.add(this._points);
    }

    /**
     * 加载模型
     */
    private loadModels() {
        const manager = new THREE.LoadingManager();

        manager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log("onStart");
        };

        manager.onLoad = () => {
            console.log("onLoad");
            console.log(this._bufArrays);

            this._bufArrays.forEach((item) => {
                this._particleCount = Math.max(
                    item.length,
                    this._particleCount
                );
            });
            this.initPoints();
            // this.countdown(0);
            setTimeout(() => {
                this.transition();
            }, 2000);
        };

        manager.onError = (url) => {
            console.log(url);
        };

        this._gltfLoader = new GLTFLoader(manager);
        
        this.loadModel('static/models/sphere.glb');
        // this.loadModel('static/models/Flower.glb', 1);
        this.loadModel('static/models/box.glb');
        this.loadModel('static/models/box1.glb');
        // this.loadModel('static/models/Nefertiti.glb');
        
    }

    /**
     * 加载模型
     * @param path
     */
    private loadModel(path, scale = 1.0){
        this._gltfLoader.load(path, (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.type.indexOf("Mesh") != -1) {
                    (child as THREE.Mesh).geometry.translate(1, 0, 0);
                    const { array } = (child as THREE.Mesh).geometry.attributes
                        .position;
                    const points = [];
                    for(let i = 0; i < array.length; ++i){
                        points.push(array[i] * scale);
                    }
                    this._bufArrays.push(points);
                }
            });
        });
    }

    /**
     * 粒子变换
     */
    private transition() {
        const nextColor = THREE.MathUtils.randInt(0xff0000, 0xffffff);
        for (let i = 0, j = 0; i < this._particleCount; i++, j++) {
            const item = this._tweenList[i];
            if (j >= this._bufArrays[this._current].length) {
                j = 0;
            }

            //tween变换
            item.to(
                {
                    position: this._bufArrays[this._current][j],
                    color: nextColor,
                },
                THREE.MathUtils.randFloat(1000, 4000)
            )
                .onUpdate((obj) => {
                    (this._geometry.attributes.position as any).array[i] =
                        obj.position; //获取mesh中的所有顶点
                    this._geometry.attributes.position.needsUpdate = true;
                    // this._material.color = nextColor
                })
                .onComplete(() => {
                    this._material.color.set(nextColor).convertSRGBToLinear();
                    this._material.needsUpdate = true;
                })
                .start();
        }

        //每6s变换一次
        setTimeout(() => {
            this.transition();
        }, 6000);
        this._current = (this._current + 1) % 3;
    }

    private update(delta) {
        this._time += delta;
        //每两帧绘制一次
        if(this._renderRate % 2 == 0){
            this._composer.render();
        }
        
        this._renderRate++;
        this._helper.update();
        // this._renderer.render(this._scene, this._camera);
        
        if(this._points){
            this._points.rotation.x += 0.003;
            this._points.rotation.y += 0.001;
            this._points.rotation.z += 0.002;
        }
        TWEEN.update();
    }

    private animate() {
        this._animationID = requestAnimationFrame(this.animate.bind(this));
        const delta = this._clock.getDelta();
        this.update(delta);
    }
}
