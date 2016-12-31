/// <reference path="three.js" />

class ZUTIL { }

ZUTIL.Scene = class extends THREE.Scene {
    constructor() {
        super();
        this.update_arr = [];
        this.activeCamera = new ZUTIL.Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000, this);
        this.activeCamera.position.y = 8;
        this.activeCamera.position.x = -15;
        this.activeCamera.position.z = -15;
        this.activeCamera.lookAt(this.activeCamera.pivot.position);
    }

    update() {
        ///<summary> runs the update callbacks of ZUTIL objects attached to this scene</summary> 
        this.update_arr.forEach(function (e) { e(); });
    }
}

ZUTIL.Camera = class extends THREE.PerspectiveCamera {
    constructor(fov, aspect, near, far, scene) {
        super(fov, aspect, near, far);
        var _this = this;
        this.scene = scene;

        this.pivot = new THREE.Object3D();
        this.pivot.add(this);
        this.scene.add(this.pivot);

        this.mouseDown = false;
        this.mouseDelta = new THREE.Vector2(0,0);
        this.mousePos = new THREE.Vector2(0,0);
        this.mouseLastPos = new THREE.Vector2(0, 0);

        this.mouseDownFunc = function () { _this.mDown() };
        this.mouseUpFunc = function () { _this.mUp() };
        this.mouseMoveFunc = function (e) { _this.mMove(e) };
    }

    initMouseSpinControl() {
        var _this = this;
        
        window.addEventListener("mousedown", this.mouseDownFunc, false);
        window.addEventListener("mouseup", this.mouseUpFunc, false);
        window.addEventListener("mousemove", this.mouseMoveFunc, false);
        this.callback = function () { _this.SpinControlThink() }
        this.scene.update_arr.push(this.callback);
    }

    killMouseSpinControl() {
        window.removeEventListener("mousedown", this.mouseDownFunc);
        window.removeEventListener("mouseup", this.mouseUpFunc);
        window.removeEventListener("mousemove", this.mouseMoveFunc);
    }

    mDown() {
        this.mouseDown = true;
    }

    mUp() {
        this.mouseDown = false;
    }
    mMove(e) {
        this.mousePos.set(e.clientX, e.clientY);
    }

    SpinControlThink() {
        this.mouseDelta.subVectors(this.mouseLastPos, this.mousePos);
        this.mouseLastPos = this.mousePos.clone();

        if (this.mouseDown) {
            //turntable style camera rotation

            //rotation on world up
            var yaxis = new THREE.Vector3(0, 1, 0);
            yaxis = this.pivot.worldToLocal(yaxis);
            yaxis.normalize();

            this.pivot.rotateOnAxis(yaxis, this.mouseDelta.x / 100);

            //rotation on camera's x-axis vector at the pivot's position
            var xaxis = new THREE.Vector3(-1, 0, 0);
            xaxis = this.localToWorld(xaxis);
            xaxis.subVectors(this.position.clone().setFromMatrixPosition(this.matrixWorld), xaxis);
            xaxis = this.pivot.worldToLocal(xaxis);
            xaxis.normalize();

            this.pivot.rotateOnAxis(xaxis, this.mouseDelta.y / 100);
        }
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