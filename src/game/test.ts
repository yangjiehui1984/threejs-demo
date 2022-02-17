import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Helper from "./helper";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Label3D from "./main/label3D";
import { BufferGeometry, TextureLoader } from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { PixelShader } from 'three/examples/jsm/shaders/PixelShader.js';

const wireframe = false;
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
    private _renderRate = 0; //渲染频率
    private _cube;
    private _sphere;
    private _raycaster = new THREE.Raycaster();
    private _curObject = null;
    private _composer;
    private _objectList = [];
    private _boxHelperList = [];
    private _curBox3 = new THREE.Box3();
    private _distBox3 = new THREE.Box3();
    private _collideFlag = false;
    private _collideObjList = [];
    private _lastObjPos = new THREE.Vector3();
    private _lastMousePos = new THREE.Vector2();

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
        camera.position.set(10, 8, 10);
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

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("three/examples/js/libs/draco/gltf/");

        this._gltfLoader = new GLTFLoader();
        this._gltfLoader.setDRACOLoader(dracoLoader);

        // this.loadModel('static/models/medieval_fantasy_book/scene.gltf');
        // this.loadModel('static/models/LittlestTokyo.glb')
        this.addlight();
        // this.addPointLight();
        this.addPlane();
        // this.addPoint();
        // this.addPoint1();
        // this.addLine();
        this.addCube();
        this.addSphere();
        this.loadModel('static/models/Soldier.glb');

        this.animate();
        this.postProcessing();

        this._container.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        });



        this.addEventListener("gameEvent", (event) => {
            if (event.value == "dispose") {
                this._scene.traverse((child) => {
                    console.log(child);
                    if (child.type.indexOf("Mesh") !== -1) {
                        child.geometry.dispose();
                        child.material.dispose();
                    }
                });
                console.log("遍历完成");
                this._scene.clear();
                renderer.dispose();
                renderer.forceContextLoss();
                cancelAnimationFrame(this._animationID);
                let gl = renderer.domElement.getContext("webgl");
                gl && gl.getExtension("WEBGL_lose_context").loseContext();
            }
        });

        renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
        renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));

        setTimeout(() => {
            this._objectList.forEach(item => {
                console.log('对象：', item)
                const boxHelper = new THREE.BoxHelper(item, 0xffffff );
                // 创建包围盒
                // const box3d = new THREE.Box3().setFromObject( item );
                this._scene.add(boxHelper);
                this._boxHelperList.push(boxHelper);

                // const box3Helper = new THREE.Box3Helper(item.geometry.boundingBox, new THREE.Color(0xffffff));
                // this._boxHelperList.push(box3Helper);

            })
        }, 1000);
    }

    private postProcessing(){
        const composer = new EffectComposer( this._renderer );
        composer.addPass( new RenderPass( this._scene, this._camera ) );
        this._composer = composer;

        const pixelPass = new ShaderPass( PixelShader );
        pixelPass.uniforms[ "resolution" ].value = new THREE.Vector2( this._container.clientWidth, this._container.clientHeight );
        pixelPass.uniforms[ "resolution" ].value.multiplyScalar( window.devicePixelRatio );
        pixelPass.uniforms[ "pixelSize" ].value = 8;
        // composer.addPass( pixelPass );
    }

    private onPointerDown(event){
        let mouse = new THREE.Vector2(0, 0);
        mouse.x = ( event.layerX  / this._container.clientWidth ) * 2 - 1;
        mouse.y = - ( event.layerY / this._container.clientHeight ) * 2 + 1;
        this._lastMousePos.copy(mouse);
        // // 通过摄像机和鼠标位置更新射线
        this._raycaster.setFromCamera( mouse, this._camera );
        const intersects = this._raycaster.intersectObjects( this._scene.children );
        for ( let i = 0; i < intersects.length; i ++ ) {
            let object: any = intersects[i].object;
            if(object.name !== 'plane' && !this._curObject && object.name.indexOf('obj') != -1){
                this._curObject = object;
            }
            else {
                
            }
        }
    }

    private onPointerMove(event){
        let mouse = new THREE.Vector2(0, 0);
        mouse.x = ( event.layerX  / this._container.clientWidth ) * 2 - 1;
        mouse.y = - ( event.layerY / this._container.clientHeight ) * 2 + 1;

        if(mouse.distanceTo(this._lastMousePos) < 0.05) return;
        this._lastMousePos.copy(mouse);
        // if(this._curObject){
        //     this._curObject
        // }

        if(this._curObject){
            // // 通过摄像机和鼠标位置更新射线
            this._raycaster.setFromCamera( mouse, this._camera );
            const intersects = this._raycaster.intersectObjects( this._scene.children );
            for ( let i = 0; i < intersects.length; i ++ ) {
                let object: any = intersects[i].object;
                if(object.name == 'plane'){
                    this._lastObjPos.copy(this._curObject.position);
                    const pos = intersects[i].point;
                    this._curObject.position.x = pos.x;
                    this._curObject.position.z = pos.z;
                    if(this._curObject.userData && this._curObject.userData.model){
                        this._curObject.userData.model.position.x = pos.x;
                        this._curObject.userData.model.position.z = pos.z;
                    }
                    this._curObject.updateMatrixWorld();
                    this.checkCollide();
                    if(this._collideFlag){
                        this._collideFlag = false;
                        console.log('归位')
                        this._curObject.position.copy(this._lastObjPos);
                        if(this._curObject.userData && this._curObject.userData.model){
                            this._curObject.userData.model.position.copy(this._lastObjPos)
                        }
                    }
                }
            }
        }
    }

    private onPointerUp(event){
        this._curObject = null;
    }

    /**
     * 加载模型
     * @param path
     */
    private loadModel(path) {
        this._gltfLoader.load(path, (gltf) => {
            let model = gltf.scene;
            model.traverse((child) => {
                if (child.type.indexOf("Mesh") != -1) {
                    // console.log(child);
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            console.log("模型已加载");
            // model.scale.set(0.5, 0.5, 0.5);
            model.rotateY(-Math.PI * 0.8)
            
            this._mixer = new THREE.AnimationMixer(model);
            this._mixer.clipAction(gltf.animations[3]).play();
            // model.name = 'obj10';

            //创建包围盒
            let geometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 32);
            let material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                opacity: 0.2,
                transparent: true
            });
            let cube = new THREE.Mesh(geometry, material);
            this._objectList.push(cube);
            cube.name = 'obj10';
            // cube.add(model);
            cube.userData = {
                model: model
            }
            this._scene.add(model);
            this._scene.add(cube);
        });
    }

    private addPlane() {
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(-Math.PI * 0.5);
        plane.receiveShadow = true;
        this._scene.add(plane);
        plane.name = 'plane';
    }

    private addPoint() {
        const vertices = [0.0, 0.0, 0.0];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        );

        const material = new THREE.PointsMaterial({ color: 0, size: 0.2 });

        const points = new THREE.Points(geometry, material);

        this._scene.add(points);
    }

    private addPoint1() {
        const vertices = [0.0, -1.0, 0.0];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        );

        const material = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 0.2,
        });

        const points = new THREE.Points(geometry, material);

        this._scene.add(points);
    }

    private addLine() {
        let material = new THREE.LineBasicMaterial({
            color: 0,
            linewidth: 10,
        });

        let points = [];
        points.push(new THREE.Vector3(1, 0, 0));
        points.push(new THREE.Vector3(1, 0.5, -1));

        let geometry = new THREE.BufferGeometry().setFromPoints(points);

        let line = new THREE.Line(geometry, material);
        this._scene.add(line);

        material = new THREE.LineBasicMaterial({
            color: 0xff0000,
            linewidth: 10,
        });

        points = [];
        points.push(new THREE.Vector3(1, -1.5, 0));
        points.push(new THREE.Vector3(1, -1, -1));

        geometry = new THREE.BufferGeometry().setFromPoints(points);

        line = new THREE.Line(geometry, material);
        this._scene.add(line);
    }

    private addCube() {
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = new THREE.MeshBasicMaterial({
            color: 0,
            wireframe: true,
        });
        let cube = new THREE.Mesh(geometry, material);
        cube.position.set(2, 0.5, 3);
        cube.name = 'obj1';
        this._objectList.push(cube)
        // cube.castShadow = true;
        this._scene.add(cube);

        // geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        cube = new THREE.Mesh(geometry, material);
        cube.position.set(2, 0.5, 0);
        cube.castShadow = true;
        cube.name = 'obj2';
        this._objectList.push(cube)
        this._scene.add(cube);

        material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load("static/textures/crate.gif"),
        });
        cube = new THREE.Mesh(geometry, material);
        cube.position.set(2, 0.5, -3);
        cube.castShadow = true;
        cube.name = 'obj3';
        this._objectList.push(cube)
        this._scene.add(cube);
        this._cube = cube;
    }

    private addSphere() {
        const geometry = new THREE.SphereGeometry(0.5, 32, 16);
        let material = new THREE.MeshBasicMaterial({
            color: 0,
            wireframe: true,
        });
        let sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(-2, 0.5, 3);
        sphere.name = 'objcircle4';
        this._objectList.push(sphere)
        // sphere.castShadow = true;
        this._scene.add(sphere);
        

        material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(-2, 0.5, 0);
        sphere.name = 'objcircle5';
        this._objectList.push(sphere)
        sphere.castShadow = true;
        this._sphere = sphere;
        this._scene.add(sphere);
        const texLoader = new TextureLoader();
        const material1 = new THREE.MeshStandardMaterial({
            color: 0x333333,
            map: texLoader.load("static/textures/1.png"),
            roughnessMap : texLoader.load("static/textures/3.png"),
            normalMap : texLoader.load("static/textures/5.png"),
            // displacementMap : texLoader.load("static/textures/7.png"),
            aoMap: texLoader.load("static/textures/9.png"),
        });
        const sphere1 = new THREE.Mesh(geometry, material1);
        sphere1.position.set(-2, 0.5, -3);
        sphere1.castShadow = true;
        sphere1.name = 'objcircle6';
        this._objectList.push(sphere1)
        this._scene.add(sphere1);
    }

    // /**
    //  * 点光源
    //  */
    // private addPointLight(){
    //     const light = new THREE.PointLight( 0xffffff, 3, 100 );
    //     light.position.set( 5, 5, 2 );
    //     light.castShadow = true;
    //     this._scene.add( light );
    // }

    /**
     * 光照
     * @param path
     */
    private addlight() {
        const light = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
        this._scene.add(light);

        //太阳
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096; // default
        directionalLight.shadow.mapSize.height = 4096; // default
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.position.set(10, 10, -10);
        this._scene.add(directionalLight);
    }

    private checkCollide(){
        this._collideFlag = false;
        if(!this._curObject) return;
        this._curBox3.copy(this._curObject.geometry.boundingBox);
        this._curBox3.applyMatrix4(this._curObject.matrixWorld);
        // console.log(this._curBox3)

        let flag = false;

        for(let i = 0; i < this._objectList.length; ++i){
            const item = this._objectList[i];
            if(item != this._curObject){
                this._distBox3.copy(item.geometry.boundingBox);
                this._distBox3.applyMatrix4(item.matrixWorld);
                if(this._curBox3.intersectsBox(this._distBox3)){
                    //碰撞了
                    flag = true;
                    console.log('碰撞了', this._curBox3, this._distBox3)
                    break;
                }
            }
        }
        this._collideFlag = flag;
        return this._collideFlag;
    }

    private update(delta) {
        this._time += delta;
        if (this._renderRate % 2 == 0) {
            // this._renderer.render(this._scene, this._camera);
            this._composer && this._composer.render();

            this._objectList.forEach(item => {
                item.geometry.computeBoundingBox();
            })

            this._boxHelperList.forEach(item => {
                item.update();
            })

            // this.checkCollide();

        }
        this._renderRate++;
        this._helper.update();
        this._mixer && this._mixer.update(delta);


        if(this._cube){
            this._cube.rotation.x += 0.01;
            this._cube.rotation.y += 0.02;
            this._cube.rotation.z += 0.01;
        }

        if(this._sphere){
            this._sphere.position.y = Math.abs(Math.sin(this._time * 5)) + 0.5;
        }
    }

    private animate() {
        this._animationID = requestAnimationFrame(this.animate.bind(this));
        const delta = this._clock.getDelta();
        this.update(delta);
    }
}
