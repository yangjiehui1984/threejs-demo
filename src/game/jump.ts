import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Helper from "./helper";
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

export default class Game extends THREE.EventDispatcher {
    constructor(container: Element) {
        super();
        this._container = container;
        this._init();
    }

    private _animationID;
    private _textureLoader;
    private _container;
    private _camera;
    private _scene;
    private _renderer;
    private _clock;
    private _helper;
    private _labyrinthMap;
    private _role;
    private _curObject;  //当前的对象
    private _nextObject; //目标对象
    private _curPos = new THREE.Vector3(0, 0.5, 0);
    private _nextPos = new THREE.Vector3(0, 0.5, 0);
    private _jumpPos = new THREE.Vector3(0, 0.5, 0);
    private _offsetVal = 0;  //蓄力值
    private _pointerDownFlag = false;  //是否按下
    private _speed = 8; //蓄力速度
    private _roleScale = 1.0;
    private _dir; //方向
    private _dis; //距离
    private _light; //灯光
    private _delta; //帧间隔
    private _objectList = [];
    private _gameOver = false;
    private _particles = [];
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
            1000
        );
        camera.position.set(-10, 10, 10);
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
        // renderer.toneMappingExposure = 2;
        this._container.appendChild(renderer.domElement);

        //clock
        const clock = new THREE.Clock();

        //control
        // const controls = new OrbitControls(camera, renderer.domElement);

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

        this._textureLoader = new THREE.TextureLoader();

        this.addHelper();
        this.addRole();
        this.addGround();
        this.addLight();
        this.control();
        this.restart();

        this.animate();

        this.addEventListener("gameEvent", (event) => {
            if(event.value == 'dispose'){
                this._container.removeEventListener('pointerdown', this.onPointerDown.bind(this));
                this._container.removeEventListener('pointerup', this.onPointerUp.bind(this));
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
            else if(event.value == 'restart'){
                this.restart();
            }
        });
    }

    private addHelper() {
        const helper = new Helper();
        helper.init(this._container, this._scene);
        this._helper = helper;
    }

    private control(){
        this._container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this._container.addEventListener('pointerup', this.onPointerUp.bind(this));
        this._container.addEventListener('contextmenu', function(e){
            e.preventDefault();
         });
    }

    private onPointerDown(e){
        e.preventDefault();
        if(this._gameOver) return;
        //开始蓄力
        this._pointerDownFlag = true;
        this._offsetVal = 0;
    }

    private onPointerUp(e){
        e.preventDefault();
        if(this._gameOver) return;
        this._gameOver = true;
        this._pointerDownFlag = false;
        this._roleScale = 1.0;
        this._role.scale.set(1, 1, 1);
        this._curObject.scale.set(1, 1, 1);
        this._role.position.y = 1.5;
        this._curObject.position.y = 0.5;
        //跳跃
        this.jumpAnimation();
    }

    private addLight() {
        const light = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
        this._scene.add(light);

        //太阳
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048; // default
        directionalLight.shadow.mapSize.height = 2048; // default
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.position.set(200, 200, 200);
        this._scene.add( directionalLight );
        this._light = directionalLight;
    }

    private addGround(){
        const geometry = new THREE.PlaneGeometry( 1000, 1000 );
        const material = new THREE.MeshLambertMaterial( {color: 0xaaaaaa} );
        const plane = new THREE.Mesh( geometry, material );
        plane.rotateX(-Math.PI * 0.5);
        plane.receiveShadow = true;
        this._scene.add( plane );
    }

    private restart(){
        for(let i = this._objectList.length - 1; i >= 0; i--){
            this._scene.remove(this._objectList[i])
        }
        this._objectList = [];

        this._role.position.set(0, 1.5, 0);
        this._role.rotation.set(0, 0, 0);
        this._curPos = new THREE.Vector3(0, 0.5, 0);
        this._camera.position.set(-10, 10, 10);
        this._light.position.set(200, 200, 200);

        //添加一个起点位置
        const geometry2 = new THREE.BoxGeometry( 2, 1, 2 );
        const material2 = new THREE.MeshLambertMaterial( {color: 0x888888} );
        const cube = new THREE.Mesh( geometry2, material2 );
        this._scene.add( cube );
        cube.position.copy(this._curPos);
        cube.castShadow = true;
        cube.receiveShadow = true;
        this._curObject = cube;
        this._objectList.push(cube);


        this.addObject();
        this._gameOver = false;
    }

    /**
     * 主角，由一个球和一个圆锥组成
     */
    private addRole(){
        const group = new THREE.Group();

        let material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
        //球
        const geometry = new THREE.SphereGeometry( 0.2, 16, 16 );
        const sphere = new THREE.Mesh( geometry, material );
        group.add( sphere );
        sphere.position.set(0, 0.4, 0);
        sphere.castShadow = true;

        //圆锥
        const geometry1 = new THREE.ConeGeometry( 0.3, 0.6, 16 );
        const cone = new THREE.Mesh( geometry1, material );
        group.add( cone );
        cone.castShadow = true;

        this._scene.add(group);
        this._role = group;
    }

    /**
     * 跳跃动画
     */
    private jumpAnimation(){
        if(this._offsetVal < 1.5){
            this._offsetVal = 1.3;
        }
        this._jumpPos.copy(this._curPos);
        if(this._dir == 'x'){
            this._jumpPos.x += this._offsetVal;
        }
        else{
            this._jumpPos.z -= this._offsetVal;
        }

        let offsetTime = 0;
        new TWEEN.Tween( this._role.position ).to( {
            x: this._jumpPos.x,
            z: this._jumpPos.z
        }, 500)
        .onUpdate((e, a)=>{
            offsetTime += this._delta * 1000;
            this._role.position.y = 1.5 + 2 * Math.sin(Math.PI * offsetTime/ 500);
            if(this._dir == 'x'){
                this._role.rotation.z = -Math.PI * 2 * offsetTime / 500;
            }
            else{
                this._role.rotation.x = -Math.PI * 2 * offsetTime / 500;
            }
        })
        .onComplete(()=>{
            this._role.rotation.set(0, 0, 0);
            this._role.position.y = 1.5;
            this.checkLogic();
        })
        // .easing( TWEEN.Easing.Quadratic.In )
        .start();

        // new TWEEN.Tween(this._role.rotation).to({
        //     [this._dir]: Math.PI * 2
        // }, 450)
        // .onComplete(()=>{
        //     this._role.rotation[this._dir] = 0;
        // })
        // .easing( TWEEN.Easing.Quadratic.In )
        // .start();


    }  

    private particles(cur, next){
        // console.log(next)
        const tex = this._textureLoader.load('static/textures/circle.png')
        const geometry = new THREE.BufferGeometry();
        const vertices = [0, 0, 0];
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        const point = new THREE.Points( geometry, new THREE.PointsMaterial( { size: Math.random() * 0.1 + 0.1, color: Math.random() * 0xffffff , map: tex, transparent: true} ) );
        point.position.set(cur.x + Math.random() * 2 - 1, cur.y + Math.random() + 0.5, cur.z + Math.random() * 2 - 1)
        this._particles.push(point);
        this._scene.add(point);
        new TWEEN.Tween(point.position).to({
            x: next.x,
            y: next.y - 0.5,
            z: next.z
        }, 300)
        .onComplete(()=>{
            this._scene.remove(point);
        })
        .start()
        return point;
    }

    /**
     * 判断是否正确
     */
    private checkLogic(){
        if(this._jumpPos.distanceTo(this._nextPos) > 1.5){
            this.dispatchEvent( { type: 'gameEvent', value: 'gameover'} );
            new TWEEN.Tween(this._role.position).to({
                y: 0.5
            }, 20)
            .start();
        }
        else if(this._jumpPos.distanceTo(this._nextPos) > 0.8){
            this.dispatchEvent( { type: 'gameEvent', value: 'gameover'} );
            //失败
            if(this._dir == 'x'){
                if(this._jumpPos.x < this._nextPos.x){
                    new TWEEN.Tween(this._role.rotation).to({
                        z: Math.PI * 0.5
                    }, 100)
                    .start();
                    this._role.position.x -= 0.5;
                }
                else{
                    new TWEEN.Tween(this._role.rotation).to({
                        z: -Math.PI * 0.5
                    }, 100)
                    .start();
                    this._role.position.x += 0.5;
                }   
            }
            else{
                if(this._jumpPos.z < this._nextPos.z){
                    new TWEEN.Tween(this._role.rotation).to({
                        x: -Math.PI * 0.5
                    }, 100)
                    .start();
                    this._role.position.z -= 0.5;
                }
                else{
                    new TWEEN.Tween(this._role.rotation).to({
                        x: Math.PI * 0.5
                    }, 100)
                    .start();
                    this._role.position.z += 0.5;
                }   
            }

            new TWEEN.Tween(this._role.position).to({
                y: 0.2
            }, 100)
            .start();
        }
        else {
            this.dispatchEvent( { type: 'gameEvent', value: 'addScore'} );
            this._gameOver = false;
            if(this._dir == 'x'){
                new TWEEN.Tween(this._camera.position).to({
                    x: this._camera.position.x + this._dis
                }, 200)
                .start();
                new TWEEN.Tween(this._light.position).to({
                    x: this._light.position.x + this._dis
                }, 200)
                .start();
            }
            else{
                new TWEEN.Tween(this._camera.position).to({
                    z: this._camera.position.z - this._dis
                }, 200)
                .start();
                new TWEEN.Tween(this._light.position).to({
                    z: this._light.position.z - this._dis
                }, 200)
                .start();
            }
            this._curPos.copy(this._nextPos);
            this._curObject = this._nextObject;
            this.addObject();
        }
    }

    /**
     * 蓄力
     */
    private preJump(delta){
        if(Math.floor(Math.random() * 10) % 4 == 0){
            this.particles(this._role.position, this._role.position);
        }
        
        this._offsetVal += this._speed * delta;
        this._role.scale.set(1, this._roleScale, 1);
        this._curObject.scale.set(1, this._roleScale, 1);
        this._role.position.y = 1.5 - (1 - this._roleScale) * 2;
        this._curObject.position.y = 0.5 - (1 - this._roleScale);
        this._roleScale -= 0.01;
        if(this._roleScale < 0.7){
            this._roleScale = 0.7;
        }
    }

    /**
     * 添加平台
     */
    private addObject(){
        //随机一个方向和距离
        const dis = this._dis = Math.ceil(Math.random() * 4 + 2);
        let pos;
        if(dis % 2){
           pos =  new Vector3(this._curPos.x + dis, this._curPos.y, this._curPos.z);
           this._dir = 'x';
        }
        else{
            pos = new Vector3(this._curPos.x, this._curPos.y, this._curPos.z - dis);
            this._dir = 'z';
        }
        this._nextPos = pos;
        const rand = Math.floor(Math.random() * 10);
        if(rand % 2 == 0){
            const geometry = new THREE.BoxGeometry( 2, 1, 2 );
            const material = new THREE.MeshLambertMaterial( {color: Math.random() * 0xffffff} );
            const cube = new THREE.Mesh( geometry, material );
            this._scene.add( cube );
            cube.position.set(pos.x, 0.5, pos.z);
            this._nextObject = cube;
        }
        else{
            const geometry = new THREE.CylinderGeometry( 1, 1, 1, 16 );
            const material = new THREE.MeshLambertMaterial( {color: Math.random() * 0xffff00} );
            const cylinder = new THREE.Mesh( geometry, material );
            this._scene.add( cylinder );
            cylinder.position.set(pos.x, 0.5, pos.z);
            this._nextObject = cylinder;
        }

        this._nextObject.castShadow = true;
        this._nextObject.receiveShadow = true;
        this._objectList.push(this._nextObject);
        if(this._objectList.length > 5){
            const obj = this._objectList.shift();
            obj.geometry.dispose();
            obj.material.dispose();
            this._scene.remove(obj);
        }
    }

    private update(delta) {
        this._renderer.render(this._scene, this._camera);
        this._helper.update();
        TWEEN.update();

        if(this._pointerDownFlag){
            this.preJump(delta);
        }
    }

    private animate() {
        this._animationID = requestAnimationFrame(this.animate.bind(this));
        const delta = this._delta = this._clock.getDelta();
        this.update(delta);
    }
}
