import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Maximize, Minimize, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_OFFER_CONTENT } from '@/hooks/useOfferContent';
import { TitleSlide } from '@/components/sales-deck/slides/TitleSlide';
import { CredibilitySlide } from '@/components/sales-deck/slides/CredibilitySlide';
import { WhyUsSlide } from '@/components/sales-deck/slides/WhyUsSlide';
import { BenefitsSlide } from '@/components/sales-deck/slides/BenefitsSlide';
import { ReportingSlide } from '@/components/sales-deck/slides/ReportingSlide';
import { CreativeSlide } from '@/components/sales-deck/slides/CreativeSlide';
import { OnboardingSlide } from '@/components/sales-deck/slides/OnboardingSlide';
import { CtaSlide } from '@/components/sales-deck/slides/CtaSlide';

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

const slides = [
  TitleSlide,
  CredibilitySlide,
  WhyUsSlide,
  BenefitsSlide,
  ReportingSlide,
  CreativeSlide,
  OnboardingSlide,
  CtaSlide,
];

export default function SalesDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const updateScale = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setScale(Math.min(w / SLIDE_WIDTH, h / SLIDE_HEIGHT));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const goNext = useCallback(() => setCurrentSlide(s => Math.min(s + 1, slides.length - 1)), []);
  const goPrev = useCallback(() => setCurrentSlide(s => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else navigate(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, navigate]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  const SlideComponent = slides[currentSlide];

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#0a0a0a] overflow-hidden select-none"
      style={{ cursor: 'default' }}
    >
      {/* Scaled slide */}
      <div
        className="absolute"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          left: '50%',
          top: '50%',
          marginLeft: -SLIDE_WIDTH / 2,
          marginTop: -SLIDE_HEIGHT / 2,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <SlideComponent data={DEFAULT_OFFER_CONTENT} />
      </div>

      {/* Click zones for navigation */}
      <div className="absolute inset-0 flex">
        <div className="w-1/3 h-full cursor-w-resize" onClick={goPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full cursor-e-resize" onClick={goNext} />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors text-sm backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom nav + indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button onClick={goPrev} className="p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors backdrop-blur-sm disabled:opacity-30" disabled={currentSlide === 0}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'bg-[#94e700] scale-125' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
        <button onClick={goNext} className="p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors backdrop-blur-sm disabled:opacity-30" disabled={currentSlide === slides.length - 1}>
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="text-white/40 text-sm ml-2 font-mono">{currentSlide + 1}/{slides.length}</span>
      </div>
    </div>
  );
}
