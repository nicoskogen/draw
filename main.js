let canvasArray = [];
let eraserMode = false;

if (localStorage.getItem('savedCanvasArray')) {
	canvasArray = JSON.parse(localStorage.getItem('savedCanvasArray'));
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let cellSize = 30;
document.getElementById('cellSize').addEventListener('change', function () {
	cellSize = parseInt(this.value);
});

function changeGridSize() {}
let isDrawing = false;

canvas.width = 900;
canvas.height = 900;

const undoStack = [];

function captureCanvas() {
	undoStack.push(canvas.toDataURL());
}

canvas.addEventListener('mousedown', (e) => {
	isDrawing = true;
	paintCell(e);
});

canvas.addEventListener('mousemove', (e) => {
	if (isDrawing) {
		paintCell(e);
	}
});

canvas.addEventListener('mouseup', () => {
	isDrawing = false;
	captureCanvas();
});
function toggleEraser() {
	eraserMode = !eraserMode;
	if (eraserMode) {
		console.log('Eraser mode ON');
	} else {
		console.log('Eraser mode OFF');
	}
}
function loadLatestCanvas() {
	if (canvasArray.length === 0) {
		console.log('No items in the canvas array!');
		return;
	}

	const latestCanvasData = canvasArray[canvasArray.length - 1];
	const img = new Image();

	img.onload = function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
	};

	img.src = latestCanvasData;
}

function paintCell(e) {
	const x = Math.floor(e.offsetX / cellSize) * cellSize;
	const y = Math.floor(e.offsetY / cellSize) * cellSize;

	if (eraserMode) {
		ctx.clearRect(x, y, cellSize, cellSize);
	} else {
		ctx.fillRect(x, y, cellSize, cellSize);
	}
}

function undo() {
	if (undoStack.length > 1) {
		undoStack.pop(); // Remove current state
		const previousState = undoStack[undoStack.length - 1];
		const img = new Image();
		img.src = previousState;
		img.onload = function () {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
		};
	}
}

function resetCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

document.addEventListener('keydown', (e) => {
	if (e.key === 'Backspace') {
		undo();
	}
});

captureCanvas(); // Capture initial state

function saveCanvas() {
	const link = document.createElement('a');
	link.href = canvas.toDataURL();
	link.download = 'canvas.png';
	link.click();
}

function addToCanvasArray() {
	canvasArray.push(canvas.toDataURL());
	console.log('Canvas added to array. Total items: ' + canvasArray.length);

	// Saving to LocalStorage
	localStorage.setItem('savedCanvasArray', JSON.stringify(canvasArray));
}

function clearCanvasArray() {
	canvasArray.length = 0;
	// Clear LocalStorage
	localStorage.removeItem('savedCanvasArray');
	console.log('Canvas array and LocalStorage cleared.');
}

function drawEdgePixels() {
	// Top and Bottom edges
	for (let i = 0; i < canvas.width; i += cellSize) {
		ctx.fillRect(i, 0, cellSize, cellSize); // Top edge
		ctx.fillRect(i, canvas.height - cellSize, cellSize, cellSize); // Bottom edge
	}

	// Left and Right edges
	for (let j = 0; j < canvas.height; j += cellSize) {
		ctx.fillRect(0, j, cellSize, cellSize); // Left edge
		ctx.fillRect(canvas.width - cellSize, j, cellSize, cellSize); // Right edge
	}
}

function animateCanvasArray() {
	const newWindow = window.open('', '_blank');

	newWindow.document.write(`
        <canvas id="animationCanvas" width="${canvas.width}" height="${
		canvas.height
	}"></canvas>
        <script>
            const canvasArray = ${JSON.stringify(canvasArray)};
            const canvas = document.getElementById('animationCanvas');
            const ctx = canvas.getContext('2d');
            const duration = 1000; // each canvas state will be shown for 1 second
            
            let currentFrame = 0;
            let alpha = 1;  // starts at full opacity
            let lastTimestamp = 0;

            function drawCanvasFromData(data, alpha=1) {
                const img = new Image();
                img.onload = function() {
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(img, 0, 0);
                    ctx.globalAlpha = 1;  // reset to default
                };
                img.src = data;
            }

            function animate(timestamp) {
                if (currentFrame >= canvasArray.length) return;

                if (!lastTimestamp) lastTimestamp = timestamp;

                const elapsed = timestamp - lastTimestamp;

                if (elapsed > duration) {
                    lastTimestamp = timestamp;
                    alpha = 1;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    currentFrame++;
                } else {
                    alpha = 1 - (elapsed / duration);
                }

                if (currentFrame < canvasArray.length) {
                    drawCanvasFromData(canvasArray[currentFrame], alpha);
                    requestAnimationFrame(animate);
                }
            }

            animate(0);
        </script>
    `);
}
function animateCanvasArraySideBySide() {
	// Temporarily save the canvasArray in localStorage
	localStorage.setItem(
		'temporaryCanvasArrayForAnimation',
		JSON.stringify(canvasArray)
	);

	const newWindow = window.open('', '_blank');

	// Use `canvasArray` to determine the totalWidth
	const totalWidth = canvas.width * canvasArray.length;
	const totalHeight = canvas.height;

	newWindow.document.write(`
        <canvas id="animationCanvas" width="${totalWidth}" height="${totalHeight}"></canvas>
        <script>
            const canvas = document.getElementById('animationCanvas');
            const ctx = canvas.getContext('2d');
            const jitter = 3;

            // Read from localStorage directly
            const animationCanvasArray = JSON.parse(localStorage.getItem('temporaryCanvasArrayForAnimation')); 

            // Clean up after reading to ensure that it's truly temporary
            localStorage.removeItem('temporaryCanvasArrayForAnimation');

            function drawCanvasFromData(data, x, y) {
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, x, y);
                };
                img.src = data;
            }

            for (let i = 0; i < animationCanvasArray.length; i++) {
                const x = i * canvas.width;  
                const y = 0;  
                drawCanvasFromData(animationCanvasArray[i], x, y);
            }
        </script>
    `);
}

function exportToJson() {
	const dataStr =
		'data:text/json;charset=utf-8,' +
		encodeURIComponent(JSON.stringify(canvasArray));
	const downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute('href', dataStr);
	downloadAnchorNode.setAttribute('download', 'canvasArray.json');
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}
function importFromJson(event) {
	const file = event.target.files[0];

	if (file) {
		const reader = new FileReader();

		reader.onload = function (e) {
			const contents = e.target.result;
			canvasArray = JSON.parse(contents);

			// Optionally, save to LocalStorage after importing
			localStorage.setItem('savedCanvasArray', JSON.stringify(canvasArray));

			console.log(
				'Imported ' + canvasArray.length + ' canvas states from JSON.'
			);
		};

		reader.readAsText(file);
	} else {
		console.log('Failed to load file');
	}
}
function exportAllCanvases() {
	// Ensure there's something to export
	if (canvasArray.length === 0) {
		console.log('No canvases to export!');
		return;
	}

	canvasArray.forEach((dataUrl, index) => {
		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = `canvas_${index + 1}.png`;
		document.body.appendChild(link); // This is required for Firefox
		link.click();
		document.body.removeChild(link); // Clean up after download
	});

	console.log('All canvases exported!');
}
