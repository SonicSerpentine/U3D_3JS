﻿/// <reference path="three.js" />

class ZUTIL { }

ZUTIL.Scene = class extends THREE.Scene {
    constructor() {
        super();
        this.update_arr = [];
        this.update_arr.remove = this._remove_callback;
    }

    update() {
        ///<summary> runs the update callbacks of ZUTIL objects attached to this scene</summary> 
        this.update_arr.forEach(function (e) { e(); });
    }

    _remove_callback(callback) {
        var _this = this;
        for (var i = 0; i < _this.length; i++){
            if (_this[i] == callback)
                _this.splice(i, 1);
        }
    }
}

ZUTIL.Camera = class extends THREE.PerspectiveCamera {
    constructor(fov, aspect, near, far, scene) {
        super(fov, aspect, near, far);
        var _this = this;
        this.scene = scene;

        this.pivot = new THREE.Object3D();
        this.pivot.add(this);
        this.axisHelper = new THREE.AxisHelper(0.5);

        this.position.set(-3, 3, -3);
        this.lookAt(this.pivot.position);

        this.scene.add(this.axisHelper);
        this.scene.add(this.pivot);

        this.mouseDown = false;
        this.ctrlDown = false;
        this.mEventFunc = function (e) { _this.mEvent(e) };

        this.mouseDelta = new THREE.Vector2(0, 0);
        this.mousePos = new THREE.Vector2(0,0);
        this.mouseLastPos = new THREE.Vector2(0, 0);
    }

    initMouseSpinControl() {
        var _this = this;
        
        window.addEventListener("mousedown", this.mEventFunc, false);
        window.addEventListener("mouseup",   this.mEventFunc, false);
        window.addEventListener("mousemove", this.mEventFunc, false);
        this.callback = function () { _this.mDeltaUpdate(); _this.SpinControlThink(); }
        this.scene.update_arr.push(this.callback);
    }

    initPanSpinControl() {
        var _this = this;

        window.addEventListener("mousedown", this.mEventFunc, false);
        window.addEventListener("mouseup", this.mEventFunc, false);
        window.addEventListener("mousemove", this.mEventFunc, false);
        this.callback = function () { _this.mDeltaUpdate(); _this.PanSpinControlThink(); }
        this.scene.update_arr.push(this.callback);
    }

    kill_controls() {
        window.removeEventListener("mousedown", this.mEventFunc);
        window.removeEventListener("mouseup", this.mEventFunc);
        window.removeEventListener("mousemove", this.mEventFunc);
        this.scene.update_arr.remove(this.callback);
    }

    mEvent(event) {
        if (event.type == "mousedown") {
            this.mouseDown = true;
            this.ctrlDown = event.ctrlKey;
        }

        if (event.type == "mouseup") {
            this.mouseDown = false;
            this.ctrlDown = false;
        }

        if (event.type == "mousemove") {
            this.mousePos.set(event.clientX, event.clientY);
            this.ctrlDown = event.ctrlKey;
        }
    }

    PanSpinControlThink() {
        if (this.mouseDown)
            this.ctrlDown ? this.PanControlThink() : this.SpinControlThink();
    }

    mDeltaUpdate() {
        this.mouseDelta.subVectors(this.mouseLastPos, this.mousePos);
        this.mouseLastPos = this.mousePos.clone();
    }

    PanControlThink() {
        //move pivot on a plane perpendicular to the camera's z-axis
        var panVec = new THREE.Vector3(this.mouseDelta.x, -this.mouseDelta.y, 0);
        panVec = this.localToWorld(panVec);
        panVec.sub(this.position.clone().setFromMatrixPosition(this.matrixWorld));
        this.pivot.position.add(panVec.multiplyScalar(0.01));
        // keep visual gizmo at pivot position
        this.axisHelper.position.copy(this.pivot.position);
    }

    //turntable-style camera rotation
    SpinControlThink() {
        //rotation on world up
        var yaxis = new THREE.Vector3(0, 1, 0);
        yaxis.add(this.pivot.position);
        yaxis = this.pivot.worldToLocal(yaxis);
        yaxis.normalize();
        this.pivot.rotateOnAxis(yaxis, this.mouseDelta.x / 100);

        //rotation on camera's x-axis vector at the pivot's position
        var xaxis = new THREE.Vector3(1, 0, 0);
        xaxis = this.localToWorld(xaxis);
        xaxis.sub(this.position.clone().setFromMatrixPosition(this.matrixWorld));
        xaxis.add(this.pivot.position);
        xaxis = this.pivot.worldToLocal(xaxis);
        xaxis.normalize();

        this.pivot.rotateOnAxis(xaxis, this.mouseDelta.y / 100);
    }
}

