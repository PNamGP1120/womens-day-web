import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true, alpha: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

let particles, photoSphere;
const particleCount = 60000;
const totalPhotos = 97;

function initParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    for(let i=0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] = (Math.random() - 0.5) * 200;
        pos[i3+1] = (Math.random() - 0.5) * 200;
        pos[i3+2] = (Math.random() - 0.5) * 200;
        cols[i3] = 0.1; cols[i3+1] = Math.random() * 0.7 + 0.3; cols[i3+2] = 0.1;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending }));
    scene.add(particles);
}

function getPointsFromText() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 2000; canvas.height = 1000;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 135px Arial'; ctx.fillText("CHÚC MỪNG", 1000, 300);
    ctx.font = 'bold 115px Arial'; ctx.fillText("QUỐC TẾ PHỤ NỮ", 1000, 480);
    ctx.font = 'bold 125px Arial'; ctx.fillText("08/03/2026", 1000, 680);
    
    const data = ctx.getImageData(0, 0, 2000, 1000).data;
    const points = [];
    for(let y=0; y<1000; y+=2) {
        for(let x=0; x<2000; x+=2) {
            if(data[(y * 2000 + x) * 4] > 128) {
                points.push({ x: (x - 1000) * 0.032, y: (500 - y) * 0.032, z: (Math.random()-0.5)*1 });
            }
        }
    }
    return points;
}

function initPhotoSphere() {
    photoSphere = new THREE.Group();
    const loader = new THREE.TextureLoader();
    const radius = 20; 
    for(let i=1; i<=totalPhotos; i++) {
        loader.load(`assets/pic${i}.jpg`, (tex) => {
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            tex.colorSpace = THREE.SRGBColorSpace;
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 10), new THREE.MeshBasicMaterial({ map: tex, side: 2 }));
            const phi = Math.acos(-1 + (2 * i) / totalPhotos);
            const theta = Math.sqrt(totalPhotos * Math.PI) * phi;
            mesh.position.set(radius * Math.cos(theta) * Math.sin(phi), radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(phi));
            mesh.lookAt(0,0,0);
            photoSphere.add(mesh);
        });
    }
    photoSphere.scale.set(0,0,0);
    scene.add(photoSphere);
}

function startAnimation() {
    const tl = gsap.timeline();
    const textTarget = getPointsFromText();
    const posArr = particles.geometry.attributes.position.array;
    tl.to({}, { duration: 4, onUpdate: function() {
        const p = this.progress();
        for(let i=0; i < textTarget.length; i++) {
            const i3 = i * 3;
            if (i3 < posArr.length) {
                posArr[i3] += (textTarget[i].x - posArr[i3]) * p * 0.22;
                posArr[i3+1] += (textTarget[i].y - posArr[i3+1]) * p * 0.22;
                posArr[i3+2] += (textTarget[i].z - posArr[i3+2]) * p * 0.22;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }});
    tl.to({}, { duration: 2, onStart: () => particles.material.color.set(0x81c784), onUpdate: function() {
        for(let i=0; i<posArr.length; i++) posArr[i] += (Math.random() - 0.5) * 2.5;
        particles.geometry.attributes.position.needsUpdate = true;
    }}, "+=2");
    tl.to(particles.material, { opacity: 0.5, duration: 2 });
    tl.to(photoSphere.scale, { x: 1, y: 1, z: 1, duration: 2.5, ease: "back.out(1.1)" }, "-=1.5");
    tl.to(photoSphere.children.map(m => m.position), {
        x: (i, t) => t.x * 4.5, y: (i, t) => t.y * 4.5, z: (i, t) => t.z * 4.5,
        duration: 8, stagger: 0.005, ease: "power2.inOut", onComplete: startHighlightLoop
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
        htl.to(photo.position, { x: 0, y: 0, z: isMobile ? 42 : 45, duration: 1.8, ease: "expo.out" });
        htl.to(photo.rotation, { x: 0, y: 0, z: 0, duration: 1.5 }, "-=1.8");
        htl.to(photo.scale, { x: isMobile ? 4.5 : 6, y: isMobile ? 4.5 : 6, duration: 1.8 }, "-=1.8");
        htl.to({}, { duration: 4 });
        htl.to(photo.position, { x: oldPos.x, y: oldPos.y, z: oldPos.z, duration: 1.5 });
        htl.to(photo.rotation, { x: oldRot.x, y: oldRot.y, z: oldRot.z, duration: 1.5 }, "-=1.5");
        htl.to(photo.scale, { x: 1, y: 1, duration: 1.5 }, "-=1.5");
    }
    highlight();
}

// XỬ LÝ ÂM THANH & HOLD LOGO
const music = document.getElementById('bg-music');
const btn = document.getElementById('hold-button');
const circle = document.getElementById('progress-circle');
let holdTl;

const primeAudio = () => {
    music.play().then(() => { music.pause(); }).catch(e => console.log(e));
};

const handleStart = (e) => {
    if(e.type === 'touchstart') primeAudio();
    circle.style.strokeDashoffset = "377";
    holdTl = gsap.to(circle, { strokeDashoffset: 0, duration: 3, ease: "none", onComplete: () => {
        document.getElementById('start-screen').style.display = 'none';
        music.play();
        startAnimation();
    }});
    gsap.to(btn, { scale: 0.9, duration: 0.3 });
};

const handleEnd = () => { if(holdTl) holdTl.kill(); gsap.to(circle, { strokeDashoffset: 377, duration: 0.3 }); gsap.to(btn, { scale: 1, duration: 0.3 }); };

btn.addEventListener('mousedown', handleStart);
btn.addEventListener('touchstart', handleStart, { passive: false });
btn.addEventListener('mouseup', handleEnd);
btn.addEventListener('touchend', handleEnd);

function updateCamera() {
    const isMobile = window.innerWidth < 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera.position.z = isMobile ? 80 : 65; 
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', updateCamera);

initParticles(); initPhotoSphere(); updateCamera();
animate();

function animate() {
    requestAnimationFrame(animate);
    if(particles) particles.rotation.y += 0.0007;
    if(photoSphere) photoSphere.rotation.y += 0.0012;
    renderer.render(scene, camera);
}

document.getElementById('letter-icon').onclick = () => {
    document.getElementById('letter-content').classList.remove('hidden');
    setTimeout(() => document.querySelector('.letter-inner').classList.add('show'), 10);
};
document.getElementById('close-letter').onclick = () => {
    document.querySelector('.letter-inner').classList.remove('show');
    setTimeout(() => document.getElementById('letter-content').classList.add('hidden'), 500);
};