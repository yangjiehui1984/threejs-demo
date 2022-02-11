import * as THREE from "three";
import Base from "./base";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
const loader = new FontLoader();

export default class Label3D extends Base {
    constructor() {
        super();
    }

    /**
     * 创建3Dlabel的几何属性
     * @param text 
     * @returns 
     */
    public static createLabelGeometry(text, size) {
        return new Promise((resolve) => {
            loader.load(
                "static/demo/fonts/helvetiker_bold.typeface.json",
                (font) => {
                    const geometry = new TextGeometry(text, {
                        font: font,
                        size: size,
                        height: size / 10,
                    });
                    resolve(geometry);
                }
            );
        });
    }

    public init(scene, renderer, text) {
        super.init(scene, renderer);
        loader.load(
            "static/demo/fonts/helvetiker_bold.typeface.json",
            (font) => {
                const geometry = new TextGeometry(text, {
                    font: font,
                    size: 10,
                    height: 10,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.02,
                    bevelSize: 0.01,
                    bevelOffset: 0,
                    bevelSegments: 5,
                });

                const material = new THREE.MeshStandardMaterial({
                    color: 0x99ff99,
                });

                const label = new THREE.Mesh(geometry, material);
                scene.add(label);
                this.object = label;
            }
        );
    }
}
