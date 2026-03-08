// --- KHỞI TẠO THREE.JS ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// --- BIẾN TOÀN CỤC ---
let particles, photoSphere;
const totalPhotos = 97; // Theo list assets của bạn

// --- XỬ LÝ SỰ KIỆN GIỮ NÚT 3 GIÂY ---
let holdTimer;
const holdBtn = document.getElementById('hold-button');
const progressBar = document.getElementById('progress-bar');

function startExperience() {
    gsap.to("#start-screen", { opacity: 0, duration: 1, onComplete: () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('bg-music').play();
        runAnimationTimeline();
    }});
}

holdBtn.addEventListener('mousedown', () => {
    gsap.to(progressBar, { width: '100%', duration: 3, ease: "none", onComplete: startExperience });
});

holdBtn.addEventListener('mouseup', () => {
    gsap.killTweensOf(progressBar);
    gsap.to(progressBar, { width: '0%', duration: 0.2 });
});

// --- TẠO VŨ TRỤ & CHỮ (Giai đoạn 1 & 2) ---
function createGalaxy() {
    const geometry = new THREE.BufferGeometry();
    const pos = [];
    for(let i=0; i<10000; i++) {
        pos.push((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const material = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// --- TẠO QUẢ CẦU ẢNH (Giai đoạn 4) ---
function createPhotoSphere() {
    photoSphere = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    
    for(let i=1; i<=totalPhotos; i++) {
        const tex = textureLoader.load(`assets/pic${i}.jpg`);
        const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        const geo = new THREE.PlaneGeometry(1, 1);
        const mesh = new THREE.Mesh(geo, mat);
        
        // Sắp xếp theo hình cầu cơ bản
        const phi = Math.acos(-1 + (2 * i) / totalPhotos);
        const theta = Math.sqrt(totalPhotos * Math.PI) * phi;
        mesh.position.set(
            5 * Math.cos(theta) * Math.sin(phi),
            5 * Math.sin(theta) * Math.sin(phi),
            5 * Math.cos(phi)
        );
        mesh.lookAt(0,0,0);
        photoSphere.add(mesh);
    }
    photoSphere.scale.set(0,0,0); // Ẩn lúc đầu
    scene.add(photoSphere);
}

// --- KỊCH BẢN CHÍNH (TIMELINE) ---
function runAnimationTimeline() {
    const tl = gsap.timeline();
    
    // Giai đoạn 1: Xoay vũ trụ
    tl.to(particles.rotation, { y: Math.PI * 2, duration: 10 });
    
    // Giai đoạn 2 & 3: (Giả lập bằng cách scale các hạt và chuyển cảnh)
    // Để làm chữ từ hạt cần logic phức tạp hơn, ở mức cơ bản ta sẽ hiện Text 3D hoặc Sprite
    
    // Giai đoạn 4: Hiện quả cầu ảnh
    tl.to(photoSphere.scale, { x: 1, y: 1, z: 1, duration: 2, ease: "back.out" }, "+=2");
    
    // Giai đoạn 5: Ảnh bay ra
    tl.to(photoSphere.children.map(p => p.position), {
        x: () => (Math.random()-0.5)*20,
        y: () => (Math.random()-0.5)*20,
        z: () => (Math.random()-0.5)*20,
        duration: 3,
        stagger: 0.01
    }, "+=3");
    
    // Giai đoạn 6: Hiện nút thư
    tl.call(() => document.getElementById('letter-icon').classList.remove('hidden'));
}

// Loop render
function animate() {
    requestAnimationFrame(animate);
    if(particles) particles.rotation.y += 0.001;
    if(photoSphere) photoSphere.rotation.y += 0.002;
    renderer.render(scene, camera);
}

// Khởi chạy
createGalaxy();
createPhotoSphere();
camera.position.z = 15;
animate();

// Xử lý mở thư
document.getElementById('letter-icon').onclick = () => {
    document.getElementById('letter-content').classList.remove('hidden');
    setTimeout(() => document.querySelector('.letter-inner').classList.add('show'), 10);
};
document.getElementById('close-letter').onclick = () => {
    document.querySelector('.letter-inner').classList.remove('show');
    setTimeout(() => document.getElementById('letter-content').classList.add('hidden'), 500);
};