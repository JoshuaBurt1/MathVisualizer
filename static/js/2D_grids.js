/**
 * --- GLOBAL CAMERA STATE ---
 */
let markerHitBoxes = [];
let offsetX = window.innerWidth / 2;
let offsetY = window.innerHeight / 2;
let zoom = 1.0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- EVENT LISTENERS ---
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check hitboxes from last draw
    for (const box of markerHitBoxes) {
        const dx = mouseX - box.x;
        const dy = mouseY - box.y;
        
        // Use a slightly larger click area for small markers/high zoom
        const hitArea = Math.max(box.size, 15); 
        
        if (Math.abs(dx) < hitArea && Math.abs(dy) < hitArea) {
            // Get current plot type from UI
            const currentPlotType = document.getElementById('plotType').value;
            // Get first p from input to maintain scale
            const pInputRaw = document.getElementById('pInput').value;
            const pValues = parsePInput(pInputRaw);
            const referenceP = pValues.length > 0 ? BigInt(pValues[0]) : 11n;

            jumpToNumber(box.n, currentPlotType, referenceP);
            return; 
        }
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const worldX = (e.clientX - offsetX) / zoom;
    const worldY = (e.clientY - offsetY) / zoom;

    if (e.deltaY < 0) zoom *= (1 + zoomSpeed);
    else zoom /= (1 + zoomSpeed);

    zoom = Math.min(Math.max(zoom, 0.005), 500);
    offsetX = e.clientX - worldX * zoom;
    offsetY = e.clientY - worldY * zoom;
    requestAnimationFrame(plotData);
}, { passive: false });

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX += e.clientX - lastMouseX;
    offsetY += e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    requestAnimationFrame(plotData);
});

window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    plotData();
});

// Add the "Enter" key listener to the pInput field
document.getElementById('pInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Stop page refresh if inside a form
        plotData();            // Run your existing plot function
    }
});

function onPlotChange() { recenterCamera(); }

function recenterCamera() {
    const plotType = document.getElementById('plotType').value;
    zoom = 0.3; 
    if (plotType === "binary") {
        zoom = 1.2; 
    }
    if (["shell", "serpentine", "binary"].includes(plotType)) {
        // Offset from top-left for grid-style layouts
        offsetX = 120; 
        offsetY = 120;
    } else {
        // True center for Ulam, Hexagon
        offsetX = window.innerWidth / 2;
        offsetY = window.innerHeight / 2;
    }
    plotData();
}

/**
 * --- MATH & COORDINATES ---
 */
const dataElement = document.getElementById('n_data');
const visualData = JSON.parse(dataElement.textContent);

function bigIntSqrt(value) {
    if (value < 2n) return value;
    let x = value / 2n + 1n;
    let y = (x + value / x) / 2n;
    while (y < x) { x = y; y = (x + value / x) / 2n; }
    return x;
}

function getBinaryCoords(n) {
    const nBI = BigInt(n);
    if (nBI <= 0n) return { x: 0n, y: 0n };
    
    const bitString = nBI.toString(2);
    // Y represents the "Power of 2" (Row), starting at 0 for number 1
    const row = BigInt(bitString.length) - 1n;
    
    // X represents the "Offset" from that power of 2 (Column)
    const baseValue = 2n ** row;
    const col = nBI - baseValue;
    
    return { x: col, y: row };
}

function getSerpentineCoords(n) {
    let r = bigIntSqrt(n - 1n);
    let rem = n - (r * r);
    if (r % 2n === 0n) {
        if (rem <= r + 1n) return { x: rem - 1n, y: r };
        return { x: r, y: r - (rem - (r + 1n)) };
    } else {
        if (rem <= r + 1n) return { x: r, y: rem - 1n };
        return { x: r - (rem - (r + 1n)), y: r };
    }
}

function getShellCoords(n) {
    if (n === 1n) return { x: 0n, y: 0n };
    let k = bigIntSqrt(n - 1n); 
    let offset = n - (k * k);
    if (offset <= k + 1n) return { x: k, y: offset - 1n };
    return { x: k - (offset - (k + 1n)), y: k };
}

