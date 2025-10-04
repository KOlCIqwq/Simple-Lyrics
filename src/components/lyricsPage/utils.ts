import {
    isAlbumRotating,
    rotationDeg,
    setAlbumRotating,
    setRotationDegree,
} from '../../state/lyricsState';

export function handleAlbumRotation() {
    const albumImg = document.getElementById("lyrics-album-image");
    if (!albumImg) return;
    if (isAlbumRotating) {
      const saveAngle = pauseRotation(albumImg);
      setRotationDegree(saveAngle);
    } else {
      resumeRotation(albumImg,rotationDeg);
    }
}
  
export function pauseRotation(albumImg:any) {
    const angle = getCurrentRotation();
  
    albumImg.classList.remove("rotating");
  
    albumImg.style.transform = `rotate(${angle}deg)`;
    setAlbumRotating(false);
  
    return angle;
}
  
export function resumeRotation(albumImg:any, startAngle:number) {
    updateRotationKeyframes(startAngle);
  
    // Reflow to apply the new animation rules
    albumImg.classList.remove("rotating");
    void albumImg.offsetWidth;
    albumImg.classList.add("rotating");
  
    setAlbumRotating(true);
}
  
function getCurrentRotation() {
    const albumImg = document.getElementById("lyrics-album-image");
    if (!albumImg) return 0;
  
    const style = window.getComputedStyle(albumImg);
    const transform = style.getPropertyValue("transform");
  
    if (!transform || transform === "none") {
      return 0; // no rotation
    }
  
    // transform looks like "matrix(a, b, c, d, e, f)"
    const vals = transform.split("(")[1].split(")")[0].split(",");
    const a = Number(vals[0]);
    const b = Number(vals[1]);
  
    let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    if (angle < 0) {
      angle += 360;
    }
    return angle;
}
  
export function updateRotationKeyframes(startAngle = 0) {
    const styleId = "rotation-keyframes-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
  
    styleEl.innerHTML = `
      @keyframes rotation {
        from { transform: rotate(${startAngle}deg); }
        to { transform: rotate(${startAngle + 360}deg); }
      }
  
      #lyrics-album-image.rotating{
        animation: rotation 10s linear infinite;
      }
    `;
}

export function resetLyricsViewScroll() {
    const lyricsScrollContainer = document.getElementById('lyrics-scroll-container');
    if (lyricsScrollContainer) {
      lyricsScrollContainer.scrollTop = 0;
    }
}

export function test(message:string){
    Spicetify.showNotification(message);
}

export function setupAlbumSwiper() {
    const swiperContainer = document.getElementById('album-art-swiper-container');
    const track = document.getElementById('album-art-track') as HTMLElement;
    const nextAlbumImg = document.getElementById('next-album-image') as HTMLImageElement;

    if (!swiperContainer || !track || !nextAlbumImg) return;

    let isSwiping = false;
    let startX = 0;
    let currentTranslate = 0;
    const SWIPE_THRESHOLD = swiperContainer.offsetWidth / 2; // Swipe 50% to trigger skip

    const getNextTrackImageUrl = (): string | null => {
        const nextTracks = Spicetify.Queue.nextTracks;
        if (nextTracks && nextTracks.length > 0) {
            return nextTracks[0].metadata?.image_url || null;
        }
        return null;
    };

    const onSwipeStart = (e: MouseEvent) => {
        isSwiping = true;
        startX = e.clientX;
        track.style.transition = 'none';
        swiperContainer.style.cursor = 'grabbing';

        // Preload the next album image
        const nextImageUrl = getNextTrackImageUrl();
        if (nextImageUrl) {
            nextAlbumImg.src = nextImageUrl;
            nextAlbumImg.style.display = 'block';
        } else {
            nextAlbumImg.style.display = 'none'; // No next song in queue
        }
        e.preventDefault();
    };

    const onSwipeMove = (e: MouseEvent) => {
        if (!isSwiping) return;
        const currentX = e.clientX;
        currentTranslate = currentX - startX;
        
        // Left Swipe
        if (currentTranslate < 0) {
             track.style.transform = `translateX(${currentTranslate}px)`;
             // Here we can let the nextAlbumImage appear
        }
        // Right Swipe
        if (currentTranslate > 0) {
             track.style.transform = `translateX(${currentTranslate}px)`;
        }
    };

    const onSwipeEnd = () => {
        if (!isSwiping) return;
        isSwiping = false;

        track.style.transition = 'transform 0.3s ease-out'; // Re-enable for smooth snapping
        swiperContainer.style.cursor = 'grab';

        // Check if swipe crossed the threshold (only for swiping left)
        if (currentTranslate < -SWIPE_THRESHOLD && nextAlbumImg.src) {
            track.style.transform = `translateX(-50%)`;
            Spicetify.Player.next();
        } else {
            // Snap back to original position
            track.style.transform = 'translateX(0)';
        }
        currentTranslate = 0; // Reset for next swipe
    };

    swiperContainer.addEventListener('mousedown', onSwipeStart);
    // Add listeners to the document to catch mouse movements/releases outside the element
    document.addEventListener('mousemove', onSwipeMove);
    document.addEventListener('mouseup', onSwipeEnd);
    document.addEventListener('mouseleave', onSwipeEnd);
}