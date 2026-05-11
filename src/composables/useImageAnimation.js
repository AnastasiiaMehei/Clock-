import { ref, computed } from 'vue';
import { Subject, interval } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

export function useImageAnimation() {
  const imageAnimations = ref([]);
  const destroy$ = new Subject();

  const animateImagesOnLoad = (images) => {
    imageAnimations.value = images.map((_, index) => ({
      index,
      visible: false,
      opacity: 0
    }));

    images.forEach((_, index) => {
      setTimeout(() => {
        if (imageAnimations.value[index]) {
          imageAnimations.value[index].visible = true;
          
          interval(16)
            .pipe(
              map(i => Math.min(i / 20, 1)), 
              takeUntil(destroy$)
            )
            .subscribe(opacity => {
              if (imageAnimations.value[index]) {
                imageAnimations.value[index].opacity = opacity;
              }
            });
        }
      }, index * 150); 
    });
  };

  const getImageStyle = (index) => {
    const anim = imageAnimations.value[index];
    if (!anim) return {};
    
    return {
      opacity: anim.opacity,
      transform: `perspective(1200px) rotateY(${anim.rotateY}deg) scale(${anim.scale}) translateZ(${anim.opacity * 50}px)`,
      filter: `blur(${anim.blur}px)`,
      transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  };

  const clearAnimations = () => {
    destroy$.next();
    imageAnimations.value = [];
  };

  return {
    animateImagesOnLoad,
    getImageStyle,
    clearAnimations
  };
}