function getSpiralCoordsBigInt(n) {
    if (n === 0n) return { x: 0n, y: 0n };
    let k = (bigIntSqrt(n - 1n) + 1n) / 2n;
    let t = 2n * k + 1n;
    let m = t * t;
    t = t - 1n;
    if (n >= m - t) return { x: k - (m - n), y: k }; 
    m -= t;
    if (n >= m - t) return { x: -k, y: k - (m - n) }; 
    m -= t;
    if (n >= m - t) return { x: -k + (m - n), y: -k }; 
    return { x: k, y: -k + (m - n - t) };         
}

function getHexCoords(n) {
    let nNum = Number(n);
    if (nNum <= 1) return { x: 0, y: 0 };
    
    // 1. Calculate layer directly using the quadratic formula
    // 3L^2 - 3L + (1 - n) = 0
    let layer = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - nNum))) / 6);
    
    // 2. Find the starting point of this layer
    let prevTotal = 3 * (layer - 2) * (layer - 1) + 1;
    let offset = nNum - prevTotal - 1;
    
    // q, r are axial coordinates
    let q = 0, r = -(layer - 1);
    
    const dirs = [
        {dq: 1, dr: 0}, {dq: 0, dr: 1}, {dq: -1, dr: 1}, 
        {dq: -1, dr: 0}, {dq: 0, dr: -1}, {dq: 1, dr: -1}
    ];
    
    let sideLen = layer - 1;
    let side = Math.floor(offset / sideLen);
    let steps = offset % sideLen;
    
    // Move to the correct side and then step along it
    for (let i = 0; i < side; i++) { 
        q += dirs[i].dq * sideLen; 
        r += dirs[i].dr * sideLen; 
    }
    q += dirs[side].dq * steps; 
    r += dirs[side].dr * steps;

    return { 
        x: (Math.sqrt(3) * q + Math.sqrt(3)/2 * r), 
        y: (1.5 * r) 
    };
}

/**
 * --- RENDERING ENGINE ---
 */
function parsePInput(input) {
    const results = new Set(); // Use Set to avoid duplicates
    const parts = input.split(',');

    parts.forEach(part => {
        if (part.includes('..')) {
            const range = part.split('..');
            const start = parseInt(range[0]);
            const end = parseInt(range[1]);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                    results.add(i);
                }
            }
        } else {
            const val = parseInt(part.trim());
            if (!isNaN(val)) results.add(val);
        }
    });
    return Array.from(results).sort((a, b) => a - b);
}

function plotData() {
    markerHitBoxes = []; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const pInputRaw = document.getElementById('pInput').value;
    const plotType = document.getElementById('plotType').value;
    const formulaType = document.getElementById('formulaType').value; 
    
    const pValues = parsePInput(pInputRaw);
    if (pValues.length === 0) return;

    let allFoundEntries = [];
    pValues.forEach(pVal => {
        const formulaLabel = `2^${pVal}${formulaType === "minus" ? "-1" : "+1"}`;
        const entry = visualData.find(d => d.form === formulaLabel || (d.p == pVal && d.type === formulaType));
        if (entry) allFoundEntries.push({ pVal, entry });
    });

    if (allFoundEntries.length === 0) return;

    // Determine zoom/step size based on the first item
    const referenceScale = 10n; 
    let baseStepSize = (plotType === "binary") 
    ? (canvas.width / 40) 
    : (canvas.width / 2.5) / Number(bigIntSqrt(referenceScale));
    let finalStep = baseStepSize * zoom;

    const gridCfg = { ctx, stepSize: finalStep, canvas, centerX: offsetX, centerY: offsetY };

    // --- DRAW BACKGROUND ONLY ONCE ---
    const coordFn = getCoordFnByType(plotType);

    // Determine which background logic to use
    if (plotType === "mod12") {
        // Collect all numbers that will be markers to prevent double-printing
        let activeMarkers = [1n]; 
        allFoundEntries.forEach(({entry}) => {
            activeMarkers.push(BigInt(entry.number));
            if (entry.factors) {
                entry.factors.split(',').forEach(f => activeMarkers.push(BigInt(f.trim())));
            }
        });

        // Call the function from 2D_polar_grids.js
        drawMod12Background(ctx, finalStep, canvas, offsetX, offsetY, activeMarkers);
    } else {
        drawBackgroundGrid(gridCfg, coordFn, plotType);
    }

    // --- DRAW MARKERS AND LINES FOR EACH P ---
    allFoundEntries.forEach(({ pVal, entry }) => {
        const Mnum = BigInt(entry.number);
        const factors = entry.factors 
            ? entry.factors.split(',').filter(s => s.trim() !== "").map(s => BigInt(s.trim())) 
            : [];
        const pBI = BigInt(pVal);

        const drawCfg = { ...gridCfg, p: pBI, Mnum, factors };
        drawMarkersAndLines(drawCfg, coordFn, plotType);
    });

    updateStats(plotType, allFoundEntries);
}

