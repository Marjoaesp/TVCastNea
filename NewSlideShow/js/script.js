document.addEventListener('DOMContentLoaded', function() {
    var slideshow = document.querySelector('.slideshow');
    var currentIndex = 0;
    var timeout;
    var currentImages = [];
    var defaultDisplayTime = 5000; // Default display time for items without specified displayTime
    var currentConfigIndex = 1;
    var zipFilename = `config-${currentConfigIndex}.zip`;
    var localStorageKey = 'slideshowZip';
    var zipUrl = `http://localhost:8080/config-${currentConfigIndex}.zip`;

    async function fetchAndExtractZip(zipUrl) {
        const response = await fetch(zipUrl);
        const blob = await response.blob();
        return blob;
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function base64ToBlob(base64, type) {
        const binary = atob(base64);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type });
    }

    async function processConfig(zip) {
        try {
            const mediaFiles = [];
            // Iterate through each file in the ZIP
            await Promise.all(Object.keys(zip.files).map(async filename => {
                // Check if the file is a .jpg image
                if (filename.match(/\.jpg$/i)) {
                    const file = zip.file(filename);
                    const blob = await file.async("blob");
                    const objectURL = URL.createObjectURL(blob);
                    mediaFiles.push({ title: filename, url: objectURL, isVideo: false });
                }
                // Check if the file is a .mp4 video
                if (filename.match(/\.mp4$/i)) {
                    const file = zip.file(filename);
                    const blob = await file.async("blob");
                    const objectURL = URL.createObjectURL(blob);
                    // Get video duration
                    const video = document.createElement('video');
                    video.src = objectURL;
                    video.load();
                    await new Promise(resolve => {
                        video.addEventListener('loadedmetadata', function() {
                            const duration = Math.round(video.duration * 1000); // Convert duration to milliseconds
                            mediaFiles.push({ title: filename, url: objectURL, isVideo: true, displayTime: duration });
                            resolve();
                        });
                    });
                }
            }));
            return mediaFiles;
        } catch (error) {
            console.error('Error processing config:', error);
            throw error;
        }
    }

    function showSlide(index) {
        var slides = document.querySelectorAll('.slideshow li');
        slides.forEach(function(slide, i) {
            var span = slide.querySelector('span');
            var video = slide.querySelector('video');
            var div = slide.querySelector('div');

            if (i === index) {
                if (span) {
                    span.style.opacity = 1;
                    span.style.transform = 'scale(1.0)';
                }
                if (video) {
                    video.style.opacity = 1;
                    video.currentTime = 0;
                    video.play();
                }
                div.style.opacity = 1;
            } else {
                if (span) {
                    span.style.opacity = 0;
                    span.style.transform = 'scale(1)';
                }
                if (video) {
                    video.style.opacity = 0;
                    video.pause();
                    video.currentTime = 0;
                }
                div.style.opacity = 0;
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % currentImages.length;
        showSlide(currentIndex);
        clearTimeout(timeout);
        var currentSlide = currentImages[currentIndex];
        timeout = setTimeout(nextSlide, currentSlide.displayTime || defaultDisplayTime);
    }

    function cacheMediaFiles(images) {
        images.forEach(function(image) {
            var fullUrl = image.url;
            if (!image.isVideo) {
                var img = new Image();
                img.src = fullUrl;
            }
        });
    }

    function initSlideshow(images) {
        slideshow.innerHTML = ''; // Clear current content
        images.forEach(function(image) {
            var li = document.createElement('li');
            var div = document.createElement('div');
            var h3 = document.createElement('h3');

            h3.textContent = image.title;
            div.appendChild(h3);
            li.appendChild(div);

            var fullUrl = image.url;

            if (image.isVideo) {
                var video = document.createElement('video');
                video.src = fullUrl;
                video.autoplay = false;
                video.muted = true; // Mute audio
                video.loop = false; // No loop
                video.style.opacity = 0;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                video.style.position = 'absolute';
                video.style.top = 0;
                video.style.left = 0;

                li.appendChild(video);
            } else {
                var span = document.createElement('span');
                span.style.backgroundImage = 'url(' + fullUrl + ')';
                li.appendChild(span);
            }

            slideshow.appendChild(li);
        });

        currentImages = images;
        currentIndex = 0;

        Promise.resolve().then(() => {
            clearTimeout(timeout);
            timeout = setTimeout(nextSlide, currentImages[currentIndex].displayTime || defaultDisplayTime);
            showSlide(currentIndex);
        });

        cacheMediaFiles(images);
    }

    async function updateSlideshow() {
        try {
            let zipBlob;

            // Check if ZIP file is available in local storage
            const storedZip = localStorage.getItem(localStorageKey);
            if (storedZip) {
                zipBlob = base64ToBlob(storedZip, 'application/zip');
            } else {
                // Fetch ZIP file from server
                zipBlob = await fetchAndExtractZip(zipUrl);

                // Convert ZIP blob to base64 and save to local storage for offline use
                const zipBase64 = await blobToBase64(zipBlob);
                localStorage.setItem(localStorageKey, zipBase64);
            }

            // Extract files from the ZIP file
            const zip = await JSZip.loadAsync(zipBlob);
            const mediaFiles = await processConfig(zip);

            // Initialize slideshow with media files
            initSlideshow(mediaFiles);
        } catch (error) {
            console.error('Failed to update slideshow:', error);
        }
    }

    function checkForUpdates() {
        setInterval(async () => {
            const nextConfigIndex = currentConfigIndex + 1;
            const zipUrl = `http://localhost:8080/config-${nextConfigIndex}.zip`;

            try {
                const response = await fetch(zipUrl, { method: 'HEAD' });
                if (response.ok) {
                    currentConfigIndex = nextConfigIndex;
                    await updateSlideshow();
                }
            } catch (error) {
                console.error('Error checking for updates:', error);
            }
        }, 60000); // Check every 60 seconds
    }
    // Initial fetch and start slideshow
    updateSlideshow().then(() => {
        checkForUpdates();
    });
});
