

    document.addEventListener('DOMContentLoaded', initializeSvgInteractions);
    document.addEventListener('astro:after-swap', initializeSvgInteractions);

    function initializeSvgInteractions() {
        const svg = document.getElementById('worldmap');
        if(!svg) return

        const tooltip = document.getElementById('tooltip');
        let isPanning = false;
        let startX = 0, startY = 0;
        let viewBox = { x: 0, y: 0, width: 800, height: 600 };

        function setInitialViewBox() {
            const svgRect = svg.getBoundingClientRect();
            const contentWidth = 2528;
            const contentHeight = 1200;
            const contentAspectRatio = contentWidth / contentHeight;
            const containerAspectRatio = svgRect.width / svgRect.height;
            let viewBoxWidth, viewBoxHeight;
            if (containerAspectRatio > contentAspectRatio) {
                viewBoxHeight = contentHeight;
                viewBoxWidth = contentHeight * containerAspectRatio;
            } else {
                viewBoxWidth = contentWidth;
                viewBoxHeight = contentWidth / containerAspectRatio;
            }
            viewBox = {
                x: 83 - (viewBoxWidth - contentWidth) / 2,
                y: 45 - (viewBoxHeight - contentHeight) / 2,
                width: viewBoxWidth,
                height: viewBoxHeight,
            };
            svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
        }

        function showTooltip(event) {
            const target = event.target.closest('a');
            if (target) {
                const title = target.getAttribute('title');
                if (title) {

                    const { clientX: mouseX, clientY: mouseY } = event;
                    tooltip.style.left = `${mouseX + 10}px`;
                    tooltip.style.top = `${mouseY + 10}px`;

                    tooltip.innerText = title;

                    tooltip.style.display = 'block';
                }
            }
        }

        function hideTooltip() {
            tooltip.style.display = 'none';
        }

        svg.addEventListener('mouseover', showTooltip);
        svg.addEventListener('mousemove', showTooltip);
        svg.addEventListener('mouseout', hideTooltip);

        // Existing event listeners for panning and zooming
        svg.addEventListener('mousedown', e => {
            isPanning = true;
            startX = e.clientX;
            startY = e.clientY;
        });

        svg.addEventListener('mousemove', (e) => {
            if (isPanning) {
                viewBox.x += startX - e.clientX;
                viewBox.y += startY - e.clientY;
                svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
                startX = e.clientX;
                startY = e.clientY;
            }
        });

        svg.addEventListener('mouseup', () => isPanning = false);
        svg.addEventListener('mouseleave', () => isPanning = false);

        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scaleFactor = 1 - e.deltaY * 0.002;
            zoom(scaleFactor, e.clientX, e.clientY);
        });

        function zoom(scaleFactor, clientX, clientY) {
            const svgPoint = svg.createSVGPoint();
            const loc = Object.assign(svgPoint, { x: clientX, y: clientY }).matrixTransform(svg.getScreenCTM().inverse());
            const newWidth = viewBox.width * scaleFactor;
            const newHeight = viewBox.height * scaleFactor;
            if ((newWidth <= 5500 && newHeight <= 5500) || scaleFactor < 1) {
                if (newWidth >= 100 && newHeight >= 100) {
                    viewBox.x = loc.x - (loc.x - viewBox.x) * scaleFactor;
                    viewBox.y = loc.y - (loc.y - viewBox.y) * scaleFactor;
                    viewBox.width = newWidth;
                    viewBox.height = newHeight;
                    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
                }
            }
        }

        document.getElementById('zoom-in-button').addEventListener('click', () => {
            zoom(0.8, svg.clientWidth / 2, svg.clientHeight / 2);
        });

        document.getElementById('zoom-out-button').addEventListener('click', () => {
            zoom(1.2, svg.clientWidth / 2, svg.clientHeight / 2);
        });

        function activateView(buttonId, viewClass) {
            if(!document.getElementById(buttonId)) return
            document.getElementById(buttonId).addEventListener('click', () => {
                const worldMap = document.querySelector('#worldmap');
                worldMap.classList.forEach(className => {
                    if (className.startsWith('current-view-')) {
                        worldMap.classList.remove(className);
                    }
                });
                worldMap.classList.add(viewClass);
            });
        }

        activateView('wwl-activate-button', 'current-view-wwl');
        activateView('pop-activate-button', 'current-view-pop');

        setInitialViewBox();
    }