// Helper to get the right coordinate function
function getCoordFnByType(type) {
    if (type === "binary") return getBinaryCoords;
    if (type === "ulam") return getSpiralCoordsBigInt;
    if (type === "serpentine") return getSerpentineCoords;
    if (type === "shell") return getShellCoords;
    if (type === "hexagon") return getHexCoords;
    
    // Check if the polar script is loaded
    if (type === "mod12") {
        return (typeof getMod12Coords === "function") ? getMod12Coords : getSpiralCoordsBigInt;
    }
    
    return getSpiralCoordsBigInt;
}
/**
 * REPLACED HELPER: Draws background grid and numbers for non-radial plots
 */
function drawBackgroundGrid(cfg, coordFn, typeTag) {
    const { ctx, stepSize, canvas, centerX, centerY } = cfg;
    if (stepSize <= 2) return;

    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 1. CALCULATE BOUNDS
    // Instead of 1 to 2000, we find the range of visible "units"
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    
    // 2. ITERATE 
    // For specific grids like Spiral/Ulam, we'd ideally calculate bounds,
    // but for now, we'll keep the loop but apply STRICT clipping.
    for (let i = 1n; i <= 2000n; i++) {
        let pos = coordFn(i);
        let gx = centerX + Number(pos.x) * stepSize;
        let gy = centerY + Number(pos.y) * stepSize;
        
        // STRICT CLIPPING: 0 to Width/Height (no padding)
        if (gx >= 0 && gx <= canvas.width && gy >= 0 && gy <= canvas.height) {
            
            // Draw Grid Shape
            if (typeTag === "hexagon") {
                const hexRadius = stepSize;
                drawHexPath(ctx, gx, gy, hexRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(gx - stepSize/2, gy - stepSize/2, stepSize, stepSize);
            }

            // Draw Background Number
            if (stepSize > 30) {
                ctx.fillStyle = "#444"; 
                ctx.font = `${stepSize * 0.3}px monospace`;
                ctx.fillText(i.toString(), gx, gy);
            }
        }
    }
    ctx.restore();
}

// Draws the dashed lines and the colored squares/hexagons for the data
function drawMarkersAndLines(cfg, coordFn, typeTag) {
    const { ctx, stepSize, p, Mnum, factors, canvas, centerX, centerY } = cfg;

    // 2. DRAW DASHED TRACKER LINES
    const drawLine = (targetN, color) => {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;

        const endPos = coordFn(targetN);
        
        if (typeTag === "mod12") {
            // Absolute center of the polar coordinate system
            ctx.moveTo(centerX, centerY); 
        } else {
            // Traditional behavior for Cartesian grids
            const startPos = coordFn(1n);
            ctx.moveTo(centerX + Number(startPos.x) * stepSize, centerY + Number(startPos.y) * stepSize);
        }

        ctx.lineTo(centerX + Number(endPos.x) * stepSize, centerY + Number(endPos.y) * stepSize);
        ctx.stroke();
        ctx.restore();
    };

    drawLine(p, "#ffff00");
    factors.forEach(f => drawLine(f, "#00ff88"));
    drawLine(Mnum, factors.length === 0 ? "#e74c3c" : "#3498db");

    // 3. DRAW MARKERS
    if (typeTag !== "mod12") {
        plotMarker(cfg, 1n, "#ffffff", "1", 12, coordFn, typeTag); 
    }    
    plotMarker(cfg, p, "#ffff00", `p(${p})`, 8, coordFn, typeTag); 

    if (factors.length === 0) {
        plotMarker(cfg, Mnum, "#e74c3c", `M# (Prime)`, 10, coordFn, typeTag);
    } else {
        factors.forEach(f => plotMarker(cfg, f, "#00ff88", f.toString(), 6, coordFn, typeTag));
        plotMarker(cfg, Mnum, "#3498db", `M# (Comp)`, 10, coordFn, typeTag);
    }
}

/** * MISSING HELPER: Draws the grid background for non-radial plots 
 */
function drawGridBackground(cfg, coordFn, typeTag) {
    const { ctx, stepSize, canvas, centerX, centerY } = cfg;
    if (stepSize <= 2) return;

    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 1n; i <= 2000n; i++) {
        let pos = coordFn(i);
        let gx = centerX + Number(pos.x) * stepSize;
        let gy = centerY + Number(pos.y) * stepSize;
        
        if (gx > -stepSize && gx < canvas.width + stepSize && gy > -stepSize && gy < canvas.height + stepSize) {
            if (typeTag === "hexagon") {
                drawHexPath(ctx, gx, gy, stepSize);
                ctx.stroke();
            } else {
                ctx.strokeRect(gx - stepSize/2, gy - stepSize/2, stepSize, stepSize);
            }

            if (stepSize > 30) {
                ctx.fillStyle = "#444"; 
                ctx.font = `${stepSize * 0.3}px monospace`;
                ctx.fillText(i.toString(), gx, gy);
            }
        }
    }
    ctx.restore();
}

