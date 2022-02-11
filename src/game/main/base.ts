import * as  THREE from "three";

export default class BaseObject{
    constructor(){

    }

    protected _object;  //实体对象object3D
    private _position;  //坐标

    protected set object(value){
        this._object = value;
        if(this._position){
            this._object.position.copy(this._position);
        }
    }

    public init(scene, renderer, ...args){

    }

    /**
     * 设置物体坐标
     * @param pos 
     */
    public setPosition(x,y,z){
        if(this._object){
            this._object.position.set(x, y, z);
        }
        else{
            this._position = new THREE.Vector3(x,y,z);
        }
    }
}