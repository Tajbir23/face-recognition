let faceMesh, videoElement, camera, scene, renderer, facePoints, faceGeometry;

async function loadFaceMesh() {
    faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onFaceMeshResults);
    console.log("✅ FaceMesh Loaded");
}

async function startCamera() {
    videoElement = document.getElementById('video');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => { videoElement.play(); };
        console.log("✅ Camera Started");

        const cameraFeed = new Camera(videoElement, {
            onFrame: async () => { await faceMesh.send({ image: videoElement }); },
            width: 400,
            height: 300
        });

        cameraFeed.start();
    } catch (error) {
        console.error("❌ Camera Error:", error);
    }
}

function setupThreeJS() {
    scene = new THREE.Scene();
    const container = document.getElementById("three-container");

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 300);
    container.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    camera.position.z = 2;

    // Face Points
    facePoints = new THREE.BufferGeometry();
    const positions = new Float32Array(468 * 3);
    facePoints.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Material
    const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.02 });
    faceGeometry = new THREE.Points(facePoints, material);
    scene.add(faceGeometry);
}

function onFaceMeshResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    
    const landmarks = results.multiFaceLandmarks[0];
    const positions = facePoints.attributes.position.array;

    for (let i = 0; i < landmarks.length; i++) {
        positions[i * 3] = landmarks[i].x * 2 - 1;   // X-axis (normalized)
        positions[i * 3 + 1] = -(landmarks[i].y * 2 - 1);  // Y-axis (normalized)
        positions[i * 3 + 2] = -landmarks[i].z * 2; // Depth
    }

    facePoints.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}

async function init() {
    console.log("🚀 Initializing...");
    await loadFaceMesh();
    setupThreeJS();
    await startCamera();
}

window.onload = init;