function drawHexPath(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle = (Math.PI / 3) * i + (Math.PI / 6);
        ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }
    ctx.closePath();
}

function drawHexagonPlot(cfg) {
    const { ctx, stepSize, canvas, centerX, centerY } = cfg;
    
    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Increase the limit to ensure the screen is filled
    const limit = 2000n; 

    for (let i = 1n; i <= limit; i++) {
        let pos = getHexCoords(i);
        let gx = centerX + pos.x * stepSize;
        let gy = centerY + pos.y * stepSize;

        // Culling for performance
        if (gx > -stepSize && gx < canvas.width + stepSize && gy > -stepSize && gy < canvas.height + stepSize) {
            
            // Draw the Hexagon Border
            // To make them touch, radius must be stepSize / sqrt(3)
            const hexRadius = stepSize;
            drawHexPath(ctx, gx, gy, hexRadius);
            ctx.stroke();

            // Number every hexagon
            if (stepSize > 30) {
                ctx.fillStyle = "#444";
                ctx.font = `${stepSize * 0.3}px monospace`;
                ctx.fillText(i.toString(), gx, gy);
            }
        }
    }
    ctx.restore();
    
    // Draw markers (1, p, factors) on top
    drawCommonElements(cfg, getHexCoords, "hexagon");
}

function plotMarker(cfg, n, color, label, size, coordFn, type, isOrigin = false) {
    const { ctx, stepSize, centerX, centerY, canvas } = cfg;
    const isExponent = label.startsWith("p(");
    const nBI = BigInt(n);
    const pos = coordFn(nBI);
    const tx = centerX + Number(pos.x) * stepSize;
    const ty = centerY + Number(pos.y) * stepSize;

    const margin = 20;
    const isOffScreen = tx < -stepSize || tx > canvas.width + stepSize || 
                        ty < -stepSize || ty > canvas.height + stepSize;

    const time = performance.now() / 500; 
    ctx.save();

    if (!isOffScreen) {
        markerHitBoxes.push({ n: nBI, x: tx, y: ty, size: Math.max(stepSize, 20), coordFn: coordFn });

        // 1. Set styles based on whether it's an exponent
        if (isExponent) {
            ctx.strokeStyle = color; // Yellow
            ctx.lineWidth = 3;       // Thicker outline
        } else {
            ctx.fillStyle = color;   // Normal solid fill
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
        }
        if (type === "hexagon") {
            drawHexPath(ctx, tx, ty, stepSize); 
            if (isExponent) ctx.stroke(); else { ctx.fill(); ctx.stroke(); }
        }
        // --- ADD THIS BLOCK ---
        else if (type === "mod12") {
    const nNum = Number(nBI);
    const ring = Math.ceil(nNum / 12);
    const modVal = nNum % 12 === 0 ? 12 : nNum % 12; 

    // Define the cell boundaries
    const innerR = (ring - 1) * stepSize;
    const outerR = ring * stepSize;
    
    // Angles for the wedge edges
    const startAngle = (modVal * 30 - 105) * (Math.PI / 180);
    const endAngle = (modVal * 30 - 75) * (Math.PI / 180);

    // --- DRAW EDGES ONLY ---
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR, startAngle, endAngle); // Outer edge
    ctx.arc(centerX, centerY, innerR, endAngle, startAngle, true); // Inner edge
    ctx.closePath();
    
    ctx.strokeStyle = color; 
    ctx.lineWidth = 3; 
    ctx.stroke();

    // --- HITBOX LOGIC ---
    const midR = (ring - 0.5) * stepSize;
    const midAngle = (modVal * 30 - 90) * (Math.PI / 180);
    const hx = centerX + midR * Math.cos(midAngle);
    const hy = centerY + midR * Math.sin(midAngle);
    markerHitBoxes.push({ n: nBI, x: hx, y: hy, size: stepSize, coordFn: coordFn });

    // IMPORTANT: Return early so the code below (which draws text/boxes) is skipped
    ctx.restore();
    return; 
} else {
            // Standard Grids (Binary, Ulam, etc.)
            if (isExponent) {
                ctx.strokeRect(tx - stepSize / 2, ty - stepSize / 2, stepSize, stepSize);
            } else {
                ctx.fillRect(tx - stepSize / 2, ty - stepSize / 2, stepSize, stepSize);
                ctx.strokeRect(tx - stepSize / 2, ty - stepSize / 2, stepSize, stepSize);
            }
        }

        // 3. Update Text Color
        if (stepSize > 20) {
            ctx.fillStyle = isExponent ? color : "#000"; 
            ctx.textAlign = "center"; 
            ctx.textBaseline = "middle"; // This handles vertical centering
            ctx.font = `bold ${stepSize * 0.3}px monospace`; 
            
            // Remove the manual vOff logic; 'middle' baseline is more reliable
            ctx.fillText(n.toString(), tx, ty); 
        }
    } else {
        // --- OFF-SCREEN TRACKING ---
        const edgeX = Math.max(margin, Math.min(canvas.width - margin, tx));
        const edgeY = Math.max(margin, Math.min(canvas.height - margin, ty));

        // --- OFF-SCREEN HITMAP ---
        // We push the edge coordinates so the radar pulses are clickable
        markerHitBoxes.push({ n: nBI, x: edgeX, y: edgeY, size: 25, coordFn: coordFn });

        const pulse = (Math.sin(time * 2) + 1) / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 10 + (pulse * 15), 0, Math.PI * 2);
        ctx.globalAlpha = 1 - pulse;
        ctx.stroke();

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); 
        ctx.arc(edgeX, edgeY, 8, 0, Math.PI * 2); 
        ctx.fill();
        ctx.shadowBlur = 0;

        const angle = Math.atan2(ty - edgeY, tx - edgeX);
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = tx < margin ? "left" : (tx > canvas.width - margin ? "right" : "center");
        const textOffsetX = tx < margin ? 15 : (tx > canvas.width - margin ? -15 : 0);
        const textOffsetY = ty < margin ? 25 : -20;
        const labelText = `${label}`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(edgeX + textOffsetX - (textWidth/2) - 5, edgeY + textOffsetY - 10, textWidth + 10, 18);
        ctx.fillStyle = color;
        ctx.fillText(labelText, edgeX + textOffsetX, edgeY + textOffsetY + 4);
    }
    ctx.restore();
}

