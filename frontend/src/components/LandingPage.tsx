import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';

// A simple component to handle fade-in animations for text
const AnimatedText = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div style={{
      transition: 'opacity 1.5s ease-in-out, transform 1s ease-in-out',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    }}>
      {children}
    </div>
  );
};

export default function LandingPage({ onGetStarted }) {
  const { open } = useWeb3Modal();
  const { isConnected } = useAccount();

  const handleGetStartedClick = () => {
    if (isConnected) {
      onGetStarted();
    } else {
      open();
    }
  };

  useEffect(() => {
    if (isConnected) {
      onGetStarted();
    }
  }, [isConnected, onGetStarted]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      background: '#0e0e12' // A slightly softer black
    }}>
      {/* Background Spline Animation */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Spline scene="https://prod.spline.design/lcgisAqU3pEUMvzZ/scene.splinecode" />
      </div>

      {/* Gradient Overlay for better text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        background: 'radial-gradient(ellipse at center, rgba(14, 14, 18, 0) 0%, rgba(14, 14, 18, 0.8) 70%, rgba(14, 14, 18, 1) 100%)'
      }} />

      {/* Centered Content */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        pointerEvents: 'none' // Let clicks pass through to the button
      }}>
        <div style={{ maxWidth: '800px' }}>
          <AnimatedText delay={300}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', // Responsive font size
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0px 4px 40px rgba(0, 0, 0, 0.5)',
              lineHeight: 1.1,
            }}>
              The Future of Real Estate is <span style={{ background: 'linear-gradient(90deg, #9555FF, #713DFB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Here</span>.
            </h1>
          </AnimatedText>

          <AnimatedText delay={800}>
            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)', // Responsive font size
              color: '#a0a0b0',
              marginTop: '1.5rem',
              maxWidth: '800px',
              lineHeight: 1.6,
              textShadow: '0px 2px 20px rgba(0, 0, 0, 0.5)',
            }}>
              Tokenize, trade, and manage real-world properties on the blockchain with unparalleled security and liquidity. Welcome to RealEstateX.
            </p>
          </AnimatedText>
        </div>
      </div>

      {/* Button at the Bottom */}
      <div style={{
        position: 'absolute',
        bottom: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
      }}>
        <button
          style={{
            padding: '18px 52px',
            fontSize: '1.2rem',
            fontWeight: 600,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #9555FF 20%, #713DFB 100%)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(126, 73, 251, 0.3)',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
            pointerEvents: 'auto'
          }}
          onClick={handleGetStartedClick}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(126, 73, 251, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(126, 73, 251, 0.3)';
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}