/// <reference path="three.js" />

class ZUTIL { }

ZUTIL.Scene = class extends THREE.Scene {
    constructor() {
        super();
        this.update_arr = [];
        this.activeCamera = new ZUTIL.Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.activeCamera.position.y = 8;
        this.activeCamera.position.x = -15;
        this.activeCamera.position.z = -15;
        this.activeCamera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    update() {
        ///<summary> runs the update callbacks of ZUTIL objects attached to this scene</summary> 
        this.update_arr.forEach(function (e) { e(); });
    }
}

ZUTIL.Camera = class extends THREE.PerspectiveCamera {
    constructor(fov, aspect, near, far) {
        super(fov, aspect, near, far);
    }
}

ZUTIL.Vec3 = class extends THREE.Vector3{
    constructor(x, y, z){
        super(x, y, z);
    }
};

ZUTIL.SpinningCube = class extends THREE.Mesh {
    constructor(scene) {
        ///<param name="scene" type="ZUTIL.Scene">scene the cube is attaching to</param>
        var boxGeo = new THREE.BoxGeometry(1,1,1);
        var boxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        super(boxGeo, boxMat);
        var _this = this;
        this.scene = scene;
        this.scene.add(this);
        this.callback = function(){_this.think()}
        this.scene.update_arr.push(this.callback);
    }

    think() {
        this.rotation.y += 0.01;
    }

    stop() {
        for (var i = 0; i < this.scene.update_arr.length; i++){
            if (this.scene.update_arr[i] == this.callback) {
                this.scene.update_arr.splice(i, 1);
            }
        }
    }
}