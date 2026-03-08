import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true, alpha: true });

// Tối ưu độ nét cho di động (Retina Display)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

let particles, photoSphere;
const particleCount = 60000;
const totalPhotos = 97;

function initParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] = (Math.random() - 0.5) * 160;
        pos[i3 + 1] = (Math.random() - 0.5) * 160;
        pos[i3 + 2] = (Math.random() - 0.5) * 160;
        cols[i3] = 0.1;
        cols[i3 + 1] = Math.random() * 0.8 + 0.2;
        cols[i3 + 2] = 0.1;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const mat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);
}

// Chữ 2 dòng to, không bị mất chữ trên GitHub Pages
function getPointsFromText() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1800; canvas.height = 800;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    ctx.font = 'bold 100px Arial';
    ctx.fillText("CHÚC MỪNG NGÀY QUỐC TẾ PHỤ NỮ", 900, 300);

    ctx.font = 'bold 140px Arial';
    ctx.fillText("08/03/2026", 900, 500);

    const data = ctx.getImageData(0, 0, 1800, 800).data;
    const points = [];
    for (let y = 0; y < 800; y += 2) {
        for (let x = 0; x < 1800; x += 2) {
            if (data[(y * 1800 + x) * 4] > 128) {
                points.push({ x: (x - 900) * 0.04, y: (400 - y) * 0.04, z: (Math.random() - 0.5) * 1 });
            }
        }
    }
    return points;
}

// Trái đất (Quả cầu ảnh) khổng lồ và tách nhau
function initPhotoSphere() {
    photoSphere = new THREE.Group();
    const loader = new THREE.TextureLoader();
    const maxAni = renderer.capabilities.getMaxAnisotropy();
    const radius = 18; // Bán kính lớn giúp các ảnh tách nhau

    for (let i = 1; i <= totalPhotos; i++) {
        loader.load(`assets/pic${i}.jpg`, (tex) => {
            tex.anisotropy = maxAni; // Khử răng cưa cho ảnh nét
            tex.colorSpace = THREE.SRGBColorSpace;

            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(6.5, 8.5), // Kích thước ảnh khổng lồ
                new THREE.MeshBasicMaterial({ map: tex, side: 2 })
            );

            const phi = Math.acos(-1 + (2 * i) / totalPhotos);
            const theta = Math.sqrt(totalPhotos * Math.PI) * phi;

            mesh.position.set(radius * Math.cos(theta) * Math.sin(phi), radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(phi));
            mesh.lookAt(0, 0, 0);
            photoSphere.add(mesh);
        });
    }
    photoSphere.scale.set(0, 0, 0);
    scene.add(photoSphere);
}

function startAnimation() {
    const tl = gsap.timeline();
    const textTarget = getPointsFromText();
    const posArr = particles.geometry.attributes.position.array;

    tl.to({}, {
        duration: 4, onUpdate: function () {
            const p = this.progress();
            for (let i = 0; i < textTarget.length; i++) {
                const i3 = i * 3;
                if (i3 < posArr.length) {
                    posArr[i3] += (textTarget[i].x - posArr[i3]) * p * 0.22;
                    posArr[i3 + 1] += (textTarget[i].y - posArr[i3 + 1]) * p * 0.22;
                    posArr[i3 + 2] += (textTarget[i].z - posArr[i3 + 2]) * p * 0.22;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }
    });

    tl.to({}, {
        duration: 2, onStart: () => particles.material.color.set(0x81c784), onUpdate: function () {
            for (let i = 0; i < posArr.length; i++) posArr[i] += (Math.random() - 0.5) * 2.5;
            particles.geometry.attributes.position.needsUpdate = true;
        }
    }, "+=2");

    tl.to(particles.material, { opacity: 0.5, duration: 2 });
    tl.to(photoSphere.scale, { x: 1, y: 1, z: 1, duration: 2.5, ease: "back.out(1.1)" }, "-=1");

    tl.to(photoSphere.children.map(m => m.position), {
        x: (i, t) => t.x * 4.5, y: (i, t) => t.y * 4.5, z: (i, t) => t.z * 4.5,
        duration: 8, stagger: 0.005, ease: "power2.inOut",
        onComplete: startHighlightLoop
    }, "+=2.5");
}

function startHighlightLoop() {
    document.getElementById('letter-icon').classList.remove('hidden');
    const photos = photoSphere.children;
    function highlight() {
        if (photos.length === 0) return;
        const photo = photos[Math.floor(Math.random() * photos.length)];
        const oldPos = photo.position.clone();
        const oldRot = photo.rotation.clone();
        const htl = gsap.timeline({ onComplete: () => gsap.delayedCall(0.5, highlight) });
        const isMobile = window.innerWidth < 768;

        htl.to(photo.position, { x: 0, y: 0, z: isMobile ? 38 : 42, duration: 1.8, ease: "expo.out" });
        htl.to(photo.rotation, { x: 0, y: 0, z: 0, duration: 1.5 }, "-=1.8");
        htl.to(photo.scale, { x: isMobile ? 4.5 : 6, y: isMobile ? 4.5 : 6, duration: 1.8 }, "-=1.8");
        htl.to({}, { duration: 4 });
        htl.to(photo.position, { x: oldPos.x, y: oldPos.y, z: oldPos.z, duration: 1.5 });
        htl.to(photo.rotation, { x: oldRot.x, y: oldRot.y, z: oldRot.z, duration: 1.5 }, "-=1.5");
        htl.to(photo.scale, { x: 1, y: 1, duration: 1.5 }, "-=1.5");
    }
    highlight();
}

let hold;
const btn = document.getElementById('hold-button');
const music = document.getElementById('bg-music');
btn.onmousedown = btn.ontouchstart = (e) => {
    hold = gsap.to("#progress-bar", {
        width: "100%", duration: 3, ease: "none", onComplete: () => {
            document.getElementById('start-screen').style.display = 'none';
            music.play();
            startAnimation();
        }
    });
};
btn.onmouseup = btn.ontouchend = () => { if (hold) hold.kill(); gsap.to("#progress-bar", { width: 0 }); };

function animate() {
    requestAnimationFrame(animate);
    if (particles) particles.rotation.y += 0.0007;
    if (photoSphere) photoSphere.rotation.y += 0.0012;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initParticles(); initPhotoSphere();
camera.position.z = 55; // Khoảng cách nhìn quả cầu lớn đẹp nhất
animate();

// UI Lá thư
document.getElementById('letter-icon').onclick = () => {
    document.getElementById('letter-content').classList.remove('hidden');
    setTimeout(() => document.querySelector('.letter-inner').classList.add('show'), 10);
};
document.getElementById('close-letter').onclick = () => {
    document.querySelector('.letter-inner').classList.remove('show');
    setTimeout(() => document.getElementById('letter-content').classList.add('hidden'), 500);
};