function jumpToNumber(nBI, type, refP) {
    const coordFn = getCoordFnByType(type);
    
    // 1. Re-calculate stepSize exactly as plotData does
    const referenceScale = 10n; 
    let baseStepSize = (type === "binary") 
        ? (canvas.width / 40) 
        : (canvas.width / 2.5) / Number(bigIntSqrt(referenceScale));
    
    let finalStep = baseStepSize * zoom;

    // 2. Get the relative world position
    const pos = coordFn(nBI);
    
    // 3. Center the camera: (Middle of Screen) - (Target World Pos * Scale)
    // We do NOT subtract half a stepSize here because the markers 
    // and grid text are already centered on the coordinate point.
    offsetX = (canvas.width / 2) - (Number(pos.x) * finalStep);
    offsetY = (canvas.height / 2) - (Number(pos.y) * finalStep);

    // Re-render
    requestAnimationFrame(plotData);
}

function updateStats(type, allFoundEntries) {
    const statsDiv = document.getElementById('statsDisplay');
    if (!allFoundEntries || allFoundEntries.length === 0) return;

    const getCoordFn = () => {
        switch (type) {
            case "binary": return getBinaryCoords;
            case "ulam": return getSpiralCoordsBigInt;
            case "serpentine": return getSerpentineCoords;
            case "shell": return getShellCoords;
            case "hexagon": return getHexCoords;
            default: return getSpiralCoordsBigInt;
        }
    };

    const coordFn = getCoordFn();
    let html = `<div style="font-family: monospace; line-height: 1.6; font-size: 13px;">`;

    // Iterate through ALL entries instead of just the first one
    allFoundEntries.forEach(({ pVal, entry }) => {
        const Mnum = BigInt(entry.number);
        const factors = entry.factors 
            ? entry.factors.split(',').filter(s => s.trim() !== "").map(s => BigInt(s.trim())) 
            : [];

        const getGeomData = (nBI, index = -1) => {
            let labelText = "";
            switch (type) {
                case "binary": 
                    labelText = index === -1 ? `Bits ${entry.binaryBitlen}, Offset ${entry.binaryOffset}` : `Bits ${entry.factorBinaryBitlen[index]}, Offset ${entry.factorBinaryOffset[index]}`; 
                    break;
                case "ulam": 
                    labelText = index === -1 ? `Shell ${entry.ulamShell}` : `Shell ${entry.factorUlamShell[index]}`; 
                    break;
                case "serpentine": 
                    labelText = index === -1 ? `Row ${entry.serpentineRow}, Col ${entry.serpentineColumn}` : `Row ${entry.factorSerpentineRow[index]}, Col ${entry.factorSerpentineColumn[index]}`; 
                    break;
                case "shell": 
                    labelText = index === -1 ? `Row ${entry.squareRow}, Col ${entry.squareCol}` : `Row ${entry.factorSquareRow[index]}, Col ${entry.factorSquareCol[index]}`; 
                    break;
                case "hexagon": 
                    labelText = index === -1 ? `Shell ${entry.hexagonShell}` : `Shell ${entry.factorHexagonShell[index]}`; 
                    break;
            }
            return `<span style="color: #bbb;">${labelText}</span>`;
        };

        // Header for each sequence
        html += `<div style="color: #ffff00; margin-top: 10px; border-bottom: 1px solid #333; padding-bottom: 2px;">SEQUENCE: ${entry.form}</div>`;

        // Main Number Row
        const mValueColor = factors.length > 0 ? '#3498db' : '#e74c3c'; 
        html += `<div style="margin-left: 10px;">
                    <span style="color: #bbb;">Number:</span> 
                    <b style="color: ${mValueColor}; cursor: pointer;" onclick="jumpToNumber(BigInt('${Mnum}'), '${type}', ${pVal})">${Mnum}</b><span style="color: #bbb;">,</span>  
                    ${getGeomData(Mnum)}
                 </div>`;

        // Factor Rows
        factors.forEach((f, i) => {
            html += `<div style="margin-left: 10px;">
                        <span style="color: #bbb;">Factor:</span> 
                        <b style="color: #00ff88; cursor: pointer;" onclick="jumpToNumber(BigInt('${f}'), '${type}', ${pVal})">${f}</b>
                        <span style="color: #bbb;">,</span>  
                        ${getGeomData(f, i)}
                    </div>`;
        });
    });
    html += `</div>`;
    statsDiv.innerHTML = html;
}

window.onload = () => { recenterCamera(); };
