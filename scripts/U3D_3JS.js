/// <reference path="three.js" />
/// <reference path="ZUTIL.js" />

document.addEventListener("DOMContentLoaded", function () { new App(); }, false);

App = function () {
    var canvas = document.getElementById("threeCanvas");
    var scene = new ZUTIL.Scene();
    test_scene_setup_01(scene);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

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

    scene.activeCamera.initMouseSpinControl();

    var cube = new ZUTIL.SpinningCube(scene);
    cube.position.z = 3
    var cube2 = new ZUTIL.SpinningCube(scene);
    cube2.position.x = 3;

    var light = new THREE.HemisphereLight(0xffffff, 0x9b928a, 1);
    light.position.set(0, 2, 0);
    scene.add(light);
    
    var loader = new THREE.ObjectLoader();
    loader.setTexturePath("");
    loader.load("./assets/test_scene_01.json", function (obj) {

        //manually changing to the basic material type to omit light contribution
        obj.children[0].material = new THREE.MeshBasicMaterial({map:      obj.children[0].material.map,
                                                                lightMap: obj.children[0].material.lightMap});

        scene.add(obj);
    });
}

