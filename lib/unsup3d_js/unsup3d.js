Number.prototype.zeroPad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function initViewer() {
    const canvas =  document.querySelector('#faceViewerCanvas');
    window.faceViewer = {
        test_url: 'https://robin-chou.github.io/remember/lib/assets/models/',
        url: 'https://vgg-dvar.robots.ox.ac.uk/unsup3d_2/',
        staticUrl: 'https://vgg-dvar.robots.ox.ac.uk/unsup3d_2/',
        currentId: '001',
        currentType: 'human',
        container: document.getElementById('faceViewerContainer'),
        camera: null,
        controls: null,
        scene: new THREE.Scene(),
        renderer: new THREE.WebGLRenderer({canvas}),
        lighting: null,
        ambient: new THREE.AmbientLight(0xffffff, 1),
        dirLight: new THREE.DirectionalLight(new THREE.Color('rgb(255, 255, 255)'), 1),
        frontLight: new THREE.DirectionalLight(new THREE.Color('rgb(255, 255, 255)'), 1),
        windowHalfX: null,
        windowHalfY: null,
        faceObject: null,
        materials: null,
    };
    window.faceViewer.halfWidth = $('#faceViewerContainer').width() / 2;
    window.faceViewer.halfHeight = $('#faceViewerContainer').outerHeight() / 2;
    window.faceViewer.materials = {
        shaded: null,
        alebedo: null,
        notex: new THREE.MeshLambertMaterial({color: 0xdddddd, shading: THREE.SmoothShading, side: THREE.DoubleSide})
    };

    window.faceViewer.camera = new THREE.PerspectiveCamera(10, window.faceViewer.halfWidth / window.faceViewer.halfHeight, 1, 1000)
    window.faceViewer.controls = new THREE.OrbitControls(window.faceViewer.camera, window.faceViewer.renderer.domElement);
    window.faceViewer.camera.position.z = 150;
    window.faceViewer.camera.position.y = 30;
    window.faceViewer.scene.add(window.faceViewer.ambient);
    window.faceViewer.dirLight.position.set(0.5, 0.5, 1).normalize();
    window.faceViewer.scene.add(window.faceViewer.dirLight);
    window.faceViewer.frontLight.position.set(0, 0, 1).normalize();
    window.faceViewer.scene.add(window.faceViewer.frontLight);

    window.faceViewer.renderer.setPixelRatio(window.devicePixelRatio);
    //window.faceViewer.renderer.setSize(window.faceViewer.halfWidth * 2, window.faceViewer.halfHeight * 2);
    window.faceViewer.renderer.setClearColor(new THREE.Color("hsl(0, 0%, 20%)"));
    //window.faceViewer.container.appendChild(window.faceViewer.renderer.domElement);
    $('#faceViewerCanvas').css({'position': 'absolute', 'top': '0px', 'left': '0px',});

    window.faceViewer.controls.enableDamping = true;
    window.faceViewer.controls.dampingFactor = 0.25;
    window.faceViewer.controls.enableZoom = true;
    window.faceViewer.controls.minDistance = 30;
    window.faceViewer.controls.maxDistance = 500;
    window.faceViewer.controls.enablePan = false;

    // load a face form the url
    var params = new URLSearchParams(location.search);
    if (params.has('image')) {
        loadFace(params.get('type'), params.get('image'));  // load face from url
    } else {
        loadFace('godel', '064_face');  // load default face
    }
}

function getResultUrl(face_type, id, filename) {
    var baseUrl;
    if (id.length == 36)
        baseUrl = window.faceViewer.url + 'result/';
    else
       // baseUrl = window.faceViewer.staticUrl + 'demo/';
        baseUrl = window.faceViewer.test_url;
        return baseUrl + filename;
//    return baseUrl + face_type + 'face/' + id + '/' + filename;
//    return 'https://vgg-dvar.robots.ox.ac.uk/unsup3d_2/demo/humanface/011_face/input_image.png'
}

function getCurrentResultUrl(filename) {
    return getResultUrl(window.faceViewer.currentType, window.faceViewer.currentId, filename);
}

function loadFace(face_type, id) {
    window.faceViewer.currentId = id;
    window.faceViewer.currentType = face_type;
    $('#inputimage').css('display', 'none').attr('src', getCurrentResultUrl('input_image.png'));
    $('#loading_spinner').css('display', 'block');
    if (window.faceViewer.faceObject != null)
        window.faceViewer.scene.remove(window.faceViewer.faceObject);
 // updateShareLinks();
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setResourcePath(getCurrentResultUrl(''));
    mtlLoader.setPath(getCurrentResultUrl(''));
    mtlLoader.setMaterialOptions({side: THREE.DoubleSide});
    mtlLoader.load('shaded.mtl', onShadedMtlLoaded);
    mtlLoader.load('albedo.mtl', onAlbedoMtlLoaded);
}

