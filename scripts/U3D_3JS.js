/// <reference path="three.js" />
/// <reference path="ZUTIL.js" />

document.addEventListener("DOMContentLoaded", function () { new App(); }, false);

App = function () {
    var canvas = document.getElementById("threeCanvas");
    var scene = new ZUTIL.Scene();
    test_scene_setup_01(scene);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;

    function mainUpdate() {
        window.requestAnimationFrame(mainUpdate);

        scene.update();

        renderer.render(scene, scene.activeCamera);
    }
    mainUpdate();

    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        scene.activeCamera.aspect = window.innerWidth / window.innerHeight;
        scene.activeCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

test_scene_setup_01 = function (scene) {

    scene.activeCamera = new ZUTIL.Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000, scene);
    scene.activeCamera.initPanSpinControl();

    var cube = new ZUTIL.SpinningCube(scene);
    cube.position.set(2, 0.5, 11);
    var cube2 = new ZUTIL.SpinningCube(scene);
    cube2.position.set(5, 0.5, 10);
    
    var hemilight = new THREE.HemisphereLight(0xffffff, 0x9b928a, 0.25);
    hemilight.position.set(0, 2, 0);
    scene.add(hemilight);

    var light = new THREE.DirectionalLight(0xfffbf2, 0.75);
    light.castShadow = true;
    light.shadowMapWidth = 2048;
    light.shadowMapHeight = 2048;
    light.position.set(-30, 30, 30);
    light.target.position.set(0, 0, 0);
    scene.add(light);
    
    reflectionLoader = new THREE.CubeTextureLoader();
    var reflectionCubeTex = reflectionLoader.load([
        "./assets/Bridge2/posx.jpg",
        "./assets/Bridge2/negx.jpg",
        "./assets/Bridge2/posy.jpg",
        "./assets/Bridge2/negy.jpg",
        "./assets/Bridge2/posz.jpg",
        "./assets/Bridge2/negz.jpg"
    ]);
    scene.background = reflectionCubeTex;

    //normals don't apply correctly to flipped geometry yet...
    var pbrobjloader = new ZUTIL.PBRObjectLoader();
    var container_02 = pbrobjloader.load("./assets/container_02", reflectionCubeTex, scene, function (obj) {
        obj.children[0].castShadow = true;
        obj.children[0].receiveShadow = true;
    });

    var pbrMat_arr = new ZUTIL.PBRLoader();
    pbrMat_arr.load("./assets/test_scene_01", function (obj) {
        scene.add(obj);
    });
}

