class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 2;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.alpha = 1;
    }

    update() {
        this.alpha -= 0.03;
        this.size += 0.2;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(128, 255, 219, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 0;
        this.alpha = 1;
        this.maxSize = 100;
        this.speed = 3;
    }

    update() {
        this.size += this.speed;
        this.alpha = 1 - (this.size / this.maxSize);
    }

    draw(ctx) {
        ctx.strokeStyle = `rgba(128, 255, 219, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.stroke();
    }
}

class EnergyRing {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.alpha = 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.speed = 2;
    }

    update() {
        this.size += this.speed;
        this.rotation += 0.05;
        this.alpha = Math.max(0, this.alpha - 0.01);
    }

    draw(ctx) {
        ctx.strokeStyle = `rgba(128, 255, 219, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        for(let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

class Shockwave {
    constructor(x, y, power) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.maxSize = window.innerWidth * 2;
        this.alpha = 0.8;
        this.power = power;
        this.speed = 20 + (power * 10);
    }

    update() {
        this.size += this.speed;
        this.alpha = Math.max(0, 0.8 * (1 - this.size / this.maxSize));
        this.speed *= 0.99;
    }

    draw(ctx) {
        ctx.strokeStyle = `rgba(128, 255, 219, ${this.alpha})`;
        ctx.lineWidth = 2 + (this.power * 2);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.stroke();
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `rgba(128, 255, 219, 0)`);
        gradient.addColorStop(1, `rgba(128, 255, 219, ${this.alpha * 0.2})`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

class ParticleManager {
    constructor() {
        this.canvas = document.getElementById('trailCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.ripples = [];
        this.energyRings = [];
        this.shockwaves = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHolding = false;
        this.holdTimer = 0;
        this.holdInterval = null;
        this.chargeStartTime = 0;
        this.MIN_CHARGE_TIME = 0.5;
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.x;
            this.mouseY = e.y;
            if(this.isHolding) {
                this.particles.forEach(p => {
                    if(p.centerX !== undefined) {
                        p.centerX = e.x;
                        p.centerY = e.y;
                    }
                });
            } else {
                for(let i = 0; i < 3; i++) {
                    this.particles.push(new Particle(this.mouseX, this.mouseY));
                }
            }
        });
        window.addEventListener('click', (e) => {
            for(let i = 0; i < 3; i++) {
                this.ripples.push(new Ripple(e.x, e.y));
            }
        });
        window.addEventListener('mousedown', (e) => {
            this.isHolding = true;
            this.chargeStartTime = Date.now();
            this.holdTimer = 0;
            this.mouseX = e.x;
            this.mouseY = e.y;
            
            this.holdInterval = setInterval(() => {
                this.energyRings.push(new EnergyRing(this.mouseX, this.mouseY));
                
                for(let i = 0; i < 2; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 30 + Math.random() * 20;
                    const particle = new Particle(
                        this.mouseX + Math.cos(angle) * distance,
                        this.mouseY + Math.sin(angle) * distance
                    );
                    particle.angle = angle;
                    particle.distance = distance;
                    particle.centerX = this.mouseX;
                    particle.centerY = this.mouseY;
                    particle.orbitSpeed = 0.05 + Math.random() * 0.05;
                    particle.update = function() {
                        this.angle += this.orbitSpeed;
                        this.x = this.centerX + Math.cos(this.angle) * this.distance;
                        this.y = this.centerY + Math.sin(this.angle) * this.distance;
                        this.alpha -= 0.01;
                    };
                    this.particles.push(particle);
                }
            }, 100);
        });

        window.addEventListener('mouseup', (e) => {
            if (this.isHolding) {
                const holdDuration = (Date.now() - this.chargeStartTime) / 1000;
                
                if (holdDuration > this.MIN_CHARGE_TIME) {
                    const power = Math.min(holdDuration / 3, 1);
                    
                    this.shockwaves.push(new Shockwave(this.mouseX, this.mouseY, power));
                    
                    const particleCount = Math.floor(20 * power);
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (Math.PI * 2 / particleCount) * i;
                        const speed = 10 + (power * 20);
                        const distance = 50 + (power * 100);
                        const particle = new Particle(this.mouseX, this.mouseY);
                        particle.size = 3 + (power * 2);
                        particle.update = function() {
                            this.x += Math.cos(angle) * speed;
                            this.y += Math.sin(angle) * speed;
                            this.alpha -= 0.02;
                        };
                        this.particles.push(particle);
                    }
                } else {
                    this.ripples.push(new Ripple(this.mouseX, this.mouseY));
                }
            }
            
            this.isHolding = false;
            clearInterval(this.holdInterval);
        });
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(particle => particle.alpha > 0);
        this.ripples = this.ripples.filter(ripple => ripple.alpha > 0);
        this.energyRings = this.energyRings.filter(ring => ring.alpha > 0);
        this.shockwaves = this.shockwaves.filter(wave => wave.alpha > 0);
        
        [...this.particles, ...this.ripples, ...this.energyRings, ...this.shockwaves].forEach(effect => {
            effect.update();
            effect.draw(this.ctx);
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleManager();
});