function onShadedMtlLoaded(materials) {
    materials.preload();
    window.faceViewer.materials.shaded = materials.materials.tex;
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath(getCurrentResultUrl(''));
    objLoader.load('shaded.obj', function (object) {
        object.name = 'face';
        if (window.faceViewer.faceObject != null)
            window.faceViewer.scene.remove(window.faceViewer.faceObject);
        window.faceViewer.scene.add(object);
        window.faceViewer.faceObject = object;
        $('#rmNormal').prop("checked", true);
        changeRenderMode({value: 'normal'});
        $('#inputimage').css('display', 'block');
        $('#loading_spinner').css('display', 'none');
    });
}

function onAlbedoMtlLoaded(materials) {
    materials.preload();
    window.faceViewer.materials.albedo = materials.materials.tex;
}

function local_file_uploader_onchange(e) {
    var auto_face_crop = document.getElementById('auto_crop_face_input').checked;
    var face_type = document.getElementById('face_type_input').value;
    $('#inputimage').css('display', 'none');
    $('#loading_spinner').css('display', 'block');
    get3d(e.files[0], face_type, auto_face_crop);
}

function faceTypeInputOnChange(sender) {
    var face_type = document.getElementById('face_type_input').value;
    if (face_type == 'cat') {
        $("#auto_crop_face_input").prop("checked", false);
        $("#auto_crop_face_input").prop("disabled", true);
        $("#auto_crop_face_input_label").css("text-decoration", "line-through");
    } else {
        $("#auto_crop_face_input").prop("checked", true);
        $("#auto_crop_face_input").prop("disabled", false);
        $("#auto_crop_face_input_label").css("text-decoration", "");
    }
}

function get3d(file, face_type, auto_face_crop) {
    if (file.size > 1e6) {
        showMsg('File needs to be < 1MB.');
        $('#loading_spinner').css('display', 'none');
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
        switch(xhr.statusText) {
            case 'OK':
                showResult(xhr.responseText)
                break;
            default:
                showMsg(xhr.status + ': ' + xhr.responseText);
        }
    });
    xhr.addEventListener('timeout', function(e) {
        showMsg('Server response timeout!');
    });
    xhr.addEventListener('error', function(e) {
        showMsg('Failed to send request to server!');
    });
    xhr.open('POST', window.faceViewer.url + face_type + 'face_2dto3d?crop=' + auto_face_crop);
    xhr.setRequestHeader('x-filename', file.name);
    xhr.send(file);
}

function showMsg(str) {
    $('#errormsg').text(str);
}

function addDemoImageButton(face_type, id) {
    var img = $('<img>', {
        src: getResultUrl(face_type, id, 'input_image.png')
    });
    img.appendTo("#demoimages");
    img.click(function(){loadFace(face_type, id)});
}

function showResult(response) {
    showMsg('');
    d = JSON.parse(response);
    splits = d['input_image'].split('/')
    face_type = splits[1].replace('face', '');
    id = splits[2];
    loadFace(face_type, id);
}

function render() {
    resizeRendererToDisplaySize(window.faceViewer.renderer); // respond to window resize

    window.faceViewer.controls.update();

    offset = new THREE.Vector3(0, 0, 1);
    offset.cross(window.faceViewer.dirLight.position).multiplyScalar(0.01);
    window.faceViewer.dirLight.position.add(offset).normalize();

    window.faceViewer.renderer.render(window.faceViewer.scene, window.faceViewer.camera);
    requestAnimationFrame(render);  // queue callback for next frame
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        const canvas = window.faceViewer.renderer.domElement;
        window.faceViewer.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        window.faceViewer.camera.updateProjectionMatrix();
    }
}

function changeRenderMode(radio) {
    if (window.faceViewer.faceObject == null)
        return;
    if (radio.value == 'normal') {
        assignMaterial(window.faceViewer.materials.shaded);
        window.faceViewer.dirLight.intensity = 0;
        window.faceViewer.ambient.intensity = 1;
        window.faceViewer.frontLight.intensity = 0;
    } else if (radio.value == 'relighting') {
        assignMaterial(window.faceViewer.materials.albedo);
        window.faceViewer.dirLight.intensity = 1;
        window.faceViewer.ambient.intensity = 0.1;
        window.faceViewer.frontLight.intensity = 0;
    } else {
        assignMaterial(window.faceViewer.materials.notex);
        window.faceViewer.dirLight.intensity = 0;
        window.faceViewer.ambient.intensity = 0;
        window.faceViewer.frontLight.intensity = 0.7;
    }
}

function assignMaterial(mat) {
    window.faceViewer.faceObject.traverse(function(child) {
        if (child instanceof THREE.Mesh){
            child.material = mat;
        }
    });
    window.faceViewer.faceObject.needsUpdate=true;
}

function updateShareLinks() {
    var searchParams = new URLSearchParams(window.location.search);
    searchParams.set("image", window.faceViewer.currentId);
    searchParams.set("type", window.faceViewer.currentType);
    var pathQuery = window.location.protocol+'//'+window.location.hostname+window.location.pathname + '?' + searchParams.toString();
    history.pushState(null, '', pathQuery);
    $('#twitterlink').attr('href', 'https://twitter.com/share?url='+encodeURIComponent(pathQuery));
    $('#facebooklink').attr('href', 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(pathQuery));
}
