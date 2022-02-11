import * as THREE from 'three';
import BaseObject from './base';

export default class Menu extends BaseObject{
    constructor(){
        super()
    }

    private _cubeList= [];
    private _time = 0;
    private _raycaster = new THREE.Raycaster();
    private game;
    private container;
    private camera;
    private scene;
    private renderer;
    private quitFlag = false;

    public init(scene: any, renderer: any, container, camera, game): void {
        super.init(scene, renderer);

        const texture = this.initVideo();
        this.initCube(scene, [0, 0, 0], 'jump', texture);
        this.initPoints(scene, [-5, 0, 40], 'particles');
        this.initCube(scene, [30, 0, 20], 'model');
    
        this.game = game;
        this.container = container;
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this))
    }

    private onPointerDown(event){
        let mouse = new THREE.Vector2(0, 0);
        mouse.x = ( event.layerX  / this.container.clientWidth ) * 2 - 1;
        mouse.y = - ( event.layerY / this.container.clientHeight ) * 2 + 1;
        // // 通过摄像机和鼠标位置更新射线
        this._raycaster.setFromCamera( mouse, this.camera );
        const intersects = this._raycaster.intersectObjects( this.scene.children );
        for ( let i = 0; i < intersects.length; i ++ ) {
            let object: any = intersects[i].object;
            switch(object.name){
                case 'jump':{
                    //跳一跳
                    if(!this.quitFlag){
                        this.quitFlag = true;
                        setTimeout(() => {
                            this.game.dispatchEvent( { type: 'gameEvent', value: 'gotoJump'} );
                        }, 500);
                    }
                    break;
                }
                case 'particles':{
                    
                    if(!this.quitFlag){
                        this.quitFlag = true;
                        setTimeout(() => {
                            this.game.dispatchEvent( { type: 'gameEvent', value: 'gotoParticles'} );
                        }, 500);
                    }

                    break;
                }
                case 'model':{
                    this.quitFlag = true;
                    setTimeout(() => {
                        this.game.dispatchEvent( { type: 'gameEvent', value: 'gotoModel'} );
                    }, 500);
                    break;
                }
                default:
                    break;
            }
        }
    }

    /**
     * 初始化视频，返回视频纹理
     * @returns 
     */
    public initVideo(){
        const video = document.querySelector('video');
        video.play();
        const texture = new THREE.VideoTexture( video );
        texture.wrapS = texture.wrapS = THREE.ClampToEdgeWrapping;
        return texture;
    }

    /**
     * 生成一个点阵
     * @param scene 
     * @param pos 
     * @param name 
     * @param map 
     */
    public initPoints(scene, pos, name, map = null){
        const geometry = new THREE.OctahedronGeometry( 5, 12 );
        const material = new THREE.PointsMaterial( { size: 0.2, color: 0xff0000} );

        const points = new THREE.Points( geometry, material );
        points.name = name;
        scene.add( points );

        points.position.set(pos[0], pos[1], pos[2]);
        this._cubeList.push(points);
    }

    /**
     * 生成一个cube
     * @param scene 
     * @param pos 
     * @param name 
     * @param map 
     */
    public initCube(scene, pos, name, map = null){
        const size = Math.random() * 5 + 10;
        const geometry = new THREE.BoxGeometry( size, size, size );
        const material = new THREE.MeshStandardMaterial( { roughness: 10 , color: map ? 0xffffff : Math.random() * 0xffffff, map: map} );

        const cube = new THREE.Mesh( geometry, material );
        cube.name = name;
        scene.add( cube );

        cube.position.set(pos[0], pos[1], pos[2]);
        this._cubeList.push(cube);
        
    }

    public update(delta){
        this._time += delta;

        for(let i = 0; i < this._cubeList.length; ++i){
            this._cubeList[i].position.y = 3 * Math.sin(this._time * 2 + i);
        }

        this._cubeList[0].rotation.x = this._time * 0.1;
        this._cubeList[0].rotation.y = this._time * 0.05;
        this._cubeList[0].rotation.z = this._time * 0.08;
        this._cubeList[1].rotation.x = this._time * 0.3;
    }

    public dispose(){
        this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown.bind(this))
    }
}