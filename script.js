const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true, alpha: true });

// Khử mờ trên di động
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

let particles, photoSphere;
const particleCount = 50000;
const totalPhotos = 97;

// 1. Vũ trụ chấm xanh rực rỡ
function initParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    for(let i=0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] = (Math.random() - 0.5) * 120;
        pos[i3+1] = (Math.random() - 0.5) * 120;
        pos[i3+2] = (Math.random() - 0.5) * 120;

        cols[i3] = 0.1; // R
        cols[i3+1] = Math.random() * 0.7 + 0.3; // G (Xanh OU)
        cols[i3+2] = 0.2; // B
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);
}

// 2. Chữ 3D 2 dòng sắc nét
function getPointsFromText() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1600; canvas.height = 600;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 100px Arial';
    ctx.fillText("CHÚC MỪNG NGÀY QUỐC TẾ PHỤ NỮ", 800, 220);
    ctx.font = 'bold 130px Arial';
    ctx.fillText("08/03/2026", 800, 420);
    
    const data = ctx.getImageData(0, 0, 1600, 600).data;
    const points = [];
    for(let y=0; y<600; y+=2) {
        for(let x=0; x<1600; x+=2) {
            if(data[(y * 1600 + x) * 4] > 128) {
                points.push({ x: (x - 800) * 0.04, y: (300 - y) * 0.04, z: (Math.random()-0.5)*0.5 });
            }
        }
    }
    return points;
}

// 3. Quả cầu ảnh siêu nét (Anisotropy)
function initPhotoSphere() {
    photoSphere = new THREE.Group();
    const loader = new THREE.TextureLoader();
    const maxAni = renderer.capabilities.getMaxAnisotropy();

    for(let i=1; i<=totalPhotos; i++) {
        loader.load(`assets/pic${i}.jpg`, (tex) => {
            tex.anisotropy = maxAni;
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(3.5, 4.5), 
                new THREE.MeshBasicMaterial({ map: tex, side: 2 })
            );
            const phi = Math.acos(-1 + (2 * i) / totalPhotos);
            const theta = Math.sqrt(totalPhotos * Math.PI) * phi;
            const r = 10;
            mesh.position.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));
            mesh.lookAt(0,0,0);
            photoSphere.add(mesh);
        });
    }
    photoSphere.scale.set(0,0,0);
    scene.add(photoSphere);
}

// 4. Animation kịch bản
function startAnimation() {
    const tl = gsap.timeline();
    const textTarget = getPointsFromText();
    const posArr = particles.geometry.attributes.position.array;

    tl.to({}, { duration: 4, onUpdate: function() {
        const p = this.progress();
        for(let i=0; i < textTarget.length; i++) {
            const i3 = i * 3;
            if (i3 < posArr.length) {
                posArr[i3] += (textTarget[i].x - posArr[i3]) * p * 0.2;
                posArr[i3+1] += (textTarget[i].y - posArr[i3+1]) * p * 0.2;
                posArr[i3+2] += (textTarget[i].z - posArr[i3+2]) * p * 0.2;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }});

    tl.to({}, { duration: 2, onStart: () => particles.material.color.set(0x81c784), onUpdate: function() {
        for(let i=0; i<posArr.length; i++) posArr[i] += (Math.random() - 0.5) * 1.5;
        particles.geometry.attributes.position.needsUpdate = true;
    }}, "+=2");

    tl.to(particles.material, { opacity: 0.4, duration: 2 });
    tl.to(photoSphere.scale, { x: 1, y: 1, z: 1, duration: 2, ease: "back.out" }, "-=1");

    tl.to(photoSphere.children.map(m => m.position), {
        x: (i, t) => t.x * 5, y: (i, t) => t.y * 5, z: (i, t) => t.z * 5,
        duration: 8, stagger: 0.005, ease: "power2.inOut",
        onComplete: startHighlightLoop
    }, "+=2");
}

// 5. Highlight cực đại (To và Sắc nét)
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

        htl.to(photo.position, { x: 0, y: 0, z: isMobile ? 22 : 25, duration: 1.8, ease: "expo.out" });
        htl.to(photo.rotation, { x: 0, y: 0, z: 0, duration: 1.5 }, "-=1.8");
        htl.to(photo.scale, { x: isMobile ? 5 : 7, y: isMobile ? 5 : 7, duration: 1.8 }, "-=1.8");
        
        htl.to({}, { duration: 3 });

        htl.to(photo.position, { x: oldPos.x, y: oldPos.y, z: oldPos.z, duration: 1.5 });
        htl.to(photo.rotation, { x: oldRot.x, y: oldRot.y, z: oldRot.z, duration: 1.5 }, "-=1.5");
        htl.to(photo.scale, { x: 1, y: 1, duration: 1.5 }, "-=1.5");
    }
    highlight();
}

// Responsive window
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Giữ nút
let hold;
const btn = document.getElementById('hold-button');
btn.onmousedown = btn.ontouchstart = (e) => {
    e.preventDefault();
    hold = gsap.to("#progress-bar", { width: "100%", duration: 3, ease: "none", onComplete: () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('bg-music').play();
        startAnimation();
    }});
};
btn.onmouseup = btn.onmouseleave = btn.ontouchend = () => { if(hold) hold.kill(); gsap.to("#progress-bar", { width: 0 }); };

function animate() {
    requestAnimationFrame(animate);
    if(particles) particles.rotation.y += 0.0007;
    if(photoSphere) photoSphere.rotation.y += 0.001;
    renderer.render(scene, camera);
}

initParticles(); initPhotoSphere();
camera.position.z = 32;
animate();

// Thư
document.getElementById('letter-icon').onclick = () => {
    document.getElementById('letter-content').classList.remove('hidden');
    setTimeout(() => document.querySelector('.letter-inner').classList.add('show'), 10);
};
document.getElementById('close-letter').onclick = () => {
    document.querySelector('.letter-inner').classList.remove('show');
    setTimeout(() => document.getElementById('letter-content').classList.add('hidden'), 500);
};