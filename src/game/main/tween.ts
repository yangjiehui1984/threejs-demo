
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

export default class Tween{
    constructor(){

    }

    private static _ins = null;

    public get instance(){
        if(!Tween._ins){
            Tween._ins = new Tween();
        }
        return Tween._ins
    }

    public update(){
        
    }
}