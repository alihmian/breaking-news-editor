const log = console.log;

const canvasSize = 2000;

// Create main Konva stage (canvas)
const stage = new Konva.Stage({
    container: "konva-holder",
    width: canvasSize,
    height: canvasSize,
});

// Create three layers: base (template), user image, overlay
const baseLayer = new Konva.Layer();
const userLayer = new Konva.Layer();
const overlayLayer = new Konva.Layer();

stage.add(baseLayer);
stage.add(userLayer);
stage.add(overlayLayer);

let transformer; // global reference

// Load base template image (background)
Konva.Image.fromURL('/base_news_template.png', function (bg) {
    console.log("Base template loaded ✅");
    bg.setAttrs({
        x: 0,
        y: 0,
        width: canvasSize,
        height: canvasSize,
    });
    baseLayer.add(bg);
    baseLayer.draw();
});

// Load user image (draggable and resizable)
Konva.Image.fromURL('/user_uploaded_image.png', function (userImg) {
    console.log("User image loaded ✅");
    userImg.setAttrs({
        x: 0,
        y: 0,
        draggable: true,
        width: canvasSize,
        height: canvasSize,
    });

    userLayer.add(userImg);

    transformer = new Konva.Transformer({
        nodes: [userImg],
        rotateEnabled: false,
        boundBoxFunc: (oldBox, newBox) => {
            if (newBox.width < 100 || newBox.height < 100) {
                return oldBox;
            }
            return newBox;
        }
    });

    userLayer.add(transformer);
    userLayer.draw();
});

// Load overlay image (top frame)
Konva.Image.fromURL('/overlay.png', function (overlay) {
    console.log("Overlay loaded ✅");
    overlay.setAttrs({
        x: 0,
        y: 0,
        width: canvasSize,
        height: canvasSize,
        listening: false
    });
    overlayLayer.add(overlay);
    overlayLayer.draw();
});

// Extract token from URL path (e.g., /crop/abc123)
function getTokenFromURL() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1];
}

// Handle export and submit to server
document.getElementById('export-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = getTokenFromURL();

    // Remove transformer before exporting
    if (transformer) transformer.detach();
    userLayer.draw();

    const dataURL = stage.toDataURL({ pixelRatio: 2 }); // high quality
    const base64 = dataURL.split(',')[1];

    try {
        const response = await fetch(`/save-cropped-image/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
        });

        const message = document.getElementById('message');
        message.style.display = 'block';

        if (response.ok) {
            message.textContent = '✅ Changes saved. You can now close this window and go back to Telegram.';
        } else {
            message.textContent = '❌ Failed to save image. Try again.';
            message.style.color = 'red';
        }
    } catch (err) {
        console.error('Error saving image:', err);
        const message = document.getElementById('message');
        message.textContent = '❌ An error occurred. Check your internet or try again.';
        message.style.display = 'block';
        message.style.color = 'red';
    }
});

// Auto-scale canvas for display
function scaleCanvasToFit() {
    const container = document.getElementById('canvas-container');
    const holder = document.getElementById('konva-holder');
    const scale = container.offsetWidth / canvasSize;

    holder.style.transform = `scale(${scale})`;
    holder.style.transformOrigin = 'top left';
}

// Run on load and resize
window.addEventListener('load', scaleCanvasToFit);
window.addEventListener('resize', scaleCanvasToFit);