ZUTIL.SpinningCube = class extends THREE.Mesh {
    constructor(scene) {
        ///<param name="scene" type="ZUTIL.Scene">scene the object will be added to</param>
        var boxGeo = new THREE.BoxGeometry(1,1,1);
        var boxMat = new THREE.MeshPhongMaterial({ color: 0x38e04b });
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
        this.scene.update_arr.remove(this.callback);
    }
}

ZUTIL.PBRObjectLoader = class extends THREE.ObjectLoader {
    constructor(manager){
        super(manager);
    }

    load(pathName, refTex, scene, onLoaded){
        ///<param name="pathName" type="string">path including the .json filename (omit the file extension)</param>
        ///<param name="refTex" type="THREE.CubeTexture">the reflection cube texture this object will use</param>
        ///<param name="scene" type="ZUTIL.Scene">scene the object will be added to</param>
        ///<param name="onLoaded" type="ZUTIL.Scene">function to call when object is loaded</param>
        var object = super.load(pathName + ".json", function (obj) {
            obj.name = "Container_02";
            scene.add(obj);


            var tLoader = new THREE.TextureLoader()

            obj.children[0].material = new THREE.MeshPhysicalMaterial({
                map: tLoader.load(pathName + "_basecolor.png"),
                normalMap: tLoader.load(pathName + "_normal.png"),
                normalScale: new THREE.Vector2(1,1),
                metalness:1,
                metalnessMap: tLoader.load(pathName + "_metallic.png"),
                roughness:2.3,
                roughnessMap: tLoader.load(pathName + "_roughness.png"),
                envMapIntensity:2,
                envMap: refTex
            });
            onLoaded(obj);
        });
        return object;
    }
}

ZUTIL.PBRLoader = class extends THREE.ObjectLoader{
    constructor() {
        ///<summary>creates an object and applies PBR materials according to a matching _mats.json</summary>
        super();
        var _this = this;
        this.material_arr = [];
        this.callback = {}
    }

    load(objPathName, callback) {
        ///<param name="objPathName" type="string">object path and name</param>
        ///<param name="callback" type="string">function that is passed the returned object</param>
        var _this = this;
        super.load(objPathName + ".json", function (obj) { 
            callback(obj);
            
            var raw = new XMLHttpRequest();
            raw.overrideMimeType("application/json");
            raw.open("GET", objPathName + "_mats.json", true);
            raw.onreadystatechange = function () {
                if (raw.readyState == XMLHttpRequest.DONE && raw.status == 200) {
                    _this._assemble_materials(obj, JSON.parse(raw.responseText));
                }
            }
            raw.send(null);
        });
    }

    _assemble_materials(object, manifest) {
        var _this = this;
        var materials = [];
        var tLoader = new THREE.TextureLoader();

        var lightMapTex = tLoader.load(manifest.lightMap);

        var envLoader = new THREE.CubeTextureLoader();
        var envMap = envLoader.load(manifest.envMap);

        manifest.materials.forEach(function (mat) {

            var color =     tLoader.load(mat.color);
            var normal =    tLoader.load(mat.normal);
            var metallic =  tLoader.load(mat.metallic);
            var roughness = tLoader.load(mat.roughness);

            normal.encoding = THREE.LinearEncoding;

            color.wrapS = color.wrapT =
            normal.wrapS = normal.wrapT =
            metallic.wrapS = metallic.wrapT =
            roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;

            var material = new THREE.MeshPhysicalMaterial({
                name:              mat.name,
                map:               color,
                normalMap:         normal,
                metalness:         1,
                metalnessMap:      metallic,
                roughness:         2.3,
                roughnessMap:      roughness,
                lightMap:          lightMapTex,
                lightMapIntensity: 1,
                envMapIntensity:   2,
                envMap: envMap
            });

            material.object = mat.object;
            material.castShadow = mat.castShadow;
            material.receiveShadow = mat.receiveShadow;

            materials.push(material);


        });

        object.children.forEach(function (child) {
            materials.forEach(function (mat) {
                if (child.name == mat.object) {
                    child.material = mat;
                    child.castShadow = mat.castShadow;
                    child.receiveShadow = mat.receiveShadow;
                }
            });
        });
    }
}