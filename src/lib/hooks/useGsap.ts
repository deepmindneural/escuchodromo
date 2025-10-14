import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Nota: ScrollTrigger y TextPlugin requieren la versión premium de GSAP
// Por ahora usaremos las animaciones básicas

export { gsap, useGSAP };

// Animaciones predefinidas reutilizables
export const animacionesGsap = {
  fadeInUp: {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: 'power3.out',
  },
  
  fadeInScale: {
    opacity: 0,
    scale: 0.8,
    duration: 0.8,
    ease: 'back.out(1.7)',
  },
  
  slideInLeft: {
    opacity: 0,
    x: -100,
    duration: 1,
    ease: 'power2.out',
  },
  
  slideInRight: {
    opacity: 0,
    x: 100,
    duration: 1,
    ease: 'power2.out',
  },
  
  rotateIn: {
    opacity: 0,
    rotation: -180,
    scale: 0,
    duration: 1.2,
    ease: 'elastic.out(1, 0.5)',
  },
  
  staggerChildren: {
    stagger: 0.1,
    duration: 0.8,
    ease: 'power2.out',
  },
};

// Timeline preconfigurado para animaciones secuenciales
export const crearTimeline = (opciones = {}) => {
  return gsap.timeline({
    defaults: {
      duration: 1,
      ease: 'power2.inOut',
    },
    ...opciones,
  });
};

// Animación de texto tipo máquina de escribir (simplificada)
export const animacionTextoEscribir = (elemento: string | Element, texto: string, duracion = 2) => {
  const el = typeof elemento === 'string' ? document.querySelector(elemento) : elemento;
  if (!el || !(el instanceof HTMLElement)) return;
  
  let index = 0;
  el.textContent = '';
  
  const interval = setInterval(() => {
    if (index < texto.length) {
      el.textContent += texto[index];
      index++;
    } else {
      clearInterval(interval);
    }
  }, (duracion * 1000) / texto.length);
};

// Animación de parallax simple
export const animacionParallax = (elemento: string | Element, velocidad = 0.5) => {
  const el = typeof elemento === 'string' ? document.querySelector(elemento) : elemento;
  if (!el || !(el instanceof HTMLElement)) return;
  
  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -velocidad;
    el.style.transform = `translateY(${rate}px)`;
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
};

// Animación de hover 3D
export const animacionHover3D = (elemento: HTMLElement) => {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = elemento.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    gsap.to(elemento, {
      rotationX: rotateX,
      rotationY: rotateY,
      duration: 0.3,
      ease: 'power2.out',
      transformPerspective: 1000,
    });
  };
  
  const handleMouseLeave = () => {
    gsap.to(elemento, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  };
  
  elemento.addEventListener('mousemove', handleMouseMove);
  elemento.addEventListener('mouseleave', handleMouseLeave);
  
  return () => {
    elemento.removeEventListener('mousemove', handleMouseMove);
    elemento.removeEventListener('mouseleave', handleMouseLeave);
  };
};