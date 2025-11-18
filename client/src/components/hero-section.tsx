import heroImage from '@assets/generated_images/Peaceful_dawn_sky_background_73ac280e.png';
import { DailyInspirationCard } from './daily-inspiration-card';

export function HeroSection() {
  return (
    <section 
      className="relative min-h-[80vh] flex items-center justify-center py-20 px-4 overflow-hidden"
      data-testid="section-hero"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
        <div className="space-y-4">
          <h1 
            className="text-5xl md:text-6xl font-semibold text-white drop-shadow-lg"
            data-testid="text-hero-title"
          >
            QuietPrayers
          </h1>
          <p 
            className="text-xl md:text-2xl text-white/95 font-body font-light max-w-2xl mx-auto drop-shadow"
            data-testid="text-hero-subtitle"
          >
            A peaceful space to share your heart and lift others in prayer
          </p>
        </div>
        
        <DailyInspirationCard />
      </div>
    </section>
  );
}
