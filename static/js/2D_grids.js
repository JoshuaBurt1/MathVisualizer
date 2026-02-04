/**
 * --- GLOBAL CAMERA STATE ---
 */
const MAX_N = 10000;
const isPrime = new Array(MAX_N).fill(true);
isPrime[0] = isPrime[1] = false;
for (let p = 2; p * p < MAX_N; p++) {
    if (isPrime[p]) {
        for (let i = p * p; i < MAX_N; i += p)
            isPrime[i] = false;
    }
}

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

document.addEventListener('change', (e) => {
    if (e.target.id === 'showLines') {
        plotData();
    }
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

function checkPrimality(n) {
    let val = BigInt(n);
    if (val < 2n) return false;
    if (val === 2n || val === 3n) return true;
    if (val % 2n === 0n || val % 3n === 0n) return false;
    
    // For custom formulas, check against your pre-computed Sieve first (Fastest)
    if (val < BigInt(MAX_N)) return isPrime[Number(val)];

    // Fallback: Simple trial division for large custom numbers (Still faster than JSON)
    for (let i = 5n; i * i <= val; i += 6n) {
        if (val % i === 0n || val % (i + 2n) === 0n) return false;
    }
    return true;
}

function getFactorsBigInt(n) {
    let val = BigInt(n);
    const factors = [];
    if (val < 2n) return factors;

    let temp = val;
    // Handle 2 separately
    while (temp % 2n === 0n) {
        factors.push(2n);
        temp /= 2n;
    }
    // Handle 3 separately
    while (temp % 3n === 0n) {
        factors.push(3n);
        temp /= 3n;
    }

    // Trial division up to a reasonable limit (1,000,000) for UI responsiveness
    let i = 5n;
    const limit = 1000000n; 
    while (i * i <= temp && i < limit) {
        while (temp % i === 0n) {
            factors.push(i);
            temp /= i;
        }
        i += 2n;
        while (temp % i === 0n) {
            factors.push(i);
            temp /= i;
        }
        i += 4n;
    }

    // If temp > 1, the remaining part is either prime or has very large factors
    if (temp > 1n && temp !== val) {
        factors.push(temp);
    }

    // Return unique factors to avoid cluttering the map with duplicates (like 2, 2, 2)
    return [...new Set(factors)];
}

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

/**
 * Evaluates a string formula (e.g., "n^2 + 1") using BigInt.
 * Replaces '^' with '**' for JS compatibility.
 */
function evaluateCustomFormula(formulaStr, nValue) {
    try {
        // Prepare the formula string: replace '^' with '**'
        const jsFormula = formulaStr.replace(/\^/g, '**');
        
        // Create a function that treats 'n' as a BigInt
        // We wrap components in BigInt() to ensure type consistency
        const evaluator = new Function('n', `
            try {
                return BigInt(${jsFormula.replace(/(\d+)/g, 'BigInt($1)')});
            } catch(e) {
                return BigInt(eval("${jsFormula}"));
            }
        `);
        return evaluator(BigInt(nValue));
    } catch (e) {
        console.error("Formula Error:", e);
        return null;
    }
}

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
    const customFormulaStr = document.getElementById('customFormula')?.value || "n"; 
    
    const pValues = parsePInput(pInputRaw);
    if (pValues.length === 0) return;

    let allFoundEntries = [];

    pValues.forEach(pVal => {
        let entry = null;

        if (formulaType === "custom") {
            const calculatedM = evaluateCustomFormula(customFormulaStr, pVal);
            if (calculatedM === null) return;

            const isActuallyPrime = checkPrimality(calculatedM);
            
            // Calculate factors for the custom number
            // We only run this if it's not prime to save performance
            let factorList = isActuallyPrime ? [] : getFactorsBigInt(calculatedM);

            entry = {
                number: calculatedM.toString(),
                form: `${customFormulaStr}, n=${pVal}`,
                p: pVal,
                // Convert BigInt array to comma-separated string for compatibility
                factors: factorList.map(f => f.toString()).join(', ')
            };
            entry.isActuallyPrime = isActuallyPrime;
        } else {
            // Standard Logic: Rely on JSON factors
            const formulaLabel = `2^${pVal}${formulaType === "minus" ? "-1" : "+1"}`;
            entry = visualData.find(d => d.form === formulaLabel || (d.p == pVal && d.type === formulaType));
            
            if (entry) {
                // If factors string is empty or null, it's prime in our DB
                entry.isActuallyPrime = (!entry.factors || entry.factors.trim() === "");
            }
        }

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
        
        // Use the flag we set in the loop above
        const drawCfg = { 
            ...gridCfg, 
            p: BigInt(pVal), 
            Mnum, 
            factors, 
            isMnumPrime: entry.isActuallyPrime 
        };
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

    // Get active P values to hide grey "ghost" numbers behind yellow highlights
    const pInputRaw = document.getElementById('pInput').value;
    const activePs = parsePInput(pInputRaw).map(p => BigInt(p));

    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;

    for (let i = 1n; i <= 4096n; i++) {
        let pos = coordFn(i);
        let gx = centerX + Number(pos.x) * stepSize;
        let gy = centerY + Number(pos.y) * stepSize;
        
        if (gx >= 0 && gx <= canvas.width && gy >= 0 && gy <= canvas.height) {
            const nNum = Number(i);

            // 1. DRAW GRID SHAPE
            if (typeTag === "hexagon") {
                drawHexPath(ctx, gx, gy, stepSize);
                ctx.stroke();
            } else {
                ctx.strokeRect(gx - stepSize/2, gy - stepSize/2, stepSize, stepSize);
            }

            // 2. DRAW PRIME "POCKET" BOX (Only if Prime)
            if (isPrime[nNum] && stepSize > 40) {
                const boxSize = stepSize * 0.25;
                ctx.beginPath();
                
                if (typeTag === "hexagon") {
                    // Hexagon Top-Right Vertex Logic
                    const angle = -Math.PI / 6; // 330 degrees
                    const vx = gx + stepSize * Math.cos(angle);
                    const vy = gy + stepSize * Math.sin(angle);
                    
                    // Draw lines following hexagon edges inward
                    ctx.moveTo(vx - boxSize, vy + (boxSize * 0.5)); 
                    ctx.stroke();

                    // Label P
                    ctx.fillStyle = "#666";
                    ctx.font = `${stepSize * 0.15}px monospace`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("P", vx - boxSize * 0.7, vy + boxSize * 0.3);
                } else {
                    // Square Top-Right Logic
                    const top = gy - stepSize / 2;
                    const right = gx + stepSize / 2;

                    ctx.moveTo(right - boxSize, top);
                    ctx.stroke();

                    // Label P
                    ctx.fillStyle = "#666";
                    ctx.font = `${boxSize * 0.7}px monospace`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("P", right - (boxSize/2), top + (boxSize/2));
                }
            }

            // 3. DRAW BACKGROUND NUMBER
            // Only draw if not currently highlighted in yellow
            const isHighlighted = activePs.includes(i);
            if (stepSize > 30 && !isHighlighted) {
                ctx.fillStyle = "#444"; 
                ctx.font = `${stepSize * 0.3}px monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(i.toString(), gx, gy);
            }
        }
    }
    ctx.restore();
}

// Draws the dashed lines and the colored squares/hexagons for the data
function drawMarkersAndLines(cfg, coordFn, typeTag) {
    const { ctx, stepSize, p, Mnum, factors, canvas, centerX, centerY, isMnumPrime } = cfg;

    const drawLine = (targetN, color) => {
        // Check the toggle inside the line helper specifically
        if (document.getElementById('showLines') && !document.getElementById('showLines').checked) {
            return; 
        }

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;

        const endPos = coordFn(targetN);
        
        if (typeTag === "mod12") {
            ctx.moveTo(centerX, centerY); 
        } else {
            const startPos = coordFn(1n);
            ctx.moveTo(centerX + Number(startPos.x) * stepSize, centerY + Number(startPos.y) * stepSize);
        }

        ctx.lineTo(centerX + Number(endPos.x) * stepSize, centerY + Number(endPos.y) * stepSize);
        ctx.stroke();
        ctx.restore();
    };

    // Determine colors based on the primality flag passed from plotData
    const mnumColor = isMnumPrime ? "#e74c3c" : "#3498db";
    const mnumLabel = isMnumPrime ? `M# (Prime)` : `M# (Comp)`;

    // Draw tracker lines
    drawLine(p, "#ffff00");
    factors.forEach(f => {
        if (typeof f === 'bigint') drawLine(f, "#00ff88");
    });
    drawLine(Mnum, mnumColor);

    // --- 3. DRAW MARKERS ---
    if (typeTag !== "mod12") {
        plotMarker(cfg, 1n, "#ffffff", "1", 12, coordFn, typeTag); 
    }    
    // Draw the main calculated number
    plotMarker(cfg, Mnum, mnumColor, mnumLabel, 10, coordFn, typeTag);
    plotMarker(cfg, p, "#ffff00", `p(${p})`, 8, coordFn, typeTag); 

    // Draw factors only if they are actual numbers (BigInts)
    factors.forEach(f => {
        if (typeof f === 'bigint') {
            plotMarker(cfg, f, "#00ff88", f.toString(), 6, coordFn, typeTag);
        }
    });
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

    for (let i = 1n; i <= 4096n; i++) {
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
    const limit = 4096n; 

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
    const isFactor = color === "#00ff88"; 
    const isPower = color === "#ffff00" || isExponent;
    const nBI = BigInt(n);
    const pos = (type === "mod12") ? getMod12Coords(nBI) : coordFn(nBI);
    
    const tx = centerX + Number(pos.x) * stepSize;
    const ty = centerY + Number(pos.y) * stepSize;

    const margin = 20;
    const isOffScreen = tx < -stepSize || tx > canvas.width + stepSize || 
                        ty < -stepSize || ty > canvas.height + stepSize;

    ctx.save();

    if (!isOffScreen) {
        markerHitBoxes.push({ n: nBI, x: tx, y: ty, size: Math.max(stepSize, 20), coordFn: coordFn });

        // --- 1. GEOMETRY DRAWING (Cells/Borders) ---
        if (type === "mod12") {
            const innerR = (pos.ring - 1) * stepSize;
            const outerR = pos.ring * stepSize;
            const startAngle = pos.angle - (15 * Math.PI / 180);
            const endAngle = pos.angle + (15 * Math.PI / 180);

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerR, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerR, endAngle, startAngle, true);
            ctx.closePath();

            // Rule: Only stroke if it's NOT a factor and NOT a power
            if (!isFactor && !isPower) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        } else {
            // Standard Grid / Hexagon logic
            if (!isFactor && !isPower) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                if (type === "hexagon") {
                    drawHexPath(ctx, tx, ty, stepSize);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(tx - stepSize / 2, ty - stepSize / 2, stepSize, stepSize);
                }
            }
        }

        // --- 2. TEXT & INDICATORS ---
        if (stepSize > 15) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // --- Inside plotMarker function, under TEXT & INDICATORS ---

            if (isFactor) {
                const fontSize = stepSize * 0.2;
                ctx.font = `${fontSize}px monospace`;
                ctx.fillStyle = "#00ff88";

                if (type === "mod12") {
                    // ... (Keep your working Mod12 logic here)
                    const fAngle = pos.angle - (8 * Math.PI / 180);
                    const fRadius = (pos.ring - 0.7) * stepSize;
                    const fx = centerX + fRadius * Math.cos(fAngle);
                    const fy = centerY + fRadius * Math.sin(fAngle);
                    ctx.fillText("F", fx, fy);
                } else if (type === "hexagon") {
                    // --- FIXED HEXAGON LOGIC ---
                    // P is at -30 deg (330). Opposite is 150 deg (5*PI/6)
                    const oppositeAngle = 5 * Math.PI / 6; 
                    
                    // Calculate the vertex position at 150 degrees
                    const vx = tx + stepSize * Math.cos(oppositeAngle);
                    const vy = ty + stepSize * Math.sin(oppositeAngle);
                    
                    // Offset "F" inward toward the center of the hexagon, 
                    // mirroring the P-label's inward offset
                    const offsetX = (stepSize * 0.2) * Math.cos(oppositeAngle + Math.PI);
                    const offsetY = (stepSize * 0.2) * Math.sin(oppositeAngle + Math.PI);
                    
                    ctx.fillText("F", vx + offsetX, vy + offsetY);
                } else {
                    // Standard Square Logic (Bottom-Left is opposite Top-Right)
                    const bottom = ty + stepSize / 2;
                    const left = tx - stepSize / 2;
                    ctx.fillText("F", left + (stepSize * 0.15), bottom - (stepSize * 0.15));
                }
            }

            // Main Number Rendering
            ctx.font = `${stepSize * 0.3}px monospace`;
            if (isPower) {
                ctx.fillStyle = "#ffff00"; // Power highlight
            } else {
                ctx.fillStyle = "#ffffff"; // Standard white for primes/composites
            }
            ctx.fillText(n.toString(), tx, ty);
        }

    } else {
        // --- OFF-SCREEN TRACKING ---
        const time = performance.now() / 500;
        const edgeX = Math.max(margin, Math.min(canvas.width - margin, tx));
        const edgeY = Math.max(margin, Math.min(canvas.height - margin, ty));
        
        markerHitBoxes.push({ n: nBI, x: edgeX, y: edgeY, size: 20, coordFn: coordFn });

        const pulse = (Math.sin(time * 2) + 1) / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 10 + (pulse * 15), 0, Math.PI * 2);
        ctx.globalAlpha = 1 - pulse;
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = color;
        ctx.beginPath(); 
        ctx.arc(edgeX, edgeY, 8, 0, Math.PI * 2); 
        ctx.fill();
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

    const formulaType = document.getElementById('formulaType').value;

    let html = `<div style="font-family: monospace; line-height: 1.6; font-size: 13px;">`;

    allFoundEntries.forEach(({ pVal, entry }) => {
        const Mnum = BigInt(entry.number);
        const factors = entry.factors 
            ? entry.factors.split(',').filter(s => s.trim() !== "").map(s => BigInt(s.trim())) 
            : [];

        // Helper to handle geometric labels for custom or standard formulas
        const getGeomData = (nBI, index = -1) => {
    const pos = getCoordFnByType(type)(nBI);
    const toBI = (val) => typeof val === 'bigint' ? val : BigInt(Math.floor(val));

    // --- CUSTOM FORMULA FORMATTING ---
    if (formulaType === "custom") {
        let label = "";
        switch (type) {
            case "binary":
                // Row + 1, Offset - 1
                const bRow = toBI(pos.y) + 1n;
                const bOff = toBI(pos.x);
                label = `Bits ${bRow}, Offset ${bOff}`;
                break;

            case "ulam":
            case "hexagon":
                // Shell logic + 1
                let shellVal;
                if (type === "hexagon") {
                    shellVal = Math.ceil((3 + Math.sqrt(9 - 12 * (1 - Number(nBI)))) / 6);
                } else {
                    // Ulam/Spiral shell calculation + 1
                    shellVal = (bigIntSqrt(nBI - 1n) + 1n) / 2n + 1n;
                }
                label = `Shell ${shellVal}`;
                break;

            case "shell":
            case "serpentine":
                // Grid-based: Row + 1, Col + 1
                label = `Row ${toBI(pos.y) + 1n}, Col ${toBI(pos.x) + 1n}`;
                break;

            default:
                label = `X: ${toBI(pos.x) + 1n}, Y: ${toBI(pos.y) + 1n}`;
        }
        return `<span style="color: #bbb;">${label}</span>`;
    }

            let labelText = "";
            try {
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
            } catch(e) { labelText = "N/A"; }
            return `<span style="color: #bbb;">${labelText}</span>`;
        };

        // Header for each sequence
        html += `<div style="color: #ffff00; margin-top: 10px; border-bottom: 1px solid #333; padding-bottom: 2px;">SEQUENCE: ${entry.form}</div>`;

        // --- MAIN NUMBER COLOR LOGIC ---
        // Red if prime (#e74c3c), Blue if composite (#3498db)
        const mValueColor = entry.isActuallyPrime ? '#e74c3c' : '#3498db'; 
        html += `<div>
                    <span style="color: #bbb;">Number:</span> 
                    <b style="color: ${mValueColor}; cursor: pointer;" onclick="jumpToNumber(BigInt('${Mnum}'),'${type}', ${pVal})">${Mnum}<span style="color: #bbb;">,</span></b>
                    ${getGeomData(Mnum)}
                 </div>`;

        // --- FACTOR COLOR LOGIC ---
        // Always Green (#00ff88)
        factors.forEach((f, i) => {
            html += `<div>
                        <span style="color: #bbb;"> Factor:</span> 
                        <b style="color: #00ff88; cursor: pointer;" onclick="jumpToNumber(BigInt('${f}'), '${type}', ${pVal})">${f}<span style="color: #bbb;">,</span></b>
                        ${getGeomData(f, i)}
                    </div>`;
        });
    });

    html += `</div>`;
    statsDiv.innerHTML = html;
}

function toggleCustomInput() {
    const type = document.getElementById('formulaType').value;
    const customGroup = document.getElementById('customFormulaGroup');
    if (customGroup) {
        customGroup.style.display = (type === 'custom') ? 'block' : 'none';
    }
}

// Update your existing onPlotChange or add to event listeners
document.getElementById('formulaType').addEventListener('change', () => {
    toggleCustomInput();
    plotData();
});

window.onload = () => { recenterCamera(); };
