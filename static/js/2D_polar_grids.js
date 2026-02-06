/**
 * DYNAMIC MOD N POLAR COORDINATE LOGIC
 */
function getPolygonCoords(n) {
    const modInput = document.getElementById('nValue');
    const mNum = modInput ? Number(modInput.value) : 12; // Fallback to 12
    const nNum = Number(BigInt(n));
    
    const ring = Math.ceil(nNum / mNum);
    const modVal = nNum % mNum === 0 ? mNum : nNum % mNum;
    
    // Calculate angle: (360 / mod) * modVal - 90 (to start at top)
    const angleStep = 360 / mNum;
    const angle = (modVal * angleStep - 90) * (Math.PI / 180); 
    
    return { 
        x: (ring - 0.5) * Math.cos(angle), 
        y: (ring - 0.5) * Math.sin(angle),
        angle: angle,
        ring: ring,
        modVal: modVal
    };
}

function drawPolygonBackground(ctx, stepSize, canvas, centerX, centerY, activeMarkers = []) {
    const mNum = Number(document.getElementById('nValue').value) || 12;
    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    
    const maxDim = Math.max(canvas.width, canvas.height);
    const numRings = Math.ceil((maxDim / 2) / stepSize);

    // 1. Draw Rings
    for (let r = 1; r <= numRings; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * stepSize, 0, Math.PI * 2);
        ctx.stroke(); 
    }

    // 2. Draw Spokes (offset by half a wedge so numbers sit in center)
    const angleStep = 360 / mNum;
    for (let i = 0; i < mNum; i++) {
        const angle = (i * angleStep + (angleStep / 2) - 90) * (Math.PI / 180); 
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + maxDim * Math.cos(angle), centerY + maxDim * Math.sin(angle));
        ctx.stroke();
    }

    // 3. Draw Ghost Numbers
    if (stepSize > 25) {
        ctx.fillStyle = "#444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${stepSize * 0.25}px monospace`;
        for (let n = 1; n <= mNum * numRings; n++) {
            if (activeMarkers.includes(BigInt(n))) continue;
            const pos = getPolygonCoords(n);
            ctx.fillText(n.toString(), centerX + pos.x * stepSize, centerY + pos.y * stepSize);
        }
    }
    ctx.restore();
}