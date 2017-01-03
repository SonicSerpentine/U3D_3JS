/// <reference path="three.js" />

class ZUTIL { }

ZUTIL.Scene = class extends THREE.Scene {
    constructor() {
        super();
        this.update_arr = [];
        this.activeCamera = new ZUTIL.Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000, this);
        this.activeCamera.position.y = 3;
        this.activeCamera.position.x = -3;
        this.activeCamera.position.z = -3;
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
        for (var i = 0; i < this.scene.update_arr.length; i++){
            if (this.scene.update_arr[i] == this.callback) {
                this.scene.update_arr.splice(i, 1);
            }
        }
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
                    _this.assemble_materials(obj, JSON.parse(raw.responseText));
                }
            }
            raw.send(null);
        });
    }

    assemble_materials(object, manifest) {
        var _this = this;
        var materials = [];
        var tLoader = new THREE.TextureLoader();

        //TODO: load reflection cube maps
        //TODO: pass in the corresponding scene object instead of manifest pathname
        //TODO: assign object receiveShadow/castShadow properties from here

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