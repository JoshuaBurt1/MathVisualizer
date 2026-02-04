/**
 * MOD 12 POLAR COORDINATE LOGIC
 */

function getMod12Coords(n) {
    const nBI = BigInt(n);
    const ring = Math.ceil(Number(nBI) / 12);
    const angle = (Number(nBI % 12n) * 30 - 90) * (Math.PI / 180); 
    return { x: ring * Math.cos(angle), y: ring * Math.sin(angle) };
}

function drawMod12Background(ctx, stepSize, canvas, centerX, centerY, activeNumbers = []) {
    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;

    const maxDim = Math.max(canvas.width, canvas.height);
    const numRings = Math.ceil(maxDim / stepSize);

    // 1. Draw Rings
    for (let r = 1; r <= numRings; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * stepSize, 0, Math.PI * 2);
        ctx.stroke(); 
    }

    // 2. Draw Spokes
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30 + 15 - 90) * (Math.PI / 180); 
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + maxDim * Math.cos(angle), centerY + maxDim * Math.sin(angle));
        ctx.stroke();
    }

    // 3. Draw Numbers (The "Anti-Ghosting" Loop)
    if (stepSize > 30) {
        ctx.fillStyle = "#444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${stepSize * 0.25}px monospace`;

        // We only loop to a reasonable limit for performance
        for (let n = 1; n <= 1000; n++) {
            const nBI = BigInt(n);

            const ring = Math.ceil(n / 12);
            const modVal = n % 12 === 0 ? 12 : n % 12;
            const midR = (ring - 0.5) * stepSize;
            const angle = (modVal * 30 - 90) * (Math.PI / 180);
            
            const gx = centerX + midR * Math.cos(angle);
            const gy = centerY + midR * Math.sin(angle);

            if (gx > 0 && gx < canvas.width && gy > 0 && gy < canvas.height) {
                ctx.fillText(n.toString(), gx, gy);
            }
        }
    }
    ctx.restore();
}