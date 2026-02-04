/**
 * MOD 12 POLAR COORDINATE LOGIC
 * Optimized for curved cells and centered text
 */

function getMod12Coords(n) {
    const nNum = Number(BigInt(n));
    const ring = Math.ceil(nNum / 12);
    const modVal = nNum % 12 === 0 ? 12 : nNum % 12;
    const angle = (modVal * 30 - 90) * (Math.PI / 180); 
    
    return { 
        x: (ring - 0.5) * Math.cos(angle), 
        y: (ring - 0.5) * Math.sin(angle),
        angle: angle,
        ring: ring
    };
}

function drawMod12Background(ctx, stepSize, canvas, centerX, centerY, activeNumbers = []) {
    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;

    const maxDim = Math.max(canvas.width, canvas.height);
    const numRings = Math.ceil(maxDim / stepSize);

    // 1. Draw Concentric Rings
    for (let r = 1; r <= numRings; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * stepSize, 0, Math.PI * 2);
        ctx.stroke(); 
    }

    // 2. Draw Radial Spokes (Dividing the clock into 12 wedges)
    for (let i = 0; i < 12; i++) {
        // Offset by 15 degrees to place spokes BETWEEN the numbers
        const angle = (i * 30 + 15 - 90) * (Math.PI / 180); 
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + maxDim * Math.cos(angle), centerY + maxDim * Math.sin(angle));
        ctx.stroke();
    }

    // 3. Draw Background "Ghost" Numbers
    if (stepSize > 30) {
        ctx.fillStyle = "#444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${stepSize * 0.25}px monospace`;

        // Loop through visible range
        for (let n = 1; n <= 1000; n++) {
            // Skip drawing if this number is an active plot marker
            if (activeNumbers.includes(BigInt(n))) continue;

            const pos = getMod12Coords(n);
            const gx = centerX + pos.x * stepSize;
            const gy = centerY + pos.y * stepSize;

            if (gx > 0 && gx < canvas.width && gy > 0 && gy < canvas.height) {
                ctx.fillText(n.toString(), gx, gy);
            }
        }
    }
    ctx.restore();